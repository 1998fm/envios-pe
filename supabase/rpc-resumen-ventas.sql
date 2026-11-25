-- ============================================================
-- RESUMEN DE VENTAS EN LA BASE
-- ============================================================
-- Reduce el egress de Supabase: la franja de totales de Ventas se calcula con
-- sum/count en la base (unos cientos de bytes) en vez de bajar hasta 5.000
-- ventas con sus items para sumarlas en Node.
--
-- Idempotente. Solo la usa el servidor (service_role).

-- Resumen de ventas (mismas reglas que calcularResumenVentas en ventasUI.ts):
--  · las anuladas cuentan en "ventas" y "porEstado", pero no en dinero ni ganancia;
--  · la ganancia solo usa ventas con costo conocido (todas sus líneas con costo).
CREATE OR REPLACE FUNCTION public.resumen_ventas(p_owner uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      v.estado,
      coalesce(v.total, 0)        AS total,
      coalesce(v.monto_pagado, 0) AS pagado,
      (SELECT count(*) FROM public.venta_items i WHERE i.venta_id = v.id)                              AS n_items,
      (SELECT count(*) FROM public.venta_items i WHERE i.venta_id = v.id AND i.costo_unitario IS NULL) AS n_sin_costo,
      (SELECT coalesce(sum(i.costo_unitario * i.cantidad), 0) FROM public.venta_items i WHERE i.venta_id = v.id) AS costo
    FROM public.ventas v
    WHERE v.profile_id = p_owner
  ),
  activas AS (
    SELECT *, (n_items > 0 AND n_sin_costo = 0) AS con_costo
    FROM base WHERE estado <> 'ANULADA'
  ),
  agg AS (
    SELECT
      count(*)                                                    AS n,
      coalesce(sum(total), 0)                                     AS monto,
      coalesce(sum(pagado), 0)                                    AS pagado,
      coalesce(sum(total - pagado) FILTER (WHERE pagado < total), 0) AS por_cobrar,
      coalesce(sum(costo) FILTER (WHERE con_costo), 0)            AS costo,
      coalesce(sum(total - costo) FILTER (WHERE con_costo), 0)    AS ganancia,
      coalesce(sum(total - costo) FILTER (WHERE con_costo AND pagado < total), 0) AS ganancia_por_cobrar,
      count(*) FILTER (WHERE NOT con_costo)                       AS sin_costo
    FROM activas
  )
  SELECT jsonb_build_object(
    'ventas',    (SELECT count(*) FROM base),
    'porEstado', jsonb_build_object(
      'COMPLETADA', (SELECT count(*) FROM base WHERE estado = 'COMPLETADA'),
      'PENDIENTE',  (SELECT count(*) FROM base WHERE estado = 'PENDIENTE'),
      'ANULADA',    (SELECT count(*) FROM base WHERE estado = 'ANULADA')
    ),
    'monto',     round(a.monto, 2),
    'cobrado',   round(least(a.monto, a.pagado), 2),
    'porCobrar', round(a.por_cobrar, 2),
    'ticketPromedio', CASE WHEN a.n > 0 THEN round(a.monto / a.n, 2) ELSE 0 END,
    'costo',     round(a.costo, 2),
    'ganancia',  round(a.ganancia, 2),
    'pctGanancia', CASE WHEN a.monto > 0 THEN round(a.ganancia / a.monto * 100, 2) ELSE 0 END,
    'gananciaPorCobrar', round(a.ganancia_por_cobrar, 2),
    'ventasSinCosto', a.sin_costo,
    'truncado',  false
  )
  FROM agg a;
$$;

REVOKE ALL ON FUNCTION public.resumen_ventas(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resumen_ventas(uuid) TO service_role;
