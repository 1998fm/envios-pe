import SelectorDias from '@/components/SelectorDias'
import { Lock } from 'lucide-react'

type Props = {
  dias: string[]
  setDias: React.Dispatch<React.SetStateAction<string[]>>

  usaHora: boolean
  setUsaHora: React.Dispatch<React.SetStateAction<boolean>>

  hora: string
  setHora: React.Dispatch<React.SetStateAction<string>>

  limitar: boolean
  setLimitar: React.Dispatch<React.SetStateAction<boolean>>

  cupo: number
  setCupo: React.Dispatch<React.SetStateAction<number>>

  nombreMetodoOtro?: string
  setNombreMetodoOtro?: React.Dispatch<
    React.SetStateAction<string>
  >

  mostrarNombreMetodo?: boolean

  bloqueado?: boolean
  onUpgrade?: () => void
}

export default function ConfiguracionMetodo({
  dias,
  setDias,

  usaHora,
  setUsaHora,

  hora,
  setHora,

  limitar,
  setLimitar,

  cupo,
  setCupo,

  nombreMetodoOtro,
  setNombreMetodoOtro,

  mostrarNombreMetodo = false,

  bloqueado = false,
  onUpgrade,
}: Props) {
  function FilaBloqueada({ titulo, descripcion }: { titulo: string; descripcion: string }) {
    return (
      <button
        type="button"
        onClick={onUpgrade}
        className="w-full flex items-center gap-3 text-left rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-amber-300 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
          <Lock size={15} className="text-slate-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">{titulo}</p>
          <p className="text-xs text-slate-500">{descripcion}</p>
        </div>
        <span className="text-xs font-semibold text-sky-600 shrink-0">Ver planes</span>
      </button>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">¿Qué días atiendes?</p>
        <SelectorDias value={dias} onChange={setDias} />
      </div>

      {bloqueado ? (
        <div className="space-y-3">
          <FilaBloqueada
            titulo="Hora de corte"
            descripcion="Disponible en el plan Pro"
          />
          <FilaBloqueada
            titulo="Limitar envíos por día"
            descripcion="Cupo diario — disponible en el plan Pro"
          />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={usaHora}
                onChange={(e) => setUsaHora(e.target.checked)}
                className="accent-sky-600 w-4 h-4"
              />
              <div>
                <p className="text-sm font-semibold text-slate-700">Tengo hora de corte</p>
                <p className="text-xs text-slate-500">Los pedidos después de esta hora pasan al siguiente día</p>
              </div>
            </label>

            {usaHora && (
              <div className="flex items-center gap-3 ml-7">
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
                <span className="text-xs text-slate-400">Ej: 18:00 = pedidos después de las 6pm van al día siguiente</span>
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={limitar}
              onChange={(e) => setLimitar(e.target.checked)}
              className="accent-sky-600 w-4 h-4"
            />
            <div>
              <p className="text-sm font-semibold text-slate-700">Limitar envíos por día</p>
              <p className="text-xs text-slate-500">¿Solo puedes enviar cierta cantidad de pedidos al día?</p>
            </div>
          </label>

          {limitar && (
            <div className="flex items-center gap-4 ml-7">
              <label className="text-sm text-slate-700 font-medium">Cupo máximo diario</label>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                type="text"
                min={1}
                value={cupo || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  setCupo(isNaN(val) ? 0 : val)
                }}
                className="w-24 border border-slate-200 rounded-xl px-4 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
              <span className="text-xs text-slate-400">pedidos por día</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
