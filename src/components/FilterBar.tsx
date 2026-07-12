'use client'

import { Search } from 'lucide-react'
import MultiSelect from '@/components/ui/MultiSelect'

type Metodo = { value: string; label: string }

const estadoOptions = [
  { value: 'NO_EMPACADO', label: 'No Empacado' },
  { value: 'EMPACADO', label: 'Empacado' },
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
}

export default function FilterBar({
  busqueda, onBusquedaChange,
  filtrosEstado, onFiltrosEstadoChange,
  filtrosMetodo, onFiltrosMetodoChange,
  metodosDisponibles,
}: Props) {
  return (
    <div data-tour="filter-bar" className="
      bg-white dark:bg-slate-800/95
      border border-slate-100 dark:border-slate-700/50
      rounded-2xl shadow-sm
      p-4 sm:p-5
      flex flex-col sm:flex-row gap-3
    ">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          placeholder="Buscar por nombre, DNI o teléfono..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="
            w-full pl-10 pr-4 py-3 rounded-xl text-sm
            bg-white dark:bg-slate-900/50
            border border-slate-200 dark:border-slate-700
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500
            transition-all duration-200
          "
        />
      </div>

      <div className="flex gap-3 flex-wrap">
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
