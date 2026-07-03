export function validarHoraCorte(
  horaCorte: string
): boolean {

  const ahora = new Date()

  const [hora, minuto] =
    horaCorte
      .split(':')
      .map(Number)

  const corte = new Date()

  corte.setHours(
    hora,
    minuto,
    0,
    0
  )

  return ahora >= corte

}