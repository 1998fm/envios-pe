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
  ChevronLeft,
  Pin,
  LayoutDashboard,
} from 'lucide-react'

type Props = {
  plan?: string
  tieneShalom: boolean
  showCopiarDatos: boolean
  pestañaActiva: 'resumen' | 'envios' | 'productos' | 'ventas' | 'compras'
  onNavegar: (p: 'resumen' | 'envios' | 'productos' | 'ventas' | 'compras') => void
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
  const [hover, setHover] = useState(false)
  const [fijado, setFijado] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const abierto = hover || fijado

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setHover(false)
        setFijado(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const secciones = [
    { key: 'resumen' as const, label: 'Resumen', icon: LayoutDashboard },
    { key: 'envios' as const, label: 'Envíos', icon: Boxes },
    { key: 'productos' as const, label: 'Productos', icon: Package },
    { key: 'ventas' as const, label: 'Ventas', icon: ShoppingCart },
    { key: 'compras' as const, label: 'Compras', icon: Truck },
  ]

  function navegar(p: 'resumen' | 'envios' | 'productos' | 'ventas' | 'compras') {
    onNavegar(p)
    setHover(false)
    setFijado(false)
  }

  function ejecutar(fn: () => void) {
    fn()
    setHover(false)
    setFijado(false)
  }

  const itemClass = `
    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
    text-slate-700 hover:bg-slate-50 hover:text-slate-900
    transition-colors duration-150 text-left whitespace-nowrap
  `

  return (
    <>
      {/* BOTÓN FLOTANTE cuando el menú está plegado */}
      {!abierto && (
        <button
          data-tour="actions"
          onClick={() => setFijado(true)}
          onMouseEnter={() => setHover(true)}
          title="Abrir menú"
          className="fixed left-0 top-24 z-50 flex h-12 w-9 items-center justify-center rounded-r-xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white shadow-lg transition-all duration-200 hover:w-11 hover:shadow-xl"
        >
          <MenuIcon size={18} />
        </button>
      )}

      {/* SIDEBAR */}
      <div
        ref={ref}
        data-tour="actions"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-in-out"
        style={{ width: abierto ? '16rem' : '0rem' }}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-3">
          {abierto && <span className="text-sm font-bold text-slate-900">Menú</span>}
          <div className="flex items-center gap-1">
            {abierto && (
              <button
                onClick={() => setFijado((v) => !v)}
                title={fijado ? 'Desfijar menú' : 'Fijar menú abierto'}
                className={`rounded-lg p-2 transition-colors ${
                  fijado ? 'text-sky-600 hover:bg-sky-50' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <Pin size={16} />
              </button>
            )}
            {abierto && (
              <button
                onClick={() => {
                  setHover(false)
                  setFijado(false)
                }}
                title="Plegar menú"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {abierto && (
            <div className="space-y-4">
              <div>
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Secciones
                </p>
                {secciones.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => navegar(s.key)}
                    className={`${itemClass} ${
                      pestañaActiva === s.key ? 'bg-sky-50 text-sky-700 font-semibold' : ''
                    }`}
                  >
                    <s.icon size={16} className={pestañaActiva === s.key ? 'text-sky-600' : 'text-slate-400'} />
                    {s.label}
                    {pestañaActiva === s.key && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-500" />
                    )}
                  </button>
                ))}
              </div>

              <div className="my-1.5 h-px bg-slate-100" />

              <div>
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
              </div>

              <div className="my-1.5 h-px bg-slate-100" />

              <div>
                <button data-tour="configuracion" onClick={() => ejecutar(onConfig)} className={itemClass}>
                  <Settings size={16} className="text-slate-400" />
                  Configuración
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
