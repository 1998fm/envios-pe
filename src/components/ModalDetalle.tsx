'use client'

type EnvioDetalle = {
  nombre: string
  dni: string
  telefono: string
  metodo: string
  estado: string
  tamano: string
  fecha_registro: string
  detalle: string
}

type Props = {
  envio: EnvioDetalle | null
  onCerrar: () => void
}

export default function ModalDetalle({ envio, onCerrar }: Props) {
  if (!envio) return null

  const campos = [
    { label: 'Documento', value: envio.dni },
    { label: 'Teléfono', value: envio.telefono },
    { label: 'Método', value: envio.metodo },
    { label: 'Estado', value: envio.estado },
    { label: 'Tamaño', value: envio.tamano },
    { label: 'Registro', value: new Date(envio.fecha_registro).toLocaleString('es-PE') },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden w-full max-w-xl">
        <div className="border-b border-slate-100 dark:border-slate-700 px-8 py-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Detalle del pedido
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Información completa del envío seleccionado.
          </p>
        </div>

        <div className="p-7 space-y-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-2">
              Cliente
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {envio.nombre}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campos.map((item) => (
              <div key={item.label} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1">
                  {item.label}
                </p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-3">
              Destino
            </p>
            <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {envio.detalle}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 p-6 flex justify-end bg-white dark:bg-slate-800">
          <button
            onClick={onCerrar}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-lg hover:shadow-sky-500/20 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
