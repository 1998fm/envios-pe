-- =============================================
-- PLAN SYSTEM — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar columna plan a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'basic';

-- 2. Agregar columna trial_end (NULL = sin trial o trial terminado)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- 2b. Agregar columna pro_until (NULL = sin Pro pagado, fecha hasta la que tiene Pro activo)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_until TIMESTAMPTZ;

-- 3. Tabla de configuración de planes
CREATE TABLE IF NOT EXISTS plan_features (
  plan TEXT PRIMARY KEY,
  max_envios INT,
  max_metodos INT,
  form_branding BOOLEAN NOT NULL DEFAULT FALSE,
  dashboard_completo BOOLEAN NOT NULL DEFAULT FALSE,
  envios_masivos BOOLEAN NOT NULL DEFAULT FALSE,
  control_logistico BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Insertar planes por defecto
INSERT INTO plan_features (plan, max_envios, max_metodos, form_branding, dashboard_completo, envios_masivos, control_logistico)
VALUES
  ('basic', 50, 2, FALSE, FALSE, FALSE, FALSE),
  ('pro', NULL, NULL, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (plan) DO NOTHING;
