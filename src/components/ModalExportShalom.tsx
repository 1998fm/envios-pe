'use client'

type Props = {
  abierto: boolean
  mensaje: string
  envios: any[]
  origen: string
  marcarEnviado: boolean
  onCambiarMarcarEnviado: (value: boolean) => void
  onCerrar: () => void
  onConfirmar: () => void
}

export default function ModalExportShalom({
  abierto,
  mensaje,
  envios,
  origen,
  marcarEnviado,
  onCambiarMarcarEnviado,
  onCerrar,
  onConfirmar,
}: Props) {
  if (!abierto) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white  rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 ">
          <h2 className="text-3xl font-extrabold text-slate-900 ">
            Exportar Shalom
          </h2>
          <p className="mt-2 text-sm text-slate-500  whitespace-pre-line">
            {mensaje}
          </p>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="bg-slate-50  border border-slate-200  rounded-2xl p-6">
            <div className="text-sm uppercase tracking-wider text-slate-400  font-semibold">
              Envíos a exportar
            </div>

            <div className="text-5xl font-extrabold text-slate-900  mt-2 mb-5">
              {envios.length}
            </div>

            <div className="space-y-2 text-sm text-slate-600 ">
              <div>
                <span className="font-semibold text-slate-800 ">
                  Método:
                </span> SHALOM
              </div>
              <div>
                <span className="font-semibold text-slate-800 ">
                  Origen:
                </span> {origen}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50  border border-slate-200  rounded-2xl p-5">
            <input
              type="checkbox"
              checked={marcarEnviado}
              onChange={(e) => onCambiarMarcarEnviado(e.target.checked)}
              className="w-5 h-5 accent-sky-600 cursor-pointer shrink-0"
            />
            <label className="text-sm text-slate-700  select-none leading-relaxed">
              Marcar automáticamente los pedidos como{' '}
              <span className="font-semibold text-green-600 ">
                ENVIADO
              </span>{' '}
              después de exportarlos.
            </label>
          </div>
        </div>

        <div className="border-t border-slate-100  p-6 flex justify-end gap-4 bg-white ">
          <button
            onClick={onCerrar}
            className="px-7 py-3 rounded-xl border border-slate-300  font-semibold text-slate-700  hover:bg-slate-100 :bg-slate-700 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-lg hover:shadow-sky-500/20 text-white px-7 py-3 rounded-xl font-semibold transition-all"
          >
            {marcarEnviado ? 'Exportar y enviar' : 'Exportar'}
          </button>
        </div>
      </div>
    </div>
  )
}
