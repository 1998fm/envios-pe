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
      style={
        loading
          ? { backgroundColor: 'var(--tori-c)' }
          : {
              backgroundImage: 'var(--tori-grad)',
              boxShadow: '0 10px 15px -3px var(--tori-glow), 0 4px 6px -4px var(--tori-glow)',
            }
      }
      className={`
        w-full py-4 rounded-xl font-semibold text-base
        flex items-center justify-center gap-2.5
        transition-all duration-200
        cursor-pointer
        ${
          loading
            ? 'text-white cursor-not-allowed opacity-70'
            : 'text-white hover:shadow-xl active:shadow-md'
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
