// ¿Hoy es uno de los días en los que el formulario está cerrado?
// Se evalúa con hora de Perú (UTC-5), igual que validarHoraCorte, para que el
// cambio de día no dependa de la zona horaria del servidor.
export function esDiaDeshabilitado(
  dias: string[] | null | undefined,
  ahora: Date = new Date()
): boolean {
  if (!Array.isArray(dias) || dias.length === 0) return false

  const peruMs = ahora.getTime() + (ahora.getTimezoneOffset() - 300) * 60000
  const peru = new Date(peruMs)
  const nombre = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
    peru.getDay()
  ]

  return dias.includes(nombre)
}