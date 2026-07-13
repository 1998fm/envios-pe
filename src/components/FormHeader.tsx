'use client'

import { motion } from 'framer-motion'

type Props = {
  logoUrl?: string
}

export default function FormHeader({ logoUrl }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="text-center"
    >
      {logoUrl && (
        <div className="flex justify-center mb-6">
          <img
            src={logoUrl}
            alt="Logo"
            className="max-h-20 object-contain"
          />
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 ">
        Registra tu envío
      </h1>

      <p className="mt-2 text-slate-500  text-sm sm:text-base">
        Completa tus datos para coordinar tu entrega.
      </p>
    </motion.div>
  )
}
