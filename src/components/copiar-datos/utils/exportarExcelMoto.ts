/* ========================================
   XLSX
======================================== */

import * as XLSX from 'xlsx'

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
   EXPORTAR EXCEL
======================================== */

export function exportarExcelMoto(

  envios: EnvioMoto[],

  tarifas: TarifaMoto[],

  cobrarEnvios: CobroEnvio

) {

  const filas = envios.map((envio) => {

    const tarifa = buscarTarifa(

      envio.destino,

      tarifas

    )

    return {

      Cliente: envio.nombre,

      Telefono: envio.telefono,

      Distrito: envio.destino,

      Direccion: envio.direccion,

      Referencia: envio.referencia,

      Cobrar: cobrarEnvios[envio.id]

  ? tarifa

  : 0

    }

  })

  const hoja = XLSX.utils.json_to_sheet(

    filas

  )


  const libro = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(

    libro,

    hoja,

    'Motorizado'

  )

  XLSX.writeFile(

    libro,

    'Pedidos_Motorizado.xlsx'

  )

}