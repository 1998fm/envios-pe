'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import ToriMascot from '@/components/ToriMascot'

type Props = {
  error: string
  showTori?: boolean
}

export default function ErrorBanner({ error, showTori = false }: Props) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="
            flex items-start gap-2.5
            bg-red-50 
            border border-red-200 
            text-red-700 
            rounded-xl px-4 py-3
            text-sm
          "
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          {showTori && <ToriMascot variant="error" size={24} animate />}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
