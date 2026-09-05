-- ============================================================
-- Migración: agencias_shalom.recibe
-- Marca qué agencias SÍ reciben paquetes del público.
-- Se deriva de `ter_categoria_recibe` en la data oficial de Shalom:
--   - recibe = true  → la agencia acepta paquetes (tiene categoría de recepción)
--   - recibe = false → centro de acopio interno, terminal aeroportuaria,
--                      solo-envío, sucursal pendiente, etc. (NO acepta paquetes)
--
-- Después de ejecutar esto, corre el sync de agencias desde el panel admin
-- (o POST /api/shalom/sync) para llenar el flag con la data vigente de Shalom.
-- Mientras no haya resync, el endpoint /api/shalom/agencias cae al JSON
-- estático (que ya viene filtrado), así el cambio es inmediato.
-- ============================================================

ALTER TABLE agencias_shalom
  ADD COLUMN IF NOT EXISTS recibe BOOLEAN NOT NULL DEFAULT FALSE;