import { validarHoraCorte } from './validarHoraCorte'
import { siguienteDiaDisponible } from './siguienteDiaDisponible'
import { validarCupo } from './validarCupo'
import { contarEnviosDelDia } from './contarEnviosDelDia'

import type { ConfiguracionLogistica } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function calcularFechaEntrega(
  supabase: SupabaseClient,
  userId: string,
  configuracion: ConfiguracionLogistica,
  metodo: 'MOTO' | 'AGENCIA',
  fechaActual = new Date(),
): Promise<Date> {

  const dias =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoDias
      : configuracion.logisticaAgenciasDias

  const usaHora =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoUsaHoraCorte
      : configuracion.logisticaAgenciasUsaHoraCorte

  const horaCorte =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoHoraCorte
      : configuracion.logisticaAgenciasHoraCorte

  const limitar =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoLimitar
      : configuracion.logisticaAgenciasLimitar

  const cupo =
    metodo === 'MOTO'
      ? configuracion.logisticaMotoCupo
      : configuracion.logisticaAgenciasCupo

// Normalizar fechaActual a Perú (evita que UTC adelante el día)
const peruStr = fechaActual.toLocaleString('en-CA', { timeZone: 'America/Lima' })
const [y, m, d] = peruStr.split('-').map(Number)
const hoyPeru = new Date(y, m - 1, d, 12, 0, 0, 0)

let fechaEntrega = new Date(hoyPeru)

const diasAgregar =
  usaHora && validarHoraCorte(horaCorte)
    ? 2
    : 1

fechaEntrega.setDate(fechaEntrega.getDate() + diasAgregar)

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
        .toLocaleString('en-CA', { timeZone: 'America/Lima' })
        .split(' ')[0]

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

    fechaEntrega = siguienteDiaDisponible(

      dias,

      new Date(

        fechaEntrega.getTime() + 86400000

      ),

    )

  }

}

  return fechaEntrega

}