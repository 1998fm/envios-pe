export type ConfiguracionLogistica = {
  logisticaMotoDias: string[]
  logisticaMotoUsaHoraCorte: boolean
  logisticaMotoHoraCorte: string
  logisticaMotoLimitar: boolean
  logisticaMotoCupo: number

  logisticaAgenciasDias: string[]
  logisticaAgenciasUsaHoraCorte: boolean
  logisticaAgenciasHoraCorte: string
  logisticaAgenciasLimitar: boolean
  logisticaAgenciasCupo: number
}