import type { EnvioMoto } from '../types'

interface Props {
  envio: EnvioMoto
  cobrar: boolean
  tarifa: number | null
  onCambiarCobro: () => void
}

export default function TarjetaEnvio({ envio, cobrar, tarifa, onCambiarCobro }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {envio.nombre}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {envio.telefono}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            checked={cobrar}
            onChange={onCambiarCobro}
            className="h-5 w-5 rounded accent-sky-600 cursor-pointer"
          />
          Cobrar envío
        </label>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm space-y-2">
        <p>
          <strong className="text-slate-700 dark:text-slate-300">Distrito:</strong> {envio.destino}
        </p>
        {envio.direccion && (
          <p>
            <strong className="text-slate-700 dark:text-slate-300">Dirección:</strong> {envio.direccion}
          </p>
        )}
        {envio.referencia && (
          <p>
            <strong className="text-slate-700 dark:text-slate-300">Referencia:</strong> {envio.referencia}
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
        {cobrar ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Cobrar S/{tarifa ?? 0}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-red-100/80 dark:bg-red-900/30 px-4 py-1.5 text-sm font-semibold text-red-700 dark:text-red-300">
            No cobrar
          </span>
        )}
      </div>
    </div>
  )
}
