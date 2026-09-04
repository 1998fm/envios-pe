// Normaliza el nombre de un distrito de motorizado para comparaciones
// insensibles a mayúsculas, espacios, tildes y a la abreviatura "Sta." / "Sta".
// Útil porque el origen de verdad (distritos-moto.json) puede renombrarse y
// los precios guardados en tarifas_moto (JSONB) pueden quedar con claves
// antiguas ("STA. CLARA" vs "SANTA CLARA").
export function normalizarDistrito(nombre?: string | null): string {
  if (!nombre) return ''
  let s = String(nombre)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[\u0300-\u036f]/g, '')

  // "sta." / "sta" -> "santa" (también cubre "Sta. Clara")
  s = s.replace(/\bsta\.?\b/g, 'santa')

  return s
}

// Busca, dentro de un objeto de tarifas, el precio correspondiente a un
// distrito, comparando las claves de forma normalizada. Devuelve el primer
// valor encontrado o else.
export function buscarPrecioPorDistrito(
  tarifas: Record<string, unknown> | null | undefined,
  distrito?: string | null
): number | null {
  if (!tarifas || !distrito) return null

  const objetivo = normalizarDistrito(distrito)

  // 1) Coincidencia exacta directa.
  if (tarifas[distrito] != null) {
    return Number(tarifas[distrito]) || null
  }

  // 2) Coincidencia normalizada.
  const entrada = Object.entries(tarifas).find(
    ([k]) => normalizarDistrito(k) === objetivo
  )
  if (entrada && entrada[1] != null) {
    return Number(entrada[1]) || null
  }

  return null
}