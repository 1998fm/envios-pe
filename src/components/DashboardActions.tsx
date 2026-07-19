'use client'

import { motion } from 'framer-motion'
import { Download, Replace, Tag, Copy, ExternalLink } from 'lucide-react'

type Props = {
  onExportShalom: () => void
  onCambioMasivo: () => void
  onGenerarEtiquetas: () => void
  onCopiarDatos: () => void
  onShalomPro: () => void
  showCopiarDatos: boolean
  tieneShalom: boolean
  plan?: string
}

const btnClass = `
  flex items-center gap-2
  px-4 py-2.5 rounded-xl text-sm font-semibold
  border border-slate-200 
  bg-white 
  text-slate-700 
  hover:bg-slate-50 :bg-slate-700
  hover:border-sky-500 :border-sky-500
  hover:text-sky-700 :text-sky-300
  hover:shadow-sm
  transition-all duration-200
  cursor-pointer
`

const btnGradient = `
  flex items-center gap-2
  px-4 py-2.5 rounded-xl text-sm font-semibold
  bg-gradient-to-r from-sky-600 to-indigo-600
  text-white
  hover:shadow-lg hover:shadow-sky-500/20
  hover:scale-[1.02]
  transition-all duration-200
  cursor-pointer
`

export default function DashboardActions({
  onExportShalom, onCambioMasivo, onGenerarEtiquetas, onCopiarDatos, onShalomPro,
  showCopiarDatos, tieneShalom, plan = 'basic',
}: Props) {
  return (
    <motion.div
      data-tour="actions"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap gap-2.5"
    >
      {tieneShalom && (
        <button data-tour="exportar-shalom" onClick={onExportShalom} className={btnGradient}>
          <Download size={15} />
          Exportar Shalom
        </button>
      )}

      <button onClick={onShalomPro} className={btnClass}>
        <ExternalLink size={15} />
        Shalom Pro
      </button>

      {plan !== 'basic' && (
        <button data-tour="cambio-masivo" onClick={onCambioMasivo} className={btnClass}>
          <Replace size={15} />
          Cambio Masivo
        </button>
      )}

      <button data-tour="generar-etiquetas" onClick={onGenerarEtiquetas} className={btnClass}>
        <Tag size={15} />
        Generar etiquetas
      </button>

      {showCopiarDatos && (
        <button data-tour="copiar-datos" onClick={onCopiarDatos} className={btnGradient}>
          <Copy size={15} />
          Copiar datos
        </button>
      )}
    </motion.div>
  )
}
