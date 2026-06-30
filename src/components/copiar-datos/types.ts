/* ========================================
   PEDIDO DE MOTORIZADO
======================================== */

export interface EnvioMoto {

  id: number

  nombre: string

  telefono: string

  destino: string

  direccion: string | null

  referencia: string | null

  detalle: string

}

/* ========================================
   TARIFA POR DISTRITO
======================================== */

export interface TarifaMoto {

  distrito: string

  precio: number

}

/* ========================================
   ESTADO DE COBRO
======================================== */

export interface CobroEnvio {

  [id: number]: boolean

}

/* ========================================
   PROPS DEL MODAL
======================================== */

export interface ModalCopiarDatosProps {

  abierto: boolean

  envios: EnvioMoto[]

  tarifas: TarifaMoto[]

  cobrarEnvios: CobroEnvio

  setCobrarEnvios: React.Dispatch<
  React.SetStateAction<CobroEnvio>
>

  onCerrar: () => void

  onCambiarCobro: (
    id: number
  ) => void


}