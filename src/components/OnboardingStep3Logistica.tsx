'use client'

import type { ConfigState } from '@/types/config'
import ConfiguracionMetodo from '@/components/ConfiguracionMetodo'

type Props = {
  config: ConfigState
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void
}

function setter(
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void,
  key: keyof ConfigState,
  config: ConfigState
): React.Dispatch<React.SetStateAction<any>> {
  return (value: any) =>
    upd(key, typeof value === 'function' ? value(config[key]) : value)
}

export default function OnboardingStep3Logistica({ config, upd }: Props) {
  const hayAgencias =
    config.metodoShalom || config.metodoOlva || config.metodoMarvisur || config.metodoFlores || config.metodoOtro

  return (
    <div className="space-y-8">
      <div className="bg-white  border border-slate-200  rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 ">
          Control logístico
        </h2>
        <p className="text-sm text-slate-500  mt-2">
          Configura días de atención, horarios de corte y cupo diario para que los pedidos se programen automáticamente.
        </p>

        <div className="mt-8 space-y-6">
          {config.metodoMotorizado && (
            <div>
              <h3 className="font-semibold text-lg text-slate-900  mb-4">Motorizado</h3>
              <ConfiguracionMetodo
                dias={config.logisticaMotoDias}
                setDias={setter(upd, 'logisticaMotoDias', config)}
                usaHora={config.logisticaMotoUsaHoraCorte}
                setUsaHora={setter(upd, 'logisticaMotoUsaHoraCorte', config)}
                hora={config.logisticaMotoHoraCorte}
                setHora={setter(upd, 'logisticaMotoHoraCorte', config)}
                limitar={config.logisticaMotoLimitar}
                setLimitar={setter(upd, 'logisticaMotoLimitar', config)}
                cupo={config.logisticaMotoCupo}
                setCupo={setter(upd, 'logisticaMotoCupo', config)}
              />
            </div>
          )}

          {hayAgencias && (
            <div>
              <h3 className="font-semibold text-lg text-slate-900  mb-4">Agencias</h3>
              <ConfiguracionMetodo
                dias={config.logisticaAgenciasDias}
                setDias={setter(upd, 'logisticaAgenciasDias', config)}
                usaHora={config.logisticaAgenciasUsaHoraCorte}
                setUsaHora={setter(upd, 'logisticaAgenciasUsaHoraCorte', config)}
                hora={config.logisticaAgenciasHoraCorte}
                setHora={setter(upd, 'logisticaAgenciasHoraCorte', config)}
                limitar={config.logisticaAgenciasLimitar}
                setLimitar={setter(upd, 'logisticaAgenciasLimitar', config)}
                cupo={config.logisticaAgenciasCupo}
                setCupo={setter(upd, 'logisticaAgenciasCupo', config)}
                nombreMetodoOtro={config.nombreMetodoOtro}
                setNombreMetodoOtro={setter(upd, 'nombreMetodoOtro', config)}
                mostrarNombreMetodo={config.metodoOtro}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
