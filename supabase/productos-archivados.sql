-- =============================================================================
-- Archivar productos: columna 'archivado' para separar activos de archivados
-- sin borrar el registro (historial de ventas/compras intacto).
--
-- Cómo aplicar:
--   1) En Supabase: SQL Editor → New query → pega y ejecuta este archivo completo.
-- =============================================================================

alter table public.productos
  add column if not exists archivado boolean not null default false;

create index if not exists productos_profile_archivado_idx
  on public.productos (profile_id, archivado);