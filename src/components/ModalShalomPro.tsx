'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import ToriMascot from '@/components/ToriMascot'

type Props = {
  abierto: boolean
  onCerrar: () => void
}

export default function ModalShalomPro({ abierto, onCerrar }: Props) {
  const [abriendo, setAbriendo] = useState(false)

  function abrirShalomPro() {
    setAbriendo(true)
    setTimeout(() => {
      window.open('https://pro.shalom.pe', '_blank', 'noopener,noreferrer')
      onCerrar()
    }, 1200)
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center"
          >
            {abriendo ? (
              <div className="space-y-4 py-4">
                <ToriMascot variant="loading" size={64} animate />
                <p className="text-slate-600 font-medium">Abriendo Shalom Pro...</p>
                <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <ToriMascot variant="guide" size={64} animate />
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Shalom Pro</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Sistema de gestión de envíos de Shalom
                  </p>
                </div>
                <button
                  onClick={abrirShalomPro}
                  className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium hover:from-sky-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  <ExternalLink size={18} />
                  Abrir Shalom Pro
                </button>
                <button
                  onClick={onCerrar}
                  className="w-full text-slate-400 hover:text-slate-600 text-sm py-2 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
