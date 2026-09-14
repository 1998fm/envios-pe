import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

const MAX_INTENTOS = 5

// Descuenta stock de un producto de forma atómica: lee el valor actual y
// actualiza condicionando a que nadie lo haya cambiado entre la lectura y la
// escritura (`.eq('stock_actual', valorLeido)`). Si otro proceso lo cambió la
// fila no se toca (0 filas afectadas) y se reintenta. Evita stock negativo y
// descuentos perdidos por carreras concurrentes.
export async function descontarStock(
  productoId: string,
  cantidad: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (let i = 0; i < MAX_INTENTOS; i++) {
    const { data } = await supabaseAdmin
      .from('productos')
      .select('id, stock_actual')
      .eq('id', productoId)
      .single()

    if (!data) return { ok: false, error: `Producto ${productoId} no encontrado` }

    const stock = Number(data.stock_actual ?? 0)
    if (stock < cantidad) {
      return {
        ok: false,
        error: `Stock insuficiente (disponible: ${stock}, requerido: ${cantidad})`,
      }
    }

    const { data: actualizado } = await supabaseAdmin
      .from('productos')
      .update({ stock_actual: stock - cantidad, updated_at: new Date().toISOString() })
      .eq('id', productoId)
      .eq('stock_actual', stock)
      .select('id')

    if (actualizado && actualizado.length > 0) return { ok: true }
  }

  return {
    ok: false,
    error: `No se pudo descontar stock de ${productoId} tras ${MAX_INTENTOS} intentos`,
  }
}

// Suma stock de un producto de forma atómica (mismo patrón que descontarStock).
export async function sumarStock(
  productoId: string,
  cantidad: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (let i = 0; i < MAX_INTENTOS; i++) {
    const { data } = await supabaseAdmin
      .from('productos')
      .select('id, stock_actual')
      .eq('id', productoId)
      .single()

    if (!data) return { ok: false, error: `Producto ${productoId} no encontrado` }

    const stock = Number(data.stock_actual ?? 0)

    const { data: actualizado } = await supabaseAdmin
      .from('productos')
      .update({ stock_actual: stock + cantidad, updated_at: new Date().toISOString() })
      .eq('id', productoId)
      .eq('stock_actual', stock)
      .select('id')

    if (actualizado && actualizado.length > 0) return { ok: true }
  }

  return {
    ok: false,
    error: `No se pudo sumar stock de ${productoId} tras ${MAX_INTENTOS} intentos`,
  }
}