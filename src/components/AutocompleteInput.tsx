'use client'

import { useDeferredValue, useMemo, useState, useRef, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'

// Maximo de opciones visibles en el dropdown (las demas quedan en scroll).
const MAX_VISIBLES = 16

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
  fixed z-[9999]
  bg-white 
  border border-slate-200 
  rounded-xl shadow-2xl 
  max-h-[45vh] overflow-y-auto
  py-1
`

const optionClass = `
  w-full text-left px-3 py-2
  text-sm text-slate-700 leading-snug
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

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

  const abrir = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ top: r.bottom + 6, left: r.left, width: r.width })
    setAbierto(true)
  }, [])

  const cerrar = useCallback(() => setAbierto(false), [])

  // Mantiene la posicion del portal al hacer scroll/resize.
  useLayoutEffect(() => {
    if (!abierto) return
    const actualizar = () => {
      const el = inputRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left, width: r.width })
    }
    actualizar()
    window.addEventListener('scroll', actualizar, true)
    window.addEventListener('resize', actualizar)
    return () => {
      window.removeEventListener('scroll', actualizar, true)
      window.removeEventListener('resize', actualizar)
    }
  }, [abierto])

  const dropdown =
    abierto && pos && filtrados.length > 0
      ? createPortal(
          <div
            className={dropdownClass}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {filtrados.map((item) => {
              const seleccionado =
                value.trim() && item.toLowerCase() === value.trim().toLowerCase()
              return (
                <button
                  key={item}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChange(item)
                    cerrar()
                  }}
                  className={`${optionClass} ${
                    seleccionado ? 'bg-sky-50 font-semibold' : ''
                  }`}
                >
                  <span className="flex items-start justify-between gap-2 min-w-0">
                    <span className="break-words whitespace-normal">{item}</span>
                    {seleccionado && (
                      <Check size={14} className="text-sky-600 shrink-0 mt-0.5" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>,
          document.body
        )
      : null

  return (
    <div>
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value)
          abrir()
        }}
        onFocus={abrir}
        onBlur={() => setTimeout(cerrar, 150)}
        autoComplete="off"
        autoCorrect="off"
        className={`${inputClass} ${
          mostrarError ? 'border-red-400 focus:ring-red-500/40 focus:border-red-500' : ''
        }`}
        aria-invalid={mostrarError}
      />

      {dropdown}

      {mostrarError && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {errorMessage || 'Selecciona una opción de la lista.'}
        </p>
      )}
    </div>
  )
}
