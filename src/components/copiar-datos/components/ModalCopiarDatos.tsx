'use client'

import TarjetaEnvio from './TarjetaEnvio'
import ResumenCopiarDatos from './ResumenCopiarDatos'
import BotonesModal from './BotonesModal'
import { buscarTarifa } from '../utils/buscarTarifa'
import { generarTextoMoto } from '../utils/generarTextoMoto'
import { useState } from 'react'
import { exportarExcelMoto } from '../utils/exportarExcelMoto'
import type { ModalCopiarDatosProps } from '../types'

export default function ModalCopiarDatos({
  abierto,
  envios,
  tarifas,
  cobrarEnvios,
  setCobrarEnvios,
  onCerrar,
  onCambiarCobro,
}: ModalCopiarDatosProps) {
  if (!abierto) return null

  const [copiado, setCopiado] = useState(false)

  const total = envios.length
  const cobrar = envios.filter((envio) => cobrarEnvios[envio.id]).length
  const noCobrar = total - cobrar
  const cobrarTodos = total > 0 && cobrar === total

  function cambiarTodos() {
    const nuevoEstado: Record<string, boolean> = {}
    envios.forEach((envio) => {
      nuevoEstado[envio.id] = !cobrarTodos
    })
    setCobrarEnvios(nuevoEstado)
  }

  async function copiarDatos() {
    const texto = generarTextoMoto(envios, tarifas, cobrarEnvios)
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function exportarExcel() {
    exportarExcelMoto(envios, tarifas, cobrarEnvios)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 sm:p-6">
      <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="shrink-0 px-6 sm:px-8 pt-8 sm:pt-10 pb-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Copiar datos para Motorizado
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Revisa los envíos antes de copiar o exportar la información.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <ResumenCopiarDatos total={total} cobrar={cobrar} noCobrar={noCobrar} />

          <div className="space-y-3">
            {envios.map((envio) => {
              const tarifa = buscarTarifa(envio.destino, tarifas)
              return (
                <TarjetaEnvio
                  key={envio.id}
                  envio={envio}
                  cobrar={cobrarEnvios[envio.id] ?? false}
                  tarifa={tarifa}
                  onCambiarCobro={() => onCambiarCobro(envio.id)}
                />
              )
            })}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              Cobrar todos los envíos
            </span>
            <input
              type="checkbox"
              checked={cobrarTodos}
              onChange={cambiarTodos}
              className="h-5 w-5 rounded accent-sky-600 cursor-pointer"
            />
          </div>
        </div>

        <BotonesModal
          onCerrar={onCerrar}
          onCopiar={copiarDatos}
          onExportar={exportarExcel}
          copiado={copiado}
        />
      </div>
    </div>
  )
}
