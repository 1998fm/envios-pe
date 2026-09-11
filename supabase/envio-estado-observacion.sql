-- =============================================================================
-- Nuevo estado "EN_OBSERVACION" para envíos.
-- El constraint 'estado_valido' no lo contemplaba y rechazaba el UPDATE/INSERT.
--
-- Cómo aplicar:
--   1) En Supabase: SQL Editor → New query → pega y ejecuta este archivo completo.
-- =============================================================================

alter table public.envios
  drop constraint if exists estado_valido;

alter table public.envios
  add constraint estado_valido
  check (estado in ('NO_EMPACADO', 'EMPACADO', 'EN_OBSERVACION', 'ENVIADO'));