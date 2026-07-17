import SelectorDias from '@/components/SelectorDias'

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
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">¿Qué días atiendes?</p>
        <SelectorDias value={dias} onChange={setDias} />
      </div>

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
            type="number"
            min={1}
            value={cupo}
            onChange={(e) => setCupo(Number(e.target.value))}
            className="w-24 border border-slate-200 rounded-xl px-4 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
          <span className="text-xs text-slate-400">pedidos por día</span>
        </div>
      )}
    </div>
  )
}
