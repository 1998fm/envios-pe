'use client'

import { useEffect, useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'

import { tourDone, trayectoDone } from '@/lib/tours'
import { useOnboarding } from '@/context/OnboardingContext'
import { MAX_ENVIOS_POR_ARCHIVO } from 'app/f/[slug]/lib/shalomExport'
import AyudaShalomPro from '@/components/AyudaShalomPro'

type Props = {
  abierto: boolean
  mensaje: string
  envios: any[]
  origen: string
  marcarEnviado: boolean
  onCambiarMarcarEnviado: (value: boolean) => void
  onCerrar: () => void
  onConfirmar: (seleccion: boolean[]) => void
}

const NUMERO_ARCHIVOS = (total: number) => Math.max(1, Math.ceil(total / MAX_ENVIOS_POR_ARCHIVO))

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
  const { startTour } = useOnboarding()

  const [seleccion, setSeleccion] = useState<boolean[]>([])

  useEffect(() => {
    if (trayectoDone() && !tourDone('modal-exportar-shalom')) {
      const t = setTimeout(() => startTour('modal-exportar-shalom'), 400)
      return () => clearTimeout(t)
    }
  }, [abierto, startTour])

  useEffect(() => {
    setSeleccion(Array.from({ length: NUMERO_ARCHIVOS(envios.length) }, () => true))
  }, [abierto, envios.length])

  const numeroArchivos = NUMERO_ARCHIVOS(envios.length)
  const seleccionadosCount = seleccion.filter(Boolean).length
  const todos = numeroArchivos > 0 && seleccionadosCount === numeroArchivos
  const ninguno = seleccionadosCount === 0

  const alternar = (i: number) =>
    setSeleccion((prev) => prev.map((v, idx) => (idx === i ? !v : v)))

  const marcarTodos = () => setSeleccion(Array.from({ length: numeroArchivos }, () => true))
  const desmarcarTodos = () => setSeleccion(Array.from({ length: numeroArchivos }, () => false))

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white  rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100  flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 ">
              Exportar Shalom
            </h2>
            <p className="mt-2 text-sm text-slate-500  whitespace-pre-line">
              {mensaje}
            </p>
          </div>
          <AyudaShalomPro />
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          <div data-tour="export-resumen" className="bg-slate-50  border border-slate-200  rounded-2xl p-6">
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

          <div className="border border-amber-200 bg-amber-50 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-amber-800">
                Archivos a descargar
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={marcarTodos}
                  className="text-amber-700 hover:text-amber-900"
                >
                  Todos
                </button>
                <span className="text-amber-400">·</span>
                <button
                  type="button"
                  onClick={desmarcarTodos}
                  className="text-amber-700 hover:text-amber-900"
                >
                  Ninguno
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-amber-700">
              Shalom Pro acepta máximo {MAX_ENVIOS_POR_ARCHIVO} envíos por archivo, así que se descarga uno por lote.
              Si uno falla en Shalom Pro (ej. un cliente no registrado), vuelve aquí, desmarca los que ya subiste bien
              y descarga solo el que falló.
            </p>

            <div className="mt-3 space-y-2">
              {Array.from({ length: numeroArchivos }).map((_, i) => {
                const desde = i * MAX_ENVIOS_POR_ARCHIVO + 1
                const hasta = Math.min((i + 1) * MAX_ENVIOS_POR_ARCHIVO, envios.length)
                const marcado = seleccion[i] ?? true
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                      marcado
                        ? 'bg-white border-amber-300 text-amber-900'
                        : 'bg-amber-50/40 border-amber-200 text-amber-600/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => alternar(i)}
                      className="w-4 h-4 accent-amber-600 cursor-pointer shrink-0"
                    />
                    <FileSpreadsheet size={16} className={`shrink-0 ${marcado ? 'text-amber-700' : 'text-amber-500/50'}`} />
                    <span className={`font-semibold ${marcado ? 'text-amber-900' : 'text-amber-600/60'}`}>
                      {numeroArchivos === 1 ? 'envios-shalom.xlsx' : `envios-shalom-${i + 1}.xlsx`}
                    </span>
                    <span className={`ml-auto text-xs font-medium ${marcado ? 'text-amber-700' : 'text-amber-600/50'}`}>
                      {desde}-{hasta}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div data-tour="export-marcar" className="flex items-center gap-4 bg-slate-50  border border-slate-200  rounded-2xl p-5">
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

        <div className="border-t border-slate-100 p-6 flex justify-end gap-4 bg-white">
          <button
            onClick={onCerrar}
            className="px-7 py-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition-all"
          >
            Cancelar
          </button>
          <button
            data-tour="export-confirmar"
            onClick={() => onConfirmar(seleccion)}
            disabled={ninguno}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-lg hover:shadow-sky-500/20 text-white px-7 py-3 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {ninguno
              ? 'Selecciona un archivo'
              : `${marcarEnviado ? 'Exportar y enviar' : 'Descargar'}${numeroArchivos > 1 ? ` (${seleccionadosCount} archivo${seleccionadosCount === 1 ? '' : 's'})` : ''}`}
          </button>
        </div>

        <div className="border-t border-slate-100 px-8 py-4 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-400">
            ¿Usas Shalom Pro?
          </p>
          <button
            onClick={() => window.open('https://pro.shalom.pe', '_blank', 'noopener,noreferrer')}
            className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Abrir Shalom Pro
          </button>
        </div>
      </div>
    </div>
  )
}