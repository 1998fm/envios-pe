'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, ArrowRight } from 'lucide-react'
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
      window.open('https://pro.shalom.pe/home', '_blank', 'noopener,noreferrer')
      setTimeout(() => {
        setAbriendo(false)
        onCerrar()
      }, 1200)
    }, 600)
  }

  useEffect(() => {
    if (!abierto) {
      setAbriendo(false)
    }
  }, [abierto])

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header con gradient */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 pt-6 pb-8 text-center">
              <div className="flex justify-center mb-3">
                <ToriMascot variant="guide" size={72} animate />
              </div>
              <h3 className="text-white font-bold text-lg">Shalom Pro</h3>
              <p className="text-white/70 text-sm mt-1">Gestión de envíos nacionales</p>
              <button onClick={onCerrar} className="absolute top-4 right-4 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {abriendo ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-6 space-y-3"
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ToriMascot variant="happy" size={56} animate />
                  </motion.div>
                  <p className="text-slate-700 font-semibold">Abriendo Shalom Pro...</p>
                  <p className="text-xs text-slate-400">Se abrirá en una nueva ventana</p>
                </motion.div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Accede al panel de Shalom Pro para gestionar envíos nacionales, 
                    imprimir guías y dar seguimiento a tus paquetes.
                  </p>

                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm text-slate-700 space-y-2">
                    <p className="font-semibold text-sky-800">¿Sabías que...?</p>
                    <p>Puedes exportar tus pedidos a Shalom directamente desde el dashboard de Tori con un solo clic.</p>
                  </div>

                  <button
                    onClick={abrirShalomPro}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 hover:scale-[1.02] transition-all duration-200"
                  >
                    <ExternalLink size={16} />
                    Abrir Shalom Pro
                    <ArrowRight size={16} />
                  </button>

                  <p className="text-xs text-slate-400 text-center">
                    Se abrirá <strong>pro.shalom.pe</strong> en una nueva pestaña
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
