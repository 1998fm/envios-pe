-- =============================================
-- PLAN SYSTEM 3 PLANES — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar columna max_miembros si no existe (DEBE IR PRIMERO)
ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS max_miembros INT;

-- 2. Insertar plan Business Plus (ilimitado + booleans TRUE)
INSERT INTO plan_features (plan, max_envios, max_metodos, form_branding, dashboard_completo, envios_masivos, control_logistico, max_productos, max_ventas, max_exportaciones_shalom, max_pedidos_copiar, max_miembros)
VALUES ('business_plus', NULL, NULL, TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, 4)
ON CONFLICT (plan) DO NOTHING;

-- 3. Actualizar Pro a límites definidos (500 envíos, 200 productos, 2000 ventas)
UPDATE plan_features
SET max_envios = 500,
    max_productos = 200,
    max_ventas = 2000,
    max_miembros = 0
WHERE plan = 'pro';

-- 4. Actualizar Básico: export Shalom 8/mes, 0 miembros
UPDATE plan_features
SET max_exportaciones_shalom = 8,
    max_miembros = 0
WHERE plan = 'basic';

-- 5. MIGRACIÓN: todos los 'pro' actuales (trial y pagados) pasan a Business Plus
-- conservando trial_end / pro_until intactos. checkTrialStatus los degrada a basic al expirar.
UPDATE profiles
SET plan = 'business_plus'
WHERE plan = 'pro';