'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import ToriMascot from '@/components/ToriMascot'

type Props = {
  abierto: boolean
  onCerrar: () => void
}

export default function ModalShalomPro({ abierto, onCerrar }: Props) {
  const [cargando, setCargando] = useState(true)
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (abierto) setCargando(true)
  }, [abierto])

  function recargar() {
    setCargando(true)
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
              pantallaCompleta
                ? 'fixed inset-2 sm:inset-4 rounded-2xl'
                : 'w-full max-w-5xl h-[85vh]'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <ToriMascot variant="guide" size={32} animate />
                <div>
                  <h3 className="text-white font-bold text-sm">Shalom Pro</h3>
                  <p className="text-white/60 text-[10px]">pro.shalom.pe</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={recargar}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Recargar"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={() => setPantallaCompleta(!pantallaCompleta)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                  {pantallaCompleta ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={onCerrar}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Loader */}
            {cargando && (
              <div className="absolute inset-0 top-12 flex items-center justify-center bg-white z-10">
                <div className="text-center space-y-3">
                  <ToriMascot variant="loading" size={56} animate />
                  <p className="text-sm text-slate-500 font-medium">Cargando Shalom Pro...</p>
                </div>
              </div>
            )}

            {/* Iframe */}
            <iframe
              ref={iframeRef}
              src="/api/proxy/shalom"
              className="w-full flex-1 border-0"
              title="Shalom Pro"
              onLoad={() => setCargando(false)}
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
