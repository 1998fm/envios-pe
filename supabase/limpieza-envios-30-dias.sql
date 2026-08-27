-- =============================================
-- LIMPIEZA AUTOMÁTICA — Envios.pe
-- Elimina envíos ENVIADO de +30 días SOLO para usuarios en plan Básico
-- (pro / business_plus NO se tocan). Las ventas vinculadas conservan su
-- estado_envio (COMPLETADO) y solo se desvinculan (envio_id = NULL).
--
-- Requiere la extensión pg_cron habilitada en Supabase:
--   Database  →  Extensions  →  habilitar "pg_cron"
-- Ejecutar este archivo en el SQL Editor de Supabase.
-- =============================================

-- Tabla de auditoría de la limpieza (guarda trazabilidad y contadores)
create table if not exists limpieza_envios_log (
  id bigserial primary key,
  ejecutada_en timestamptz not null default now(),
  elegibles integer not null default 0,          -- envíos ENVIADO >30d en plan Básico (candidatos a borrar)
  borrados integer not null default 0,            -- envíos efectivamente eliminados
  no_borrados_pro_plus integer not null default 0, -- ENVIADO >30d de usuarios Pro/Business Plus (NO se borran)
  total_envios integer not null default 0         -- total de envíos en la BD en ese momento
);

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
  v_total integer;
  v_envio record;
  v_borrados integer := 0;
begin
  -- Contadores previos (comparar eliminados vs no eliminados)
  select count(*) into v_total from envios;

  -- Envíos ENVIADO >30 días de usuarios Básico efectivo (los que se van a borrar)
  select count(*) into v_elegibles
  from envios e
  join profiles p on p.id = e.user_id
  where
    e.estado = 'ENVIADO'
    and e.fecha_registro <= now() - interval '30 days'
    and (p.pro_until is null or p.pro_until <= now())
    and (
      p.trial_end is null
      or p.trial_end <= now()
      or p.plan not in ('pro', 'business_plus')
    );

  -- Envíos ENVIADO >30 días de usuarios Pro/Business Plus ACTIVO
  -- (NO se borran; sirven para comparar la cuenta)
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

  -- Borrar los elegibles (plan Básico)
  for v_envio in
    select e.id
    from envios e
    join profiles p on p.id = e.user_id
    where
      e.estado = 'ENVIADO'
      and e.fecha_registro <= now() - interval '30 days'
      and (p.pro_until is null or p.pro_until <= now())
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

  -- Registrar la ejecución en el log (elegibles vs borrados vs no eliminados)
  insert into limpieza_envios_log (elegibles, borrados, no_borrados_pro_plus, total_envios)
  values (v_elegibles, v_borrados, v_no_pro_plus, v_total);

  return v_borrados;
end;
$$;

-- Pregunta: cómo comparar eliminados vs no eliminados (consulta de ejemplo):
--   select ejecutada_en, elegibles, borrados,
--          no_borrados_pro_plus,
--          total_envios,
--          (total_envios - borrados) as no_eliminados
--   from limpieza_envios_log order by id desc;

-- Programar la limpieza diaria a las 03:00 (hora del servidor, UTC)
select cron.schedule(
  'limpiar-envios-basico-30-dias',   -- nombre del job
  '0 3 * * *',                        -- cron: todos los días a las 03:00
  $$ select limpiar_envios_basico_antiguos(); $$
);

-- Para probar manualmente:
-- select limpiar_envios_basico_antiguos();
