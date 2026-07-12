'use client'
import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'

type Option = {
  value: string
  label: string
}

type Props = {
  label: string
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  allLabel?: string
}

export default function MultiSelect({ label, options, selected, onChange, allLabel = 'Todos' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allSelected = selected.length === options.length
  const noneSelected = selected.length === 0

  function toggleAll() {
    if (allSelected) {
      onChange([])
    } else {
      onChange(options.map((o) => o.value))
    }
  }

  function toggleOption(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const displayText = noneSelected
    ? allLabel
    : allSelected
      ? `${allLabel} (${options.length})`
      : `${selected.length} seleccionados`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-xl text-sm
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          text-slate-700 dark:text-slate-300
          hover:border-sky-400 dark:hover:border-sky-500
          focus:outline-none focus:ring-2 focus:ring-sky-500/50
          transition-all duration-200 min-w-[160px]
          ${open ? 'ring-2 ring-sky-500/50 border-sky-500' : ''}
        `}
      >
        <span className="flex-1 text-left truncate">{displayText}</span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 min-w-[200px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl py-1 overflow-hidden">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleAll() }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border-b border-slate-100 dark:border-slate-600"
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-sky-500 border-sky-500' : 'border-slate-300 dark:border-slate-500'}`}>
              {allSelected && <Check size={10} className="text-white" />}
            </div>
            Seleccionar todos
          </button>

          {options.map((opt) => {
            const isSelected = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleOption(opt.value) }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm
                  transition-colors
                  ${isSelected
                    ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'}
                `}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-sky-500 border-sky-500' : 'border-slate-300 dark:border-slate-500'}`}>
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
