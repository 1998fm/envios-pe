'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import ToriMascot from '@/components/ToriMascot'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

type Props = {
  titulo: string
  text: string
  step: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
  style?: React.CSSProperties
}

const MARGEN = 12

export default function OnboardingTooltip({ titulo, text, step, totalSteps, onNext, onSkip, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ dx: 0, dy: 0 })

  // Re-ajusta la posición para que el tooltip nunca se salga de la pantalla,
  // midiendo su tamaño real (independiente de textos largos o del zoom).
  useLayoutEffect(() => {
    function ajustar() {
      const el = ref.current
      if (!el) return
      const top = parseFloat(el.style.top || '0')
      const left = parseFloat(el.style.left || '0')
      const w = el.offsetWidth
      const h = el.offsetHeight

      let dx = 0
      let dy = 0

      if (left < MARGEN) dx = MARGEN - left
      if (left + w > window.innerWidth - MARGEN) dx = window.innerWidth - MARGEN - (left + w)
      if (top < MARGEN) dy = MARGEN - top
      if (top + h > window.innerHeight - MARGEN) dy = window.innerHeight - MARGEN - (top + h)

      setOffset({ dx, dy })
    }

    ajustar()
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [text, step, style])

  return (
    <div
      ref={ref}
      style={{ ...style, transform: `translate(${offset.dx}px, ${offset.dy}px)` }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 sm:p-5 w-80 sm:w-96 max-w-[calc(100vw-24px)] pointer-events-auto"
      >
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Cerrar"
        >
          <X size={14} />
        </button>
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <ToriMascot variant="guide" size={48} animate />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">
              {titulo}
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {text}
            </p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === step - 1
                        ? 'bg-sky-500 w-3'
                        : i < step - 1
                        ? 'bg-sky-300'
                        : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onSkip}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Saltar
                </button>
                <button
                  onClick={onNext}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
                >
                  {step === totalSteps ? 'Finalizar' : 'Siguiente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
