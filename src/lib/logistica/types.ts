export type ConfiguracionLogistica = {
  logisticaMotoDias: string[]
  logisticaMotoUsaHoraCorte: boolean
  logisticaMotoHoraCorte: string
  logisticaMotoAnticipacion: number
  logisticaMotoLimitar: boolean
  logisticaMotoCupo: number

  logisticaAgenciasDias: string[]
  logisticaAgenciasUsaHoraCorte: boolean
  logisticaAgenciasHoraCorte: string
  logisticaAgenciasAnticipacion: number
  logisticaAgenciasLimitar: boolean
  logisticaAgenciasCupo: number
  solicitarCantidadProductos?: boolean
  mostrarEscogerFecha?: boolean
  cerrarFormulario?: boolean
  cerradoFormularioMensaje?: string
}