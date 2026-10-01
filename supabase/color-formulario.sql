-- ============================================================
-- COLOR PERSONALIZADO DEL FORMULARIO PÚBLICO
-- ============================================================
-- Añade dos columnas en profiles: color principal y secundario
-- del formulario público (/f/[slug]), guardados como HEX (#rrggbb).
-- Por defecto se usan los colores actuales del tema:
--   principal = #0284c7 (sky-600), secundario = #4f46e5 (indigo-600).
--
-- Pasos:
--   1) Ejecutar este ALTER.
--   2) Ejecutar (de nuevo) supabase/rpc-guardar-configuracion.sql que
--      ya incluye los parámetros p_color_formulario_primario/secundario.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS color_formulario_primario text NOT NULL DEFAULT '#0284c7',
  ADD COLUMN IF NOT EXISTS color_formulario_secundario text NOT NULL DEFAULT '#4f46e5';