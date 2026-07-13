'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { CheckCircle2, Calendar } from 'lucide-react'

type Props = {
  logoUrl?: string
  redirectMessage?: string
  redirectUrl?: string
  fechaProgramada?: string
}

export default function SuccessScreen({
  logoUrl,
  redirectMessage,
  redirectUrl,
  fechaProgramada,
}: Props) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    const duration = 2000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#0ea5e9', '#3b82f6', '#4f46e5'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#0ea5e9', '#3b82f6', '#4f46e5'],
      })

      if (Date.now() < end) requestAnimationFrame(frame)
    }

    frame()
  }, [])

  useEffect(() => {
    if (redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = redirectUrl
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [redirectUrl])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="
        bg-white 
        border border-slate-200 
        rounded-2xl shadow-xl
        p-8 sm:p-10
        text-center
        relative overflow-hidden
      ">
        <div className="
          absolute top-0 left-0 right-0 h-1.5
          bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600
        " />

        {logoUrl && (
          <div className="flex justify-center mb-6">
            <img src={logoUrl} alt="Logo" className="max-h-20 object-contain" />
          </div>
        )}

        <div className="flex justify-center mb-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 "
          >
            <CheckCircle2 size={36} className="text-emerald-600 " />
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 ">
          Pedido registrado correctamente
        </h2>

        <p className="mt-3 text-slate-500  whitespace-pre-line">
          {redirectMessage || 'Gracias por tu solicitud.'}
        </p>

        {fechaProgramada && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 rounded-xl bg-sky-50  border border-sky-200  p-4"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500  mb-1">
              <Calendar size={14} />
              <span>Fecha programada</span>
            </div>
            <div className="text-lg font-bold text-sky-700 ">
              {new Date(fechaProgramada + 'T12:00:00').toLocaleDateString('es-PE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </div>
          </motion.div>
        )}

        {redirectUrl && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-5 text-xs text-slate-400 "
          >
            Redireccionando...
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}
