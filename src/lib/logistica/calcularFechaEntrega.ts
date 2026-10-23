import { validarHoraCorte } from './validarHoraCorte'
import { siguienteDiaDisponible } from './siguienteDiaDisponible'
import { validarCupo } from './validarCupo'
import { contarEnviosDelDia } from './contarEnviosDelDia'
import { sumarDiasHabiles } from './sumarDiasHabiles'

import type { ConfiguracionLogistica } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function calcularFechaEntrega(
  supabase: SupabaseClient,
  userId: string,
  configuracion: ConfiguracionLogistica,
  metodo: 'MOTO' | 'AGENCIA',
  fechaActual = new Date(),
): Promise<Date> {

  const diasConfig =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoDias
      : configuracion.logisticaAgenciasDias

  // Respaldo de seguridad: el formulario público ya oculta motorizado cuando el
  // negocio no marcó ningún día, así que esto solo debería ocurrir ante una
  // llamada directa a la API. El lunes evita un loop infinito.
  const dias =
    Array.isArray(diasConfig) && diasConfig.length > 0
      ? diasConfig
      : ['MONDAY']

  const usaHora =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoUsaHoraCorte
      : configuracion.logisticaAgenciasUsaHoraCorte

  const horaCorte =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoHoraCorte
      : configuracion.logisticaAgenciasHoraCorte

  const anticipacion =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoAnticipacion
      : configuracion.logisticaAgenciasAnticipacion

  const soloHabiles =
    metodo === 'MOTO'
      ? Boolean(configuracion.logisticaMotoAnticipacionSoloHabiles)
      : Boolean(configuracion.logisticaAgenciasAnticipacionSoloHabiles)

  const limitar =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoLimitar
      : configuracion.logisticaAgenciasLimitar

  const cupo =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoCupo
      : configuracion.logisticaAgenciasCupo

  // Normalizar fechaActual a Perú (evita que UTC adelante el día)
  const peruStr = fechaActual.toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  const [y, m, d] = peruStr.split('-').map(Number)
  const hoyPeru = new Date(y, m - 1, d, 12, 0, 0, 0)

  const diasAgregar =
    usaHora && validarHoraCorte(horaCorte)
      ? Number(anticipacion || 0) + 1
      : Number(anticipacion || 0)

  let fechaEntrega: Date
  if (soloHabiles && Number(anticipacion || 0) >= 2) {
    fechaEntrega = sumarDiasHabiles(dias, diasAgregar, hoyPeru)
  } else {
    fechaEntrega = new Date(hoyPeru)
    fechaEntrega.setDate(fechaEntrega.getDate() + diasAgregar)
  }

while (true) {

  const nombreDia =
    fechaEntrega
      .toLocaleDateString(
        'en-US',
        { weekday: 'long', timeZone: 'America/Lima' }
      )
      .toUpperCase()

  if (!dias.includes(nombreDia)) {

    fechaEntrega =
      siguienteDiaDisponible(
        dias,
        fechaEntrega
      )

    continue

  }

  break

}

if (limitar) {

  while (true) {

    const fechaTexto =
      fechaEntrega
        .toLocaleDateString('en-CA', { timeZone: 'America/Lima' })

    const cantidadProgramada =
      await contarEnviosDelDia(

        supabase,

        userId,

        fechaTexto,

      )

    const disponible =
      validarCupo(

        cantidadProgramada,

        cupo,

      )

    if (disponible) {

      break

    }

    // El día objetivo está lleno: ir al siguiente día disponible A PARTIR de su
    // fecha (siguienteDiaDisponible ya avanza 1 día). Antes se pasaba
    // fecha+1 día, con lo que en días seguidos se saltaba también el siguiente
    // día disponible.
    fechaEntrega = siguienteDiaDisponible(

      dias,

      fechaEntrega,

    )

  }

}

  return fechaEntrega

}