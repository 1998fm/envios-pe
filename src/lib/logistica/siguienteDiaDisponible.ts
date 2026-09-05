export function siguienteDiaDisponible(
  diasDisponibles: string[],
  fecha: Date = new Date()
): Date {

  const resultado = new Date(fecha)

  while (true) {

    resultado.setDate(
      resultado.getDate() + 1
    )

    const nombreDia =
      resultado
        .toLocaleDateString(
          'en-US',
          { weekday: 'long', timeZone: 'America/Lima' }
        )
        .toUpperCase()

    if (
      diasDisponibles.includes(
        nombreDia
      )
    ) {

      return resultado

    }

  }

}