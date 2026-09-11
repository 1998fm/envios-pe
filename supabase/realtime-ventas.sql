-- ============================================================
-- REALTIME: habilitar la tabla ventas en la publicación.
-- (envios ya estaba habilitado en realtime-envios.sql)
-- Ejecutar una sola vez en Supabase SQL Editor.
-- ============================================================

alter publication supabase_realtime add table ventas;