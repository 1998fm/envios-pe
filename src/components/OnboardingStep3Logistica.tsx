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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Horarios y disponibilidad</h3>
        <p className="text-sm text-slate-500">Tori usará esto para calcular automáticamente la fecha de entrega de cada pedido.</p>
      </div>

      <div className="space-y-6">
        {config.metodoMotorizado && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-700">M</div>
              <div>
                <h4 className="font-bold text-slate-900">Motorizado</h4>
                <p className="text-xs text-slate-500">Reparto local</p>
              </div>
            </div>
            <ConfiguracionMetodo
              dias={config.logisticaMotoDias}
              setDias={setter(upd, 'logisticaMotoDias', config)}
              usaHora={config.logisticaMotoUsaHoraCorte}
              setUsaHora={setter(upd, 'logisticaMotoUsaHoraCorte', config)}
              hora={config.logisticaMotoHoraCorte}
              setHora={setter(upd, 'logisticaMotoHoraCorte', config)}
              anticipacion={config.logisticaMotoAnticipacion}
              setAnticipacion={setter(upd, 'logisticaMotoAnticipacion', config)}
              limitar={config.logisticaMotoLimitar}
              setLimitar={setter(upd, 'logisticaMotoLimitar', config)}
              cupo={config.logisticaMotoCupo}
              setCupo={setter(upd, 'logisticaMotoCupo', config)}
            />
          </div>
        )}

        {hayAgencias && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">A</div>
              <div>
                <h4 className="font-bold text-slate-900">Agencias</h4>
                <p className="text-xs text-slate-500">Shalom, Olva y otras</p>
              </div>
            </div>
            <ConfiguracionMetodo
              dias={config.logisticaAgenciasDias}
              setDias={setter(upd, 'logisticaAgenciasDias', config)}
              usaHora={config.logisticaAgenciasUsaHoraCorte}
              setUsaHora={setter(upd, 'logisticaAgenciasUsaHoraCorte', config)}
              hora={config.logisticaAgenciasHoraCorte}
              setHora={setter(upd, 'logisticaAgenciasHoraCorte', config)}
              anticipacion={config.logisticaAgenciasAnticipacion}
              setAnticipacion={setter(upd, 'logisticaAgenciasAnticipacion', config)}
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

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">¿Cómo funciona?</p>
        <p className="text-xs mt-1">La <strong>anticipación mínima</strong> indica cuántos días antes deben registrar sus pedidos tus clientes. Si activas la <strong>hora de corte</strong>, los pedidos hechos después de esa hora se programan un día adicional. Ej: con anticipación 2 y corte 10am, un pedido del lunes a las 11am se programa para el miércoles (siguiente día disponible).</p>
      </div>
    </div>
  )
}
