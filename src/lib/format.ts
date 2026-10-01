export function fmtSoles(n: number): string {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Convierte lo que escribe el usuario en un número. En el formato peruano la
 * coma agrupa miles, así que un grupo de exactamente 3 dígitos detrás del
 * último separador se interpreta como miles y no como decimal:
 *   "1500"      -> 1500      "1,500"     -> 1500
 *   "1,500.50"  -> 1500.5    "1500,50"   -> 1500.5
 *   "1.500,50"  -> 1500.5    "S/ 1 200"  -> 1200
 *   "0.99"      -> 0.99      "45.5"      -> 45.5
 * Devuelve null si no hay ningún dígito.
 */
export function parsearNumero(input: string): number | null {
  const limpio = String(input).replace(/[^\d.,]/g, '')
  if (!limpio) return null

  const ultimo = Math.max(limpio.lastIndexOf(','), limpio.lastIndexOf('.'))
  let normalizado = limpio

  if (ultimo >= 0) {
    const entero = limpio.slice(0, ultimo).replace(/[.,]/g, '')
    const decimal = limpio.slice(ultimo + 1).replace(/[.,]/g, '')
    // 3 dígitos detrás => grupo de miles ("1,500", "1.500,00" no cae aquí)
    normalizado = decimal.length === 3 ? `${entero}${decimal}` : `${entero}${decimal ? `.${decimal}` : ''}`
  }

  const n = parseFloat(normalizado)
  return Number.isFinite(n) ? n : null
}

/** Formato para mostrar mientras el usuario no está escribiendo. */
export function fmtMontoCorto(n: number, entero = false): string {
  return n.toLocaleString('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: entero ? 0 : 2,
  })
}

export function fmtFecha(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

export function fmtFechaLarga(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
}