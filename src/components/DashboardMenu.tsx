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
  Receipt,
  Users,
  ClipboardList,
} from 'lucide-react'
import TourHelpButton from '@/components/TourHelpButton'
import LogoTori from '@/components/LogoTori'
import LockedFeature from '@/components/LockedFeature'
import type { TourId } from '@/lib/tours'

type Props = {
  plan?: string
  tieneShalom: boolean
  showCopiarDatos: boolean
  copiarDatosLocked?: boolean
  shalomUso?: { used: number; max: number | null }
  pestañaActiva: 'resumen' | 'envios' | 'productos' | 'ventas' | 'compras' | 'gastos' | 'clientes' | 'formulario'
  onNavegar: (p: 'resumen' | 'envios' | 'productos' | 'ventas' | 'compras' | 'gastos' | 'clientes' | 'formulario') => void
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
  copiarDatosLocked = false,
  shalomUso = { used: 0, max: null },
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
    { key: 'resumen' as const, label: 'Resumen', icon: LayoutDashboard, tour: 'tab-resumen' as TourId },
    { key: 'envios' as const, label: 'Envíos', icon: Boxes, tour: 'tab-envios' as TourId },
    { key: 'ventas' as const, label: 'Ventas', icon: ShoppingCart, tour: 'tab-ventas' as TourId },
    { key: 'productos' as const, label: 'Productos', icon: Package, tour: 'tab-productos' as TourId },
    { key: 'compras' as const, label: 'Compras', icon: Truck, tour: 'tab-compras' as TourId },
    { key: 'gastos' as const, label: 'Gastos', icon: Receipt, tour: 'tab-gastos' as TourId },
    { key: 'clientes' as const, label: 'Clientes', icon: Users, tour: 'tab-clientes' as TourId },
    { key: 'formulario' as const, label: 'Formulario', icon: ClipboardList, tour: 'tab-formulario' as TourId },
  ]

  function navegar(p: 'resumen' | 'envios' | 'productos' | 'ventas' | 'compras' | 'gastos' | 'clientes' | 'formulario') {
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
    w-full flex items-center gap-2.5 pl-2.5 pr-3 py-2 rounded-xl text-sm font-medium
    text-slate-600 hover:bg-slate-100/80 hover:text-slate-900
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
        className="fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl shadow-slate-900/10 transition-all duration-300 ease-in-out"
        style={{ width: abierto ? '16rem' : '0rem' }}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-3">
          {abierto && (
            <span className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-900">
              <LogoTori size={28} />
              Menú
            </span>
          )}
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
        <div className="flex-1 overflow-y-auto px-2.5 py-3">
          {abierto && (
            <div className="space-y-4">
              <div>
                <p className="px-3 pb-1.5 pt-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500" />
                  Secciones
                </p>
                {secciones.map((s) => (
                  <div key={s.key} className="group flex items-center gap-1">
                    <button
                      onClick={() => navegar(s.key)}
                      className={`${itemClass} flex-1 ${
                        pestañaActiva === s.key
                          ? 'bg-gradient-to-r from-sky-500/95 to-indigo-500/95 text-white font-semibold shadow-md shadow-indigo-500/25'
                          : ''
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors ${
                          pestañaActiva === s.key
                            ? 'bg-white/15 text-white'
                            : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'
                        }`}
                      >
                        <s.icon size={15} />
                      </span>
                      {s.label}
                      {pestañaActiva === s.key && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </button>
                    <TourHelpButton tourId={s.tour} className="w-6 h-6 mr-1" />
                  </div>
                ))}
              </div>

              <div className="my-1.5 h-px bg-slate-100" />

              <div>
                <p className="px-3 pb-1.5 pt-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-sky-500" />
                  Acciones
                </p>
                {tieneShalom && (
                  <button data-tour="exportar-shalom" onClick={() => ejecutar(onExportShalom)} className={itemClass}>
                    <Download size={16} className="text-sky-500" />
                    Shalom Pro
                    {shalomUso.max != null && (
                      <span className="ml-auto text-[10px] font-semibold text-slate-400">
                        {shalomUso.used}/{shalomUso.max} este mes
                      </span>
                    )}
                  </button>
                )}
                {plan !== 'basic' ? (
                  <button data-tour="cambio-masivo" onClick={() => ejecutar(onCambioMasivo)} className={itemClass}>
                    <Replace size={16} className="text-indigo-500" />
                    Cambio Masivo
                  </button>
                ) : (
                  <div data-tour="cambio-masivo" className="flex items-center justify-between pr-3">
                    <LockedFeature label="Cambio Masivo" hint="Cambio masivo de estados — disponible en Pro y Business Plus" className="flex-1" />
                  </div>
                )}
                <button data-tour="generar-etiquetas" onClick={() => ejecutar(onGenerarEtiquetas)} className={itemClass}>
                  <Tag size={16} className="text-emerald-500" />
                  Generar etiquetas
                </button>
                {showCopiarDatos && (copiarDatosLocked ? (
                  <div data-tour="copiar-datos" className="flex items-center justify-between pr-3">
                    <LockedFeature
                      label="Copiar datos"
                      hint="Copiar datos de más de 50 pedidos motorizados — disponible en Pro y Business Plus"
                      className="flex-1"
                    />
                  </div>
                ) : (
                  <button data-tour="copiar-datos" onClick={() => ejecutar(onCopiarDatos)} className={itemClass}>
                    <Copy size={16} className="text-amber-500" />
                    Copiar datos
                  </button>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* Pie del menú: Configuración siempre visible abajo */}
        {abierto && (
          <div className="shrink-0 border-t border-slate-100 bg-white px-2 py-2.5">
            <button data-tour="configuracion" onClick={() => ejecutar(onConfig)} className={itemClass}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400">
                <Settings size={15} />
              </span>
              Configuración
            </button>
          </div>
        )}
      </div>
    </>
  )
}
