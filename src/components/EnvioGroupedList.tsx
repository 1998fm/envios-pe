'use client'

import EnvioCard from '@/components/EnvioCard'
import ToriMascot from '@/components/ToriMascot'

type Props = {
  fechasAgrupadas: string[]
  enviosAgrupados: Record<string, any[]>
  seleccionados: string[]
  onToggleSeleccionTodos: () => void
  onToggleSeleccion: (id: string) => void
  onDoubleClick: (envio: any) => void
  mostrarFechaProgramada?: boolean
  agruparPor: 'programada' | 'registro'
  onCambiarAgruparPor: (v: 'programada' | 'registro') => void
}

export default function EnvioGroupedList({
  fechasAgrupadas,
  enviosAgrupados,
  seleccionados,
  onToggleSeleccionTodos,
  onToggleSeleccion,
  onDoubleClick,
  mostrarFechaProgramada,
  agruparPor,
  onCambiarAgruparPor,
}: Props) {
  const todosVisibles = fechasAgrupadas
    .flatMap((f) => enviosAgrupados[f])

  const todosSeleccionados =
    todosVisibles.length > 0 &&
    todosVisibles.every((envio) => seleccionados.includes(envio.id))

  if (fechasAgrupadas.length === 0) {
    return (
      <div className="bg-white  rounded-2xl border border-slate-100  shadow-sm p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <ToriMascot variant="empty" size={64} animate />
          <div>
            <h3 className="text-lg font-bold text-slate-700 ">
              No hay envíos todavía
            </h3>
            <p className="text-sm text-slate-400  mt-1">
              Cuando tus clientes llenen el formulario, aquí aparecerán ordenados.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div data-tour="envio-list" className="bg-white  rounded-2xl border border-slate-100  shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-5 py-4 border-b border-slate-100  bg-white ">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={todosSeleccionados}
            onChange={onToggleSeleccionTodos}
            className="w-5 h-5 accent-sky-500 cursor-pointer"
          />
          <span className="text-sm font-semibold text-slate-700 ">
            Seleccionar todos
          </span>
          <span className="text-xs text-slate-400 ">
            ({seleccionados.length} seleccionados)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onCambiarAgruparPor('programada')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              agruparPor === 'programada'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow'
                : 'bg-slate-100  text-slate-500  hover:bg-slate-200 :bg-slate-600'
            }`}
          >
            Programada
          </button>
          <button
            onClick={() => onCambiarAgruparPor('registro')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              agruparPor === 'registro'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow'
                : 'bg-slate-100  text-slate-500  hover:bg-slate-200 :bg-slate-600'
            }`}
          >
            Registro
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5">
        {fechasAgrupadas.map((fecha) => (
          <div key={fecha} className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold text-slate-800 ">
                {fecha === 'SIN_FECHA'
                  ? 'Sin fecha programada'
                  : new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
              </div>
              <div className="h-px flex-1 bg-slate-200 " />
            </div>

            {enviosAgrupados[fecha].map((envio: any, i: number) => (
              <EnvioCard
                key={envio.id}
                envio={envio}
                seleccionados={seleccionados}
                index={i}
                onToggleSeleccion={onToggleSeleccion}
                onDoubleClick={onDoubleClick}
                mostrarFechaProgramada={mostrarFechaProgramada}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
