'use client'

import { Search, Calendar, X } from 'lucide-react'
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

       <div data-tour="filtro-fecha" className="flex flex-wrap items-center gap-2">
         <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2">
           <Calendar size={14} className="shrink-0 text-slate-400" />
           <input
             type="date"
             value={fechaDesde}
             max={fechaHasta || undefined}
             onChange={(e) => onFechaDesdeChange(e.target.value)}
             title="Desde (fecha de registro)"
             className="w-[8rem] bg-transparent text-sm text-slate-900 focus:outline-none"
           />
         </div>
         <span className="text-xs font-semibold text-slate-400">a</span>
         <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2">
           <Calendar size={14} className="shrink-0 text-slate-400" />
           <input
             type="date"
             value={fechaHasta}
             min={fechaDesde || undefined}
             onChange={(e) => onFechaHastaChange(e.target.value)}
             title="Hasta (fecha de registro)"
             className="w-[8rem] bg-transparent text-sm text-slate-900 focus:outline-none"
           />
         </div>
         {(fechaDesde || fechaHasta) && (
           <button
             onClick={() => { onFechaDesdeChange(''); onFechaHastaChange('') }}
             className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
             title="Quitar filtro de fecha"
           >
             <X size={15} />
           </button>
         )}
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
