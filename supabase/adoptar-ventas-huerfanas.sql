-- ============================================================
-- ADOPTAR VENTAS HUÉRFANAS → ENVÍO RECEPTOR ABIERTO
-- ============================================================
-- Propósito
-- ---------
-- Re-adjudica, de forma puntual y controlada, las ventas que quedaron
-- huérfanas (envio_id = NULL) entre el momento en que el pedido anterior
-- del cliente pasó a EMPACADO (y dejó de recibir) y la creación de su
-- siguiente solicitud de envío.
--
-- Regla de receptor (única, igual que en el código):
--   Un envío es RECEPTOR solo mientras su estado es:
--       'NO_EMPACADO'        (pedido aún sin consolidar)
--       'EN_OBSERVACION'     (pedido en observación)
--   NO_EMPACADO + EN_OBSERVACION reciben; EMPACADO NO.
--   Cuando el pedido pasa a EMPACADO deja de capturar y las ventas nuevas
--   quedan huérfanas hasta que la clienta solicite el próximo envío.
--
-- Como solo existe UN envío receptor abierto por cliente a la vez (el
-- formulario no permite dos pedidos abiertos), la adjudicación es
-- determinista: no hay que elegir entre varios candidatos.
--
-- Ejecutar UNA vez desde el SQL Editor tras aplicar el cambio de regla.
-- ============================================================

WITH receptor_por_venta AS (
  SELECT
    v.id                                        AS venta_id,
    e.id                                        AS envio_id,
    ROW_NUMBER() OVER (
      PARTITION BY v.id
      ORDER BY e.fecha_registro DESC
    )                                           AS rn
  FROM ventas v
  -- Cliente con datos identificables
  CROSS JOIN LATERAL (
    SELECT
      COALESCE(NULLIF(regexp_replace(v.persona_dni, '\s*', '', 'g'), ''),'') || '#' ||
      COALESCE(NULLIF(regexp_replace(v.persona_telefono, '\s*', '', 'g'), ''),'') AS clave_venta
  ) cv
  -- Receptor: envío abierto del MÉSMO usuario que coincide por DNI o
  -- teléfono normalizados. Se restringe a los estados que aún NO hacen
  -- entrega (NO_EMPACADO / EN_OBSERVACION), igual que el código.
  JOIN envios e
    ON e.user_id = v.profile_id
   AND e.estado IN ('NO_EMPACADO', 'EN_OBSERVACION')          -- ← receptor (sin EMPACADO)
   AND (
     (regexp_replace(COALESCE(v.persona_dni, ''), '\s*', '', 'g') <> ''
      AND regexp_replace(COALESCE(e.dni, ''), '\s*', '', 'g')
        = regexp_replace(COALESCE(v.persona_dni, ''), '\s*', '', 'g'))
     OR
     (regexp_replace(COALESCE(v.persona_telefono, ''), '\s*', '', 'g') <> ''
      AND regexp_replace(COALESCE(e.telefono, ''), '\s*', '', 'g')
        = regexp_replace(COALESCE(v.persona_telefono, ''), '\s*', '', 'g'))
   )
  WHERE v.estado <> 'ANULADA'
    AND v.envio_id IS NULL        -- solo huérfanas
)
-- Actualizar SOLO las ventas que lograron encontrar receptor
UPDATE ventas v
SET envio_id = r.envio_id,
    updated_at = now()
FROM receptor_por_venta r
WHERE v.id = r.venta_id
  AND r.rn = 1
  AND v.envio_id IS NULL;

-- ============================================================
-- Después de ejecutar, verifica el resultado:
--   SELECT count(*) FILTER (WHERE envio_id IS NULL) AS siguen_huerfanas,
--          count(*)                                 AS total_no_anuladas
--   FROM ventas
--   WHERE estado <> 'ANULADA';
-- Las que sigan NULL son clientes que NO tienen un envío receptor abierto
-- (su pedido está EMPACADO o aún no pidió otro): se resolverán cuando la
-- clienta solicite su próximo envío (el formulario las adopta solo).
-- ============================================================
