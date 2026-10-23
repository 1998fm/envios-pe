export function sumarDiasHabiles(
  diasDisponibles: string[],
  cantidad: number,
  fecha: Date = new Date()
): Date {
  const dias =
    Array.isArray(diasDisponibles) && diasDisponibles.length > 0
      ? diasDisponibles
      : ['MONDAY']

  const resultado = new Date(fecha)
  const objetivo = Math.max(0, Math.trunc(Number(cantidad) || 0))
  let contados = 0

  while (contados < objetivo) {
    resultado.setDate(resultado.getDate() + 1)

    const nombreDia = resultado
      .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Lima' })
      .toUpperCase()

    if (dias.includes(nombreDia)) {
      contados += 1
    }
  }

  return resultado
}
