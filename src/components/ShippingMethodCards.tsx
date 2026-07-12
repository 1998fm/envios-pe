'use client'

import { motion } from 'framer-motion'
import { Bike, Building2, Truck, Ship, Flower2, Package } from 'lucide-react'

type Metodo = { value: string; label: string }

type Props = {
  metodos: Metodo[]
  selected: string
  onSelect: (value: string) => void
}

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  MOTORIZADO: Bike,
  SHALOM: Building2,
  OLVA: Truck,
  MARVISUR: Ship,
  FLORES: Flower2,
}

const defaultIcon = Package

export default function ShippingMethodCards({ metodos, selected, onSelect }: Props) {
  if (metodos.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
    >
      <h2 className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold mb-3">
        Información de envío
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {metodos.map((metodo, i) => {
          const isActive = selected === metodo.value
          const Icon = iconMap[metodo.value] ?? defaultIcon

          return (
            <motion.button
              key={metodo.value}
              type="button"
              onClick={() => onSelect(metodo.value)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`
                relative flex flex-col items-center gap-1.5
                px-3 py-3.5 rounded-xl
                text-xs font-medium
                border-2 transition-all duration-200
                cursor-pointer
                ${
                  isActive
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="method-check"
                  className="absolute top-1.5 right-1.5 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
              )}
              <Icon size={22} />
              <span>{metodo.label}</span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
