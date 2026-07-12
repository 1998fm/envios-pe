'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
}

const inputClass = `
  w-full px-4 py-3.5
  bg-white dark:bg-slate-900/50
  border border-slate-200 dark:border-slate-700
  rounded-xl
  text-slate-900 dark:text-slate-100
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500
  transition-all duration-200
  text-sm
`

const dropdownClass = `
  absolute z-50 mt-1.5 w-full
  bg-white dark:bg-slate-800
  border border-slate-200 dark:border-slate-700
  rounded-xl shadow-lg dark:shadow-slate-900/50
  max-h-60 overflow-y-auto
  backdrop-blur-sm
`

const optionClass = `
  w-full text-left px-4 py-3
  text-sm text-slate-700 dark:text-slate-300
  hover:bg-sky-50 dark:hover:bg-sky-900/20
  transition-colors duration-150
  cursor-pointer
`

export default function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
}: Props) {
  const [abierto, setAbierto] = useState(false)

  const filtrados = useMemo(() => {
    if (!value.trim()) return options.slice(0, 20)
    return options
      .filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 20)
  }, [value, options])

  return (
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
        className={inputClass}
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
            {filtrados.map((item) => (
              <button
                key={item}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(item)
                  setAbierto(false)
                }}
                className={optionClass}
              >
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
