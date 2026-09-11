-- ============================================================
-- VINCULAR VENTAS HISTÓRICAS A ENVÍOS
-- Une cada venta sin envio_id al envío pendiente del mismo
-- cliente (misma profile_id, DNI o teléfono normalizados).
-- Cada envío recibe a lo sumo una venta (la más reciente).
-- Ejecutar UNA sola vez desde el SQL Editor.
-- ============================================================

UPDATE ventas v
SET envio_id = cand.envio_id
FROM (
  SELECT DISTINCT ON (e.id)
    e.id AS envio_id,
    v.id AS venta_id
  FROM envios e
  JOIN ventas v
    ON v.profile_id = e.user_id
   AND v.estado <> 'ANULADA'
   AND v.envio_id IS NULL
   AND (
     (v.persona_dni IS NOT NULL AND v.persona_dni <> ''
      AND e.dni IS NOT NULL AND e.dni <> ''
      AND replace(v.persona_dni, ' ', '') = replace(e.dni, ' ', ''))
     OR
     (v.persona_telefono IS NOT NULL AND v.persona_telefono <> ''
      AND e.telefono IS NOT NULL AND e.telefono <> ''
      AND replace(v.persona_telefono, ' ', '') = replace(e.telefono, ' ', ''))
   )
  WHERE e.estado IN ('NO_EMPACADO', 'EN_OBSERVACION')
  ORDER BY e.id, v.created_at DESC
) cand
WHERE v.id = cand.venta_id
  AND v.envio_id IS NULL;