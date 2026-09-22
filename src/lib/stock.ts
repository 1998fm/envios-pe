import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

// ============================================================
// STOCK ATÓMICO vía RPC (anti-CAS)
// ============================================================
// Antes: 3 funciones repetían el mismo "compare-and-set" con bucle:
//   leer stock → calcular en JS → UPDATE condicionado a .eq('stock_actual', x)
//   → si 0 filas (otro proceso lo cambió) → reintentar hasta MAX_INTENTOS.
// Eso dejaba una ventana de carrera: dos ventas simultáneas al mismo
// producto → una reintenta → a veces falla con "tras N intentos" aunque
// HAYA stock. Y la regla "nunca negativo" vivía triplicada.
//
// Ahora: chequeo + descuento en UNA sola instrucción SQL atómica en la base
// (supabase/rpc-stock.sql). La guarda `stock_actual >= p_cantidad` hace que
// el UPDATE no toque la fila si no alcanza → stock NUNCA negativo, sin bucle
// ni reintentos en el cliente. Si la base devuelve 0 filas se hace UNA
// lectura ligera adicional SOLO para distinguir "no encontrado" de
// "insuficiente" (no corre en el flujo feliz).
// ============================================================

type ResultadoStock = { ok: true } | { ok: false; error: string }

// Extrae el stock final del retorno del RPC. Devuelve null si la base no
// tocó ninguna fila (stock insuficiente o producto inexistente).
function stockFinalDe(data: unknown): number | null {
  const filas = Array.isArray(data)
    ? (data as Array<{ stock_final?: unknown }>)
    : []
  if (filas.length === 0) return null

  const valor = Number(filas[0].stock_final)
  return Number.isFinite(valor) ? valor : null
}

// Descuenta stock de un producto de forma ATÓMICA en la base: el chequeo de
// "alcanza" y el descuento ocurren en UNA instrucción (guarda en el UPDATE),
// por lo que nunca hay stock negativo y no se pierden descuentos por carreras
// concurrentes. Si no hay suficiente (o el producto no existe) la guarda no
// toca la fila → 0 filas → acá se distingue con una lectura ligera.
export async function descontarStock(
  productoId: string,
  cantidad: number,
  referenciaId?: string | null,
  tipo: 'VENTA' | 'EDICION_VENTA' = 'VENTA',
  motivo?: string | null
): Promise<ResultadoStock> {
  const { data, error } = await supabaseAdmin.rpc('descontar_stock', {
    p_producto_id: productoId,
    p_cantidad: cantidad,
    p_referencia_id: referenciaId ?? null,
    p_tipo: tipo,
    p_motivo: motivo ?? null,
  })

  if (error) return { ok: false, error: error.message }

  if (stockFinalDe(data) !== null) return { ok: true }

  // 0 filas → producto inexistente o stock insuficiente. Una lectura ligera
  // SOLO en este caso (raro), para dar un mensaje honesto.
  const { data: existente } = await supabaseAdmin
    .from('productos')
    .select('stock_actual')
    .eq('id', productoId)
    .single()

  if (!existente) return { ok: false, error: `Producto ${productoId} no encontrado` }

  return {
    ok: false,
    error: `Stock insuficiente (disponible: ${Number(existente.stock_actual ?? 0)}, requerido: ${cantidad})`,
  }
}

// Suma stock de forma atómica (compras, reversiones de venta). Sin bucle.
export async function sumarStock(
  productoId: string,
  cantidad: number,
  referenciaId?: string | null,
  tipo: 'COMPRA' | 'ANULACION_VENTA' | 'EDICION_VENTA' = 'COMPRA',
  motivo?: string | null
): Promise<ResultadoStock> {
  const { data, error } = await supabaseAdmin.rpc('sumar_stock', {
    p_producto_id: productoId,
    p_cantidad: cantidad,
    p_referencia_id: referenciaId ?? null,
    p_tipo: tipo,
    p_motivo: motivo ?? null,
  })

  if (error) return { ok: false, error: error.message }

  if (stockFinalDe(data) !== null) return { ok: true }

  return { ok: false, error: `Producto ${productoId} no encontrado` }
}

