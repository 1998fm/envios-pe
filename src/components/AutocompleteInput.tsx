'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  requireSelection?: boolean
  errorMessage?: string
  showAddress?: boolean
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
  backdrop-blur-sm
`

const optionClass = `
  w-full text-left px-4 py-3
  text-sm text-slate-700 
  hover:bg-sky-50
  transition-colors duration-150
  cursor-pointer
`

export default function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
  requireSelection = false,
  errorMessage,
  showAddress = false,
}: Props) {
  const [abierto, setAbierto] = useState(false)

  const esValido = useMemo(() => {
    if (!requireSelection) return true
    if (!value.trim()) return false
    return options.some(
      (item) => item.toLowerCase() === value.trim().toLowerCase()
    )
  }, [requireSelection, value, options])

  const mostrarError = requireSelection && !esValido

  const filtrados = useMemo(() => {
    if (!value.trim()) return options.slice(0, 20)
    return options
      .filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 20)
  }, [value, options])

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
          className={`${inputClass} ${
            mostrarError
              ? 'border-red-400 focus:ring-red-500/40 focus:border-red-500'
              : ''
          }`}
          aria-invalid={mostrarError}
        />

        <AnimatePresence>
          {abierto && filtrados.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={dropdownClass}
            >
              {filtrados.map((item) => {
                const seleccionado =
                  value.trim() &&
                  item.toLowerCase() === value.trim().toLowerCase()

                let nombre = item
                let direccion = ''
                if (showAddress) {
                  const partes = item.split(' / ')
                  if (partes.length >= 3) {
                    nombre = partes[partes.length - 1]
                    direccion = partes.slice(0, partes.length - 1).join(' / ')
                  }
                }

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
                      <span className="flex flex-col min-w-0">
                        <span className="truncate">{nombre}</span>
                        {showAddress && direccion && (
                          <span className="text-xs text-slate-400 truncate normal-case font-normal">
                            {direccion}
                          </span>
                        )}
                      </span>
                      {seleccionado && (
                        <Check size={14} className="text-sky-600 shrink-0" />
                      )}
                    </span>
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {mostrarError && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {errorMessage || 'Selecciona una opción de la lista.'}
        </p>
      )}
    </div>
  )
}