'use client'

import { Lock } from 'lucide-react'
import { openUpgrade } from '@/lib/planGating'

type Props = {
  label?: string
  hint?: string
  className?: string
}

export default function LockedFeature({
  label = 'Función Pro',
  hint = 'Disponible en el plan Pro',
  className = '',
}: Props) {
  return (
    <button
      type="button"
      data-tour="locked-feature"
      onClick={openUpgrade}
      title={hint}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-sky-400 hover:text-sky-600 transition-all duration-150 cursor-pointer ${className}`}
    >
      <Lock size={14} className="shrink-0" />
      <span>{label}</span>
    </button>
  )
}
