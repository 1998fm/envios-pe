import type { ConfiguracionLogistica } from './types'

export function obtenerConfiguracionLogistica(
  config: ConfiguracionLogistica
) {

  return {

    logistica_moto_dias:
      config.logisticaMotoDias,

    logistica_moto_usa_hora_corte:
      config.logisticaMotoUsaHoraCorte,

    logistica_moto_hora_corte:
      config.logisticaMotoHoraCorte,

    logistica_moto_limitar:
      config.logisticaMotoLimitar,

    logistica_moto_cupo:
      config.logisticaMotoCupo,

    logistica_agencias_dias:
      config.logisticaAgenciasDias,

    logistica_agencias_usa_hora_corte:
      config.logisticaAgenciasUsaHoraCorte,

    logistica_agencias_hora_corte:
      config.logisticaAgenciasHoraCorte,

    logistica_agencias_limitar:
      config.logisticaAgenciasLimitar,

    logistica_agencias_cupo:
      config.logisticaAgenciasCupo,

  }

}