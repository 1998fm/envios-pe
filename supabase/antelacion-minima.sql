-- =============================================
-- ANTELACIÓN MÍNIMA (días) — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Antelación mínima para Motorizado (1 = comportamiento actual)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logistica_moto_anticipacion INT NOT NULL DEFAULT 1;

-- Antelación mínima para Agencias (1 = comportamiento actual)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logistica_agencias_anticipacion INT NOT NULL DEFAULT 1;
