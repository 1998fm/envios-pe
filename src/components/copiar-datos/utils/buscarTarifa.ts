/* ========================================
   TIPOS
======================================== */

import type {

  TarifaMoto

} from '../types'

/* ========================================
   BUSCAR TARIFA
======================================== */

export function buscarTarifa(

  distrito: string,

  tarifas: TarifaMoto[]

): number {

  const tarifa = tarifas.find(

    (t) =>

      t.distrito.trim().toUpperCase() ===

      distrito.trim().toUpperCase()

  )

  return tarifa?.precio ?? 0

}