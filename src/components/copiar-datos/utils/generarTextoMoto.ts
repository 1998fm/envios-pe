/* ========================================
   TIPOS
======================================== */

import type {

  EnvioMoto,

  TarifaMoto,

  CobroEnvio

} from '../types'

import {

  buscarTarifa

} from './buscarTarifa'

/* ========================================
   GENERAR TEXTO
======================================== */

export function generarTextoMoto(

  envios: EnvioMoto[],

  tarifas: TarifaMoto[],

  cobrarEnvios: CobroEnvio

) {

  return envios

    .map((envio) => {

      const tarifa = buscarTarifa(

        envio.destino,

        tarifas

      )

      const cobrar =

        cobrarEnvios[envio.id]

      return [

        `*Cliente:* ${envio.nombre}`,

        `*TLF:* ${envio.telefono}`,

        `*DIRECCIÓN:* ${envio.destino}, ${envio.direccion ?? ''}`,

        envio.referencia

          ? `*REF:* ${envio.referencia}`

          : null,

        cobrar

          ? `*COBRAR:* S/${tarifa}`

          : `*COBRAR:* NO COBRAR`

      ]

        .filter(Boolean)

        .join('\n')

    })

    .join('\n\n')

}