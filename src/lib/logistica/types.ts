export type ConfiguracionLogistica = {
  logisticaMotoDias: string[]
  logisticaMotoUsaHoraCorte: boolean
  logisticaMotoHoraCorte: string
  logisticaMotoAnticipacion: number
  logisticaMotoAnticipacionSoloHabiles?: boolean
  logisticaMotoLimitar: boolean
  logisticaMotoCupo: number

  logisticaAgenciasDias: string[]
  logisticaAgenciasUsaHoraCorte: boolean
  logisticaAgenciasHoraCorte: string
  logisticaAgenciasAnticipacion: number
  logisticaAgenciasAnticipacionSoloHabiles?: boolean
  logisticaAgenciasLimitar: boolean
  logisticaAgenciasCupo: number
  solicitarCantidadProductos?: boolean
  mostrarEscogerFecha?: boolean
  mostrarTracking?: boolean
  cerrarFormulario?: boolean
  cerradoFormularioMensaje?: string
}