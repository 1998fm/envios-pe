-- ============================================================
-- VINCULAR VENTAS HISTÓRICAS A ENVÍOS
-- Adjudica cada venta sin envio_id al envío pendiente (NO enviado)
-- más reciente del mismo cliente (misma profile_id, DNI o teléfono
-- normalizados), aunque ese envío ya tenga otras ventas. Las compras
-- se acumulan en un pedido hasta que se marque como enviado.
-- Una venta puede compartir envío con otras (ventas múltiples en el
-- mismo pedido). Ejecutar UNA sola vez desde el SQL Editor.
-- ============================================================

UPDATE ventas v
SET envio_id = cand.envio_id
FROM (
  SELECT DISTINCT ON (v.id)
    e.id AS envio_id,
    v.id AS venta_id
  FROM ventas v
  JOIN envios e
    ON e.user_id = v.profile_id
   AND e.estado IN ('NO_EMPACADO', 'EMPACADO', 'EN_OBSERVACION')
   AND (
     (v.persona_dni IS NOT NULL AND v.persona_dni <> ''
      AND e.dni IS NOT NULL AND e.dni <> ''
      AND replace(v.persona_dni, ' ', '') = replace(e.dni, ' ', ''))
     OR
     (v.persona_telefono IS NOT NULL AND v.persona_telefono <> ''
      AND e.telefono IS NOT NULL AND e.telefono <> ''
      AND replace(v.persona_telefono, ' ', '') = replace(e.telefono, ' ', ''))
   )
  WHERE v.estado <> 'ANULADA'
    AND v.envio_id IS NULL
  ORDER BY v.id, e.fecha_registro DESC
) cand
WHERE v.id = cand.venta_id
  AND v.envio_id IS NULL;