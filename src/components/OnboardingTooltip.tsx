'use client'

import ToriMascot from '@/components/ToriMascot'
import { motion } from 'framer-motion'

type Props = {
  text: string
  step: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
  style?: React.CSSProperties
}

export default function OnboardingTooltip({ text, step, totalSteps, onNext, onSkip, style }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={style}
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-5 w-80 sm:w-96 pointer-events-auto"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <ToriMascot variant="guide" size={48} animate />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {text}
          </p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-400 font-medium">{step}/{totalSteps}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={onSkip}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
  )
}
