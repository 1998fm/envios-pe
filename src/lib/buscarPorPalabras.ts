// Búsqueda por palabras sueltas: el texto debe contener TODAS las palabras
// del término, en cualquier orden (p.ej. "buzo negro" o "brenda l").
export function coincidePorPalabras(texto: string, termino: string): boolean {
  const palabras = termino.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return true
  const t = texto.toLowerCase()
  return palabras.every((p) => t.includes(p))
}