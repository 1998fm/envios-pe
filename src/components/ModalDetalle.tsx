'use client'

import { useState } from 'react'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import type { Envio } from '@/types/envio'

type Props = {
  envio: Envio | null
  onCerrar: () => void
  onUpdate?: (envio: Envio) => void
}

export default function ModalDetalle({ envio, onCerrar, onUpdate }: Props) {
  const supabase = createClient()
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  if (!envio) return null

  const current = envio

  const fechaInicial = fechaProgramada || current.fecha_programada?.split('T')[0] || ''

  async function guardarFecha() {
    if (!fechaProgramada || fechaProgramada === current.fecha_programada?.split('T')[0]) return
    setGuardando(true)
    setMensaje('')

    const nuevaFecha = new Date(fechaProgramada + 'T12:00:00').toISOString()
    const { error } = await supabase
      .from('envios')
      .update({ fecha_programada: nuevaFecha })
      .eq('id', current.id)

    if (error) {
      setMensaje('Error al guardar: ' + error.message)
    } else {
      setMensaje('✅ Fecha actualizada')
      const actualizado: Envio = { ...current, fecha_programada: nuevaFecha }
      onUpdate?.(actualizado)
    }
    setGuardando(false)
  }

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
        <div className="border-b border-slate-100 dark:border-slate-700 px-4 sm:px-8 py-4 sm:py-6">
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Detalle del pedido
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Información completa del envío seleccionado.
          </p>
        </div>

        <div className="p-4 sm:p-7 space-y-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-2">
              Cliente
            </div>
            <div className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
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
              Fecha programada
            </p>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={fechaInicial}
                onChange={(e) => setFechaProgramada(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={guardarFecha}
                disabled={guardando || !fechaProgramada || fechaProgramada === envio.fecha_programada?.split('T')[0]}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white disabled:opacity-40 hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200 shrink-0"
              >
                {guardando ? '...' : 'Guardar'}
              </button>
            </div>
            {mensaje && (
              <p className={`mt-2 text-xs font-semibold ${mensaje.includes('Error') ? 'text-red-500' : 'text-emerald-600'}`}>
                {mensaje}
              </p>
            )}
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

        <div className="border-t border-slate-100 dark:border-slate-700 p-4 sm:p-6 flex justify-end bg-white dark:bg-slate-800">
          <button
            onClick={onCerrar}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-lg hover:shadow-sky-500/20 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
