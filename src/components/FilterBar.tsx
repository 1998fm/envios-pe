'use client'

import { Search, Calendar, X, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import MultiSelect from '@/components/ui/MultiSelect'

type Metodo = { value: string; label: string }

const estadoOptions = [
  { value: 'NO_EMPACADO', label: 'No Empacado' },
  { value: 'EMPACADO', label: 'Empacado' },
  { value: 'EN_OBSERVACION', label: 'En Observación' },
  { value: 'ENVIADO', label: 'Enviado' },
]

type Props = {
  busqueda: string
  onBusquedaChange: (v: string) => void
  filtrosEstado: string[]
  onFiltrosEstadoChange: (v: string[]) => void
  filtrosMetodo: string[]
  onFiltrosMetodoChange: (v: string[]) => void
  metodosDisponibles: Metodo[]
  fechaDesde: string
  onFechaDesdeChange: (v: string) => void
  fechaHasta: string
  onFechaHastaChange: (v: string) => void
}

export default function FilterBar({
  busqueda, onBusquedaChange,
  filtrosEstado, onFiltrosEstadoChange,
  filtrosMetodo, onFiltrosMetodoChange,
  metodosDisponibles,
  fechaDesde, onFechaDesdeChange,
  fechaHasta, onFechaHastaChange,
}: Props) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])
  return (
    <div data-tour="filter-bar" className="
      bg-white 
      border border-slate-100 
      rounded-2xl shadow-sm
      p-4 sm:p-5
      flex flex-col sm:flex-row gap-3
    ">
       <div data-tour="filtro-busqueda" className="relative flex-1">
         <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 " />
         <input
           placeholder="Buscar por nombre, DNI o teléfono..."
           value={busqueda}
           onChange={(e) => onBusquedaChange(e.target.value)}
           className="
             w-full pl-10 pr-4 py-3 rounded-xl text-sm
             bg-white 
             border border-slate-200 
             text-slate-900 
             placeholder:text-slate-400 :text-slate-500
             focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500
             transition-all duration-200
           "
         />
       </div>

<div className="flex items-center gap-1">
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setAbierto(!abierto)}
              className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-slate-600 transition-colors ${
                abierto ? 'bg-sky-50 text-sky-600' : 'hover:bg-slate-100'
              }`}
              aria-label="Filtrar por fecha"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">
                {fechaDesde || fechaHasta
                  ? `${fechaDesde || '…'} – ${fechaHasta || '…'}`
                  : 'Fecha'}
              </span>
              <ChevronDown size={14} className={abierto ? 'rotate-180' : ''} />
            </button>

            {abierto && (
              <div
                className="absolute right-0 top-full mt-1.5 z-20 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-3"
                data-tour="filtro-fecha"
              >
                <div className="grid gap-2 text-sm">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">Desde</label>
                    <input
                      type="date"
                      value={fechaDesde}
                      max={fechaHasta || undefined}
                      onChange={(e) => onFechaDesdeChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">Hasta</label>
                    <input
                      type="date"
                      value={fechaHasta}
                      min={fechaDesde || undefined}
                      onChange={(e) => onFechaHastaChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    />
                  </div>
                  {(fechaDesde || fechaHasta) && (
                    <button
                      onClick={() => { onFechaDesdeChange(''); onFechaHastaChange('') }}
                      className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
                    >
                      <X size={12} /> Quitar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

       <div data-tour="filtro-estado" className="flex gap-3 flex-wrap">
        <MultiSelect
          label="Estado"
          options={estadoOptions}
          selected={filtrosEstado}
          onChange={onFiltrosEstadoChange}
          allLabel="Todos los estados"
        />
        <MultiSelect
          label="Método"
          options={metodosDisponibles}
          selected={filtrosMetodo}
          onChange={onFiltrosMetodoChange}
          allLabel="Todos los métodos"
        />
      </div>
    </div>
  )
}
