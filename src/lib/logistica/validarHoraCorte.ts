export function validarHoraCorte(
  horaCorte: string
): boolean {

  const ahora = new Date()

  // Convertir hora del servidor (UTC) a hora Perú (UTC-5)
  const peruMs = ahora.getTime() + (ahora.getTimezoneOffset() - 300) * 60000
  const ahoraPeru = new Date(peruMs)

  const [hora, minuto] =
    horaCorte
      .split(':')
      .map(Number)

  const cortePeru = new Date(ahoraPeru)

  cortePeru.setHours(
    hora,
    minuto,
    0,
    0
  )

  return ahoraPeru >= cortePeru

}