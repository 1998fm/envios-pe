'use client'

import { motion } from 'framer-motion'
import EstadoSelect from '@/components/EstadoSelect'
import TamanoSelect from '@/components/TamanoSelect'

type Envio = {
  id: string
  nombre: string
  dni: string
  telefono: string
  metodo: string
  nombre_metodo?: string | null
  estado: string
  tamano?: string | null
  detalle?: string | null
  fecha_registro: string
  fecha_programada?: string | null
}

type Props = {
  envio: Envio
  seleccionados: string[]
  index: number
  onToggleSeleccion: (id: string) => void
  onDoubleClick: (envio: Envio) => void
  mostrarFechaProgramada?: boolean
}

const colorBorder = (estado: string) =>
  estado === 'ENVIADO' ? 'border-l-emerald-500' :
  estado === 'EMPACADO' ? 'border-l-amber-500' :
  'border-l-red-500'

export default function EnvioCard({
  envio, seleccionados, index,
  onToggleSeleccion, onDoubleClick, mostrarFechaProgramada,
}: Props) {
  const checked = seleccionados.includes(envio.id)

  return (
    <motion.div
      data-tour="envio-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      onDoubleClick={() => onDoubleClick(envio)}
      className={`
        ${colorBorder(envio.estado)}
        bg-white dark:bg-slate-800
        rounded-2xl border border-slate-100 dark:border-slate-700 border-l-4
        p-4 sm:p-5
        cursor-pointer
        hover:shadow-md hover:border-sky-200 dark:hover:border-sky-700
        transition-all duration-200
      `}
    >
      <div className="flex items-start gap-2">
        {/* Check */}
        <input
          data-tour="checkbox"
          type="checkbox"
          checked={checked}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggleSeleccion(envio.id)}
          className="w-5 h-5 mt-1 shrink-0 accent-sky-500 cursor-pointer"
        />

        {/* Avatar */}
        <div data-tour="avatar" className="w-10 h-10 rounded-xl shrink-0 bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm mt-0.5">
          {envio.nombre?.charAt(0)?.toUpperCase()}
        </div>

        {/* Left: nombre + datos + fecha programada */}
        <div data-tour="info" className="w-[200px] shrink-0">
          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
            {envio.nombre}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>DNI {envio.dni}</span>
            <span>TLF {envio.telefono}</span>
          </div>
          {mostrarFechaProgramada && envio.fecha_programada && (
            <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Envío programado: {new Date(envio.fecha_programada + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>

        {/* Center: destino */}
        <div className="flex-1 text-center text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-w-0 self-center">
          {envio.detalle || '—'}
        </div>

        {/* Right: badges + selects */}
        <div className="flex items-center gap-2 self-center">
          <span data-tour="metodo" className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {envio.nombre_metodo || envio.metodo}
          </span>
          <div onClick={(e) => e.stopPropagation()}>
            <TamanoSelect envioId={envio.id} tamanoActual={envio.tamano ?? null} />
          </div>
          <div data-tour="estado" onClick={(e) => e.stopPropagation()}>
            <EstadoSelect envioId={envio.id} estadoActual={envio.estado} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
