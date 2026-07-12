'use client'
import { useState, useRef, useEffect } from 'react'

type Option = {
  value: string
  label: string
}

type Props = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  badge?: (value: string) => { label: string; className: string }
  align?: 'left' | 'right'
}

export default function MenuSelect({ value, onChange, options, badge, align = 'left' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentOption = options.find((o) => o.value === value)
  const display = badge ? badge(value) : null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
          transition-all duration-150 border
          ${display
            ? display.className
            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-sky-400'}
          ${open ? 'ring-2 ring-sky-500/40' : ''}
        `}
      >
        {display ? display.label : currentOption?.label || value}
        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={`
          absolute z-20 mt-1 min-w-[140px]
          bg-white dark:bg-slate-700
          border border-slate-200 dark:border-slate-600
          rounded-xl shadow-lg
          py-1 overflow-hidden
          ${align === 'right' ? 'right-0' : 'left-0'}
        `}>
          {options.map((opt) => {
            const optDisplay = badge ? badge(opt.value) : null
            return (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false) }}
                className={`
                  w-full text-left px-4 py-2 text-xs font-semibold
                  transition-colors
                  ${value === opt.value
                    ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}
                `}
              >
                {optDisplay ? (
                  <span className={`inline-flex px-2 py-0.5 rounded-md ${optDisplay.className}`}>
                    {optDisplay.label}
                  </span>
                ) : (
                  opt.label
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
