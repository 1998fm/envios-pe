'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { Check } from 'lucide-react'

// Maximo de opciones visibles en el dropdown (las demas quedan en scroll).
const MAX_VISIBLES = 12

type Props = {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  requireSelection?: boolean
  errorMessage?: string
}

const inputClass = `
  w-full px-4 py-3.5
  bg-white 
  border border-slate-200 
  rounded-xl
  text-slate-900 
  placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500
  transition-all duration-200
  text-sm
`

const dropdownClass = `
  absolute z-50 mt-1.5 w-full
  bg-white 
  border border-slate-200 
  rounded-xl shadow-lg 
  max-h-60 overflow-y-auto
`

const optionClass = `
  w-full text-left px-4 py-2.5
  text-sm text-slate-700 
  hover:bg-sky-50
  cursor-pointer
`

export default function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
  requireSelection = false,
  errorMessage,
}: Props) {
  const [abierto, setAbierto] = useState(false)

  // Texto diferido: mantiene la UI fluida al teclear aunque options sean
  // cientos de items (evita bloquear el hilo principal en cada keystroke).
  const busqueda = useDeferredValue(value.trim().toLowerCase())

  const esValido = useMemo(() => {
    if (!requireSelection) return true
    if (!value.trim()) return false
    const v = value.trim().toLowerCase()
    return options.some((item) => item.toLowerCase() === v)
  }, [requireSelection, value, options])

  const mostrarError = requireSelection && !esValido

  const filtrados = useMemo(() => {
    if (!busqueda) return options.slice(0, MAX_VISIBLES)
    return options
      .filter((item) => item.toLowerCase().includes(busqueda))
      .slice(0, MAX_VISIBLES)
  }, [busqueda, options])

  return (
    <div>
      <div className="relative">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            setAbierto(true)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          autoComplete="off"
          autoCorrect="off"
          className={`${inputClass} ${
            mostrarError
              ? 'border-red-400 focus:ring-red-500/40 focus:border-red-500'
              : ''
          }`}
          aria-invalid={mostrarError}
        />

        {abierto && filtrados.length > 0 && (
          <div className={dropdownClass}>
            {filtrados.map((item) => {
              const seleccionado =
                value.trim() &&
                item.toLowerCase() === value.trim().toLowerCase()
              return (
                <button
                  key={item}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChange(item)
                    setAbierto(false)
                  }}
                  className={`${optionClass} ${
                    seleccionado ? 'bg-sky-50 font-semibold' : ''
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">{item}</span>
                    {seleccionado && (
                      <Check size={14} className="text-sky-600 shrink-0" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {mostrarError && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {errorMessage || 'Selecciona una opción de la lista.'}
        </p>
      )}
    </div>
  )
}
