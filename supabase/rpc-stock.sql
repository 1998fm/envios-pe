-- ============================================================
-- RPC STOCK ATÓMICO (reemplaza el "CAS triplicado" de src/lib/stock.ts)
-- ============================================================
--
-- PROBLEMA QUE RESUELVE
-- --------------------
-- Antes, lib/stock.ts repetía TRES VECES el mismo patrón compare-and-set:
--   1) leer stock_actual
--   2) calcular el nuevo valor en JS
--   3) UPDATE condicionado a `.eq('stock_actual', valorLeido)`
--   4) si 0 filas (otro proceso lo cambió entre la lectura y la escritura)
--      → reintentar hasta MAX_INTENTOS, con reintento dentro del mismo archivo.
--
-- Eso dejaba una ventana de carrera: dos ventas simultáneas al mismo
-- producto → una de las dos reintenta → a veces FALLA con "tras 5 intentos"
-- aunque hubiera stock. Y la regla "nunca negativo" vivía duplicada en las 3
-- funciones del archivo (el mismo tipo de problema que corregimos con el
-- receptor EMPACADO: regla copiada en varios lugares).
--
-- SOLUCIÓN
-- --------
-- Chequeo + descuento en UNA sola instrucción SQL atómica en la base:
-- el UPDATE con guarda `stock_actual >= p_cantidad` garantiza que el stock
-- NUNCA quede negativo, y al ser una única sentencia la base lo serializa.
-- Sin lectura previa, sin bucle, sin reintentos.
--
-- Las 3 funciones matchean el contrato que exige lib/stock.ts:
--   * parámetros : p_producto_id (uuid) y p_cantidad (int)
--   * retorno    : TABLE (stock_final int)  → 1 fila = se aplicó,
--                                            0 filas = guarda no pasó
--                 (el código distingue "no encontrado" vs "insuficiente"
--                  con una lectura ligera SOLO en el caso de 0 filas)
--
-- CÓMO APLICAR
-- ------------
-- Supabase → SQL Editor → New query → pegar TODO este archivo → Run.
-- Es idempotente (CREATE OR REPLACE): se puede repetir sin daño.
-- Ejecutarlo ANTES de que la app nueva (que llama a estos RPC) quede activa.
-- ============================================================

-- ── Descontar stock (Ventas): atómico, nunca negativo ─────────────
CREATE OR REPLACE FUNCTION descontar_stock(
  p_producto_id uuid,
  p_cantidad    integer
)
RETURNS TABLE (stock_final integer)
LANGUAGE sql
VOLATILE                    -- hace UPDATE → NO es STABLE/IMMUTABLE
AS $$
  UPDATE productos
     SET stock_actual = stock_actual - p_cantidad,
         updated_at   = now()
   WHERE id             = p_producto_id
     AND stock_actual   >= p_cantidad      -- guarda atómica (sin stock negativo)
  RETURNING stock_actual::integer AS stock_final;
$$;

-- ── Sumar stock (Compras / reversiones de venta): atómico ─────────
CREATE OR REPLACE FUNCTION sumar_stock(
  p_producto_id uuid,
  p_cantidad    integer
)
RETURNS TABLE (stock_final integer)
LANGUAGE sql
VOLATILE
AS $$
  UPDATE productos
     SET stock_actual = stock_actual + p_cantidad,
         updated_at   = now()
   WHERE id = p_producto_id
  RETURNING stock_actual::integer AS stock_final;
$$;

-- ── Restar stock (anular Compras): permite NEGATIVO a propósito ────
-- A diferencia de descontar_stock NO tiene guarda: al anular una compra
-- cuyos ítems ya pudieron venderse, el stock puede quedar negativo (mismo
-- comportamiento que el código anterior). Solo se evita la carrera.
CREATE OR REPLACE FUNCTION restar_stock(
  p_producto_id uuid,
  p_cantidad    integer
)
RETURNS TABLE (stock_final integer)
LANGUAGE sql
VOLATILE
AS $$
  UPDATE productos
     SET stock_actual = stock_actual - p_cantidad,
         updated_at   = now()
   WHERE id = p_producto_id
  RETURNING stock_actual::integer AS stock_final;
$$;

-- ============================================================
-- VERIFICACIÓN (opcional, tras ejecutar):
--   SELECT proname
--   FROM pg_proc
--   WHERE proname IN ('descontar_stock','sumar_stock','restar_stock')
--   ORDER BY proname;
-- Esperado: 3 filas. Cero filas = algo no se creó.
-- NOTA: NO probar ejecutando las funciones "a mano" sobre productos reales
-- (descontarían/sumarían stock de verdad). Con confirmar que existen basta.
-- ============================================================
