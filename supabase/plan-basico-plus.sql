-- Dos planes comerciales. Idempotente; no modifica importes de suscripciones,
-- recibos, datos de operación ni las fechas de pruebas o pagos existentes.
BEGIN;
UPDATE plan_features SET
  max_envios = NULL, max_productos = 0, max_ventas = 0,
  max_exportaciones_shalom = 0, max_pedidos_copiar = 0,
  dashboard_completo = FALSE, envios_masivos = FALSE, max_miembros = 0
WHERE plan = 'basic';
UPDATE plan_features SET
  max_envios = NULL, max_metodos = NULL, max_productos = NULL, max_ventas = NULL,
  max_exportaciones_shalom = NULL, max_pedidos_copiar = NULL,
  form_branding = TRUE, dashboard_completo = TRUE, envios_masivos = TRUE,
  control_logistico = TRUE, max_miembros = 4
WHERE plan = 'business_plus';
-- Compatibilidad: los antiguos Pro conservan trial_end y pro_until.
UPDATE profiles SET plan = 'business_plus' WHERE plan = 'pro';
DELETE FROM plan_features WHERE plan = 'pro';
COMMIT;
