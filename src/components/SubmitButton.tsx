'use client'

import { motion } from 'framer-motion'
import { Loader2, Send } from 'lucide-react'

type Props = {
  loading: boolean
  onClick: () => void
}

export default function SubmitButton({ loading, onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileHover={loading ? {} : { scale: 1.02 }}
      whileTap={loading ? {} : { scale: 0.98 }}
      className={`
        w-full py-4 rounded-xl font-semibold text-base
        flex items-center justify-center gap-2.5
        transition-all duration-200
        cursor-pointer
        ${
          loading
            ? 'bg-sky-400  text-white cursor-not-allowed'
            : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 active:shadow-md'
        }
      `}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Enviando...</span>
        </>
      ) : (
        <>
          <Send size={16} />
          <span>Solicitar Envío</span>
        </>
      )}
    </motion.button>
  )
}
