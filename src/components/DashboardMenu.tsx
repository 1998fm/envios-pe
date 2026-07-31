'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Menu as MenuIcon,
  Download,
  Replace,
  Tag,
  Copy,
  Package,
  ShoppingCart,
  Truck,
  Settings,
  Boxes,
  ChevronDown,
} from 'lucide-react'

type Props = {
  plan?: string
  tieneShalom: boolean
  showCopiarDatos: boolean
  pestañaActiva: 'envios' | 'productos' | 'ventas' | 'compras'
  onNavegar: (p: 'envios' | 'productos' | 'ventas' | 'compras') => void
  onExportShalom: () => void
  onCambioMasivo: () => void
  onGenerarEtiquetas: () => void
  onCopiarDatos: () => void
  onConfig: () => void
}

export default function DashboardMenu({
  plan = 'basic',
  tieneShalom,
  showCopiarDatos,
  pestañaActiva,
  onNavegar,
  onExportShalom,
  onCambioMasivo,
  onGenerarEtiquetas,
  onCopiarDatos,
  onConfig,
}: Props) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const secciones = [
    { key: 'envios' as const, label: 'Envíos', icon: Boxes },
    { key: 'productos' as const, label: 'Productos', icon: Package },
    { key: 'ventas' as const, label: 'Ventas', icon: ShoppingCart },
    { key: 'compras' as const, label: 'Compras', icon: Truck },
  ]

  function navegar(p: 'envios' | 'productos' | 'ventas' | 'compras') {
    setAbierto(false)
    onNavegar(p)
  }

  function ejecutar(fn: () => void) {
    setAbierto(false)
    fn()
  }

  const itemClass = `
    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
    text-slate-700 hover:bg-slate-50 hover:text-slate-900
    transition-colors duration-150 text-left
  `

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        data-tour="actions"
        onClick={() => setAbierto((v) => !v)}
        className={`
          flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl
          text-xs sm:text-sm font-semibold
          bg-white border border-slate-200 text-slate-700
          hover:bg-slate-50 :bg-slate-700 hover:border-sky-500 :border-sky-500
          hover:text-sky-700 :text-sky-300 transition-all duration-200 shrink-0
          ${abierto ? 'bg-slate-50 border-sky-500 text-sky-700' : ''}
        `}
      >
        <MenuIcon size={16} />
        <span className="hidden sm:inline">Menú</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Secciones
          </p>
          {secciones.map((s) => (
            <button
              key={s.key}
              onClick={() => navegar(s.key)}
              className={`
                ${itemClass}
                ${pestañaActiva === s.key
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : ''}
              `}
            >
              <s.icon size={16} className={pestañaActiva === s.key ? 'text-sky-600' : 'text-slate-400'} />
              {s.label}
              {pestañaActiva === s.key && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-500" />
              )}
            </button>
          ))}

          <div className="my-1.5 h-px bg-slate-100" />

          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Acciones
          </p>
          {tieneShalom && (
            <button data-tour="exportar-shalom" onClick={() => ejecutar(onExportShalom)} className={itemClass}>
              <Download size={16} className="text-sky-500" />
              Shalom Pro
            </button>
          )}
          {plan !== 'basic' && (
            <button data-tour="cambio-masivo" onClick={() => ejecutar(onCambioMasivo)} className={itemClass}>
              <Replace size={16} className="text-indigo-500" />
              Cambio Masivo
            </button>
          )}
          <button data-tour="generar-etiquetas" onClick={() => ejecutar(onGenerarEtiquetas)} className={itemClass}>
            <Tag size={16} className="text-emerald-500" />
            Generar etiquetas
          </button>
          {showCopiarDatos && (
            <button data-tour="copiar-datos" onClick={() => ejecutar(onCopiarDatos)} className={itemClass}>
              <Copy size={16} className="text-amber-500" />
              Copiar datos
            </button>
          )}

          <div className="my-1.5 h-px bg-slate-100" />

          <button data-tour="configuracion" onClick={() => ejecutar(onConfig)} className={itemClass}>
            <Settings size={16} className="text-slate-400" />
            Configuración
          </button>
        </div>
      )}
    </div>
  )
}
