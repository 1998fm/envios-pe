-- =============================================
-- LIMPIEZA AUTOMÁTICA — Envios.pe
-- Elimina envíos ENVIADO de +30 días SOLO para usuarios en plan Básico
-- (pro / business_plus NO se tocan). Las ventas vinculadas conservan su
-- estado_envio (COMPLETADO) y solo se desvinculan (envio_id = NULL).
--
-- REGLA DE GRACIA (actualizada):
--   * Básico que NUNCA pagó            -> se borran sus ENVIADO a los 30 días.
--   * Ex-miembro (pagó alguna vez y su
--     pro_until venció)                -> período de gracia de 90 días desde el
--     vencimiento para poder renovar; SOLO entonces se borran sus ENVIADO.
--
-- Requiere la extensión pg_cron. Si el paso 1 falla con
-- "schema cron does not exist", habilítala desde:
--   Dashboard de Supabase → Database → Extensions → pg_cron → habilitar
--   O ejecuta:  create extension if not exists pg_cron;
--
-- PASOS:
--   1) Ejecutar SOLO el paso 1 (habilitar extensión) si hace falta
--   2) Ejecutar el resto del archivo (tabla + función + programar cron)
-- =============================================

-- PASO 1: HABILITAR pg_cron (ejecutar aislado si el schema "cron" no existe)
-- create extension if not exists pg_cron;

-- PASO 2 en adelante:

-- Tabla de auditoría de la limpieza (guarda trazabilidad y contadores)
create table if not exists limpieza_envios_log (
  id bigserial primary key,
  ejecutada_en timestamptz not null default now(),
  elegibles integer not null default 0,          -- ENVIADO >30d en plan Básico (candidatos a borrar)
  borrados integer not null default 0,            -- envíos efectivamente eliminados
  no_borrados_pro_plus integer not null default 0, -- ENVIADO >30d de usuarios Pro/Business Plus (NO se borran)
  en_espera_gracia integer not null default 0,    -- ENVIADO >30d de ex-miembros en los 90 días de gracia (NO se borran)
  total_envios integer not null default 0         -- total de envíos en la BD en ese momento
);

-- Columna nueva (idempotente por si la tabla ya existía)
alter table limpieza_envios_log add column if not exists en_espera_gracia integer not null default 0;

-- Función de limpieza
create or replace function limpiar_envios_basico_antiguos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_elegibles integer;
  v_no_pro_plus integer;
  v_en_espera integer;
  v_total integer;
  v_envio record;
  v_borrados integer := 0;
begin
  -- Contador total de envíos en la BD
  select count(*) into v_total from envios;

  -- ============================================================
  -- 1) CANDIDATOS A BORRAR (plan Básico efectivo)
  --      - pro_until null (nunca pagó): envio +30 días
  --      - pro_until vencido hace MÁS de 90 días (ex-miembro
  --        fuera de gracia): envio +30 días
  -- ============================================================
  select count(*) into v_elegibles
  from envios e
  join profiles p on p.id = e.user_id
  where
    e.estado = 'ENVIADO'
    and e.fecha_registro <= now() - interval '30 days'
    and (p.pro_until is null or p.pro_until <= now())
    and (
      p.pro_until is null
      or (
        p.pro_until is not null
        and p.pro_until <= now() - interval '90 days'
      )
    )
    and (
      p.trial_end is null
      or p.trial_end <= now()
      or p.plan not in ('pro', 'business_plus')
    );

  -- ============================================================
  -- 2) EN ESPERA DE GRACIA (ex-miembros con pro_until vencido
  --    en los últimos 90 días): NO se borran todavía
  -- ============================================================
  select count(*) into v_en_espera
  from envios e
  join profiles p on p.id = e.user_id
  where
    e.estado = 'ENVIADO'
    and e.fecha_registro <= now() - interval '30 days'
    and p.pro_until is not null
    and p.pro_until <= now()
    and p.pro_until > now() - interval '90 days'
    and (
      p.trial_end is null
      or p.trial_end <= now()
      or p.plan not in ('pro', 'business_plus')
    );

  -- ============================================================
  -- 3) ENVÍOS ENVIADO >30d DE PRO/BUSINESS PLUS ACTIVO
  --    (NO se borran; sirven para el comparativo de la cuenta)
  -- ============================================================
  select count(*) into v_no_pro_plus
  from envios e
  join profiles p on p.id = e.user_id
  where
    e.estado = 'ENVIADO'
    and e.fecha_registro <= now() - interval '30 days'
    and (
      (p.pro_until is not null and p.pro_until > now())
      or (
        p.trial_end is not null and p.trial_end > now()
        and p.plan in ('pro', 'business_plus')
      )
    );

  -- ============================================================
  -- 4) BORRAR candidatos (misma condición que el contador 1)
  -- ============================================================
  for v_envio in
    select e.id
    from envios e
    join profiles p on p.id = e.user_id
    where
      e.estado = 'ENVIADO'
      and e.fecha_registro <= now() - interval '30 days'
      and (p.pro_until is null or p.pro_until <= now())
      and (
        p.pro_until is null
        or (
          p.pro_until is not null
          and p.pro_until <= now() - interval '90 days'
        )
      )
      and (
        p.trial_end is null
        or p.trial_end <= now()
        or p.plan not in ('pro', 'business_plus')
      )
  loop
    -- Desvincular ventas (conservan su estado_envio actual, p.ej. COMPLETADO)
    update ventas
       set envio_id = null,
           updated_at = now()
     where envio_id = v_envio.id;

    -- Eliminar items del envío (aunque cascade, explícito por robustez)
    delete from envio_items where envio_id = v_envio.id;

    -- Eliminar el envío
    delete from envios where id = v_envio.id;

    v_borrados := v_borrados + 1;
  end loop;

  -- Registrar la ejecución en el log
  insert into limpieza_envios_log (elegibles, borrados, no_borrados_pro_plus, en_espera_gracia, total_envios)
  values (v_elegibles, v_borrados, v_no_pro_plus, v_en_espera, v_total);

  return v_borrados;
end;
$$;

-- Pregunta: cómo comparar eliminados vs en espera de gracia:
--   select ejecutada_en, elegibles, borrados,
--          no_borrados_pro_plus,
--          en_espera_gracia,
--          total_envios
--   from limpieza_envios_log order by id desc;

-- Programar la limpieza diaria (si la extensión pg_cron ya está activa,
-- reemplaza el job existente con el mismo nombre si lo hubiera).
do $cronbloque$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule(
      'limpiar-envios-basico-30-dias',  -- nombre del job
      '0 3 * * *',                      -- cron: todos los días a las 03:00 UTC
      $$ select limpiar_envios_basico_antiguos(); $$
    );
    raise notice 'Cron programado correctamente (diario 03:00 UTC).';
  else
    raise notice 'AVISO: la extensión pg_cron no está habilitada. '
                 'Habilítala en Database -> Extensions -> pg_cron (o ejecuta: '
                 'create extension if not exists pg_cron;) y vuelve a ejecutar '
                 'este bloque. La función de limpieza ya quedó creada.';
  end if;
end $cronbloque$;

-- Para probar manualmente:
-- select limpiar_envios_basico_antiguos();