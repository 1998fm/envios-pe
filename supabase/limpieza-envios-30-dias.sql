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

-- Tabla de auditoría de la limpieza (opcional, guarda trazabilidad)
create table if not exists limpieza_envios_log (
  id bigserial primary key,
  ejecutada_en timestamptz not null default now(),
  envios_borrados integer not null default 0,
  detalle_ids uuid[]
);

-- Función de limpieza
create or replace function limpiar_envios_basico_antiguos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  borrados integer := 0;
  v_envio record;
begin
  for v_envio in
    select e.id
    from envios e
    join profiles p on p.id = e.user_id
    where
      e.estado = 'ENVIADO'
      and e.fecha_registro <= now() - interval '30 days'
      -- Solo plan Básico efectivo: sin pro/business_plus activo (pagado o trial)
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

    borrados := borrados + 1;
  end loop;

  -- Registrar la ejecución en el log
  insert into limpieza_envios_log (envios_borrados)
  values (borrados);

  return borrados;
end;
$$;

-- Programar la limpieza diaria a las 03:00 (hora del servidor, UTC)
select cron.schedule(
  'limpiar-envios-basico-30-dias',   -- nombre del job
  '0 3 * * *',                        -- cron: todos los días a las 03:00
  $$ select limpiar_envios_basico_antiguos(); $$
);

-- Para probar manualmente:
-- select limpiar_envios_basico_antiguos();
