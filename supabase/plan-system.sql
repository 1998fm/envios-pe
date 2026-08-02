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
  max_productos INT,
  max_ventas INT,
  max_exportaciones_shalom INT,
  max_pedidos_copiar INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3b. Agregar columnas nuevas a plan_features (para tablas existentes)
ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS max_productos INT;
ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS max_ventas INT;
ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS max_exportaciones_shalom INT;
ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS max_pedidos_copiar INT;

-- 4. Insertar planes por defecto
INSERT INTO plan_features (plan, max_envios, max_metodos, form_branding, dashboard_completo, envios_masivos, control_logistico, max_productos, max_ventas, max_exportaciones_shalom, max_pedidos_copiar)
VALUES
  ('basic', 50, 2, FALSE, FALSE, FALSE, FALSE, 50, 100, 10, 50),
  ('pro', NULL, NULL, TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL)
ON CONFLICT (plan) DO NOTHING;

-- 4c. Asegurar valores por defecto
UPDATE plan_features
SET max_productos = 50, max_ventas = 100, max_exportaciones_shalom = 10, max_pedidos_copiar = 50
WHERE plan = 'basic' AND (max_productos IS NULL OR max_ventas IS NULL OR max_exportaciones_shalom IS NULL OR max_pedidos_copiar IS NULL);

UPDATE plan_features
SET max_productos = NULL, max_ventas = NULL, max_exportaciones_shalom = NULL, max_pedidos_copiar = NULL
WHERE plan = 'pro';

-- 5. Registro de exportaciones Shalom (1 fila por operación de export)
CREATE TABLE IF NOT EXISTS shalom_exports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cantidad INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shalom_exports_user_mes_idx
  ON shalom_exports (user_id, created_at DESC);
