-- =============================================
-- MENSAJE DE ÉXITO CON IMAGEN — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Agregar columna para la URL de la imagen del mensaje de éxito
-- (se guarda en el bucket 'logos' bajo la ruta {user.id}/mensaje-exito.{ext})
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS redirect_message_image TEXT;