// Resta stock de forma atómica (anular compras). El RPC ahora BLOQUEA la
// operación si el stock no alcanza (no deja qué el inventario quede
// negativo anulando una compra cuyos ítems ya se vendieron). Si ocurre,
// devuelve un error claro para que la ruta informe al usuario.
export async function restarStock(
  productoId: string,
  cantidad: number
): Promise<ResultadoStock> {
  const { data, error } = await supabaseAdmin.rpc('restar_stock', {
    p_producto_id: productoId,
    p_cantidad: cantidad,
    p_referencia_id: null,
    p_tipo: 'ANULACION_COMPRA',
    p_motivo: null,
  })

  if (error) return { ok: false, error: error.message }

  if (stockFinalDe(data) !== null) return { ok: true }

  // 0 filas → producto inexistente o stock insuficiente (el RPC ahora
  // bloquea la operación para que el stock nunca quede negativo).
  const { data: existente } = await supabaseAdmin
    .from('productos')
    .select('stock_actual')
    .eq('id', productoId)
    .single()

  if (!existente) return { ok: false, error: `Producto ${productoId} no encontrado` }

  return {
    ok: false,
    error: `No se puede anular la compra: el stock ya se vendió (disponible: ${Number(existente.stock_actual ?? 0)}, requerido: ${cantidad}).`,
  }
}

// ============================================================
// RPC ATOMICOS de operaciones completas (editar/anular/eliminar venta)
// ============================================================
// Estas operaciones se ejecutan en UNA sola transacción en Postgres:
// si cualquier paso falla, la base revierte TODO (stock + items + venta).
// También dejan registro en el kardex (movimientos_inventario).

export type ItemVentaEditar = {
  producto_id?: string | null
  producto_nombre?: string
  cantidad?: number
  precio_unitario?: number
  costo_unitario?: number
}

export async function editarVentaAtomico(
  ventaId: string,
  params: {
    items: ItemVentaEditar[]
    metodo_pago?: string | null
    persona_nombre?: string | null
    persona_dni?: string | null
    monto_pagado?: number | null
  }
): Promise<{ data: unknown | null; error: string | null }> {
  const { data, error } = await supabaseAdmin.rpc('editar_venta_atomico', {
    p_venta_id: ventaId,
    p_items: params.items,
    p_metodo_pago: params.metodo_pago ?? null,
    p_persona_nombre: params.persona_nombre ?? null,
    p_persona_dni: params.persona_dni ?? null,
    p_monto_pagado: params.monto_pagado ?? null,
  })
  return { data: data ?? null, error: error ? error.message : null }
}

export async function anularVentaAtomico(
  ventaId: string
): Promise<{ data: unknown | null; error: string | null }> {
  const { data, error } = await supabaseAdmin.rpc('anular_venta_atomico', {
    p_venta_id: ventaId,
  })
  return { data: data ?? null, error: error ? error.message : null }
}

export async function eliminarVentaAtomico(
  ventaId: string
): Promise<{ data: unknown | null; error: string | null }> {
  const { data, error } = await supabaseAdmin.rpc('eliminar_venta_atomico', {
    p_venta_id: ventaId,
  })
  return { data: data ?? null, error: error ? error.message : null }
}

// Ajuste de inventario con motivo OBLIGATORIO (registra AJUSTE en el kardex)
export async function ajustarStock(
  productoId: string,
  stockNuevo: number,
  motivo: string
): Promise<ResultadoStock> {
  const { data, error } = await supabaseAdmin.rpc('ajustar_stock', {
    p_producto_id: productoId,
    p_stock_nuevo: stockNuevo,
    p_motivo: motivo,
  })

  if (error) return { ok: false, error: error.message }
  if (stockFinalDe(data) !== null) return { ok: true }
  return { ok: false, error: `Producto ${productoId} no encontrado` }
}
