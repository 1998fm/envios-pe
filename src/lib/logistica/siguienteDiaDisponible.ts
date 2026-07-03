export function siguienteDiaDisponible(
  diasDisponibles: string[],
  fecha: Date = new Date()
): Date {

  const diasSemana = [

    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',

  ]

  const resultado = new Date(fecha)

  while (true) {

    resultado.setDate(
      resultado.getDate() + 1
    )

    const nombreDia =
      diasSemana[
        resultado.getDay()
      ]

    if (
      diasDisponibles.includes(
        nombreDia
      )
    ) {

      return resultado

    }

  }

}