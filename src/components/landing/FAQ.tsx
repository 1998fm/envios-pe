'use client'

import { LandingValue } from '@/components/landing/editor/LandingEditable'

import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Reveal, SectionHead } from './ui'

const faqs = [
  {
    q: '¿Necesito conocimientos técnicos para usar Tori?',
    a: 'No. Tori está diseñado para ser sencillo y guiarte durante el uso.',
  },
  {
    q: '¿Tengo que cambiar la forma en que vendo?',
    a: 'No. Puedes seguir utilizando tus canales habituales, como WhatsApp, TikTok e Instagram.',
  },
  {
    q: '¿Tori reemplaza WhatsApp?',
    a: 'No. Tori organiza la información que genera tu negocio para que puedas gestionarla mejor.',
  },
  {
    q: '¿Tengo que dejar Excel inmediatamente?',
    a: 'No. Puedes comenzar utilizando Tori y hacer la transición a tu propio ritmo.',
  },
  {
    q: '¿Tori es solo para empresas grandes?',
    a: 'No. Tori está pensado para emprendedores que necesitan organizar mejor su negocio a medida que crecen.',
  },
  {
    q: '¿Cuánto cuesta probar Tori?',
    a: 'Puedes probar Tori durante 14 días gratis, sin tarjeta.',
  },
]

export default function FAQ() {
  const [abierta, setAbierta] = useState<number | null>(0)

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHead
          center
          eyebrow="Preguntas frecuentes"
          title="Antes de empezar, quizá quieras saber esto."
        />
        <Reveal delay={0.1} className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const open = abierta === i
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                  open ? 'border-tori-300 shadow-md shadow-tori-600/10' : 'border-slate-200 hover:border-tori-200'
                }`}
              >
                <button
                  onClick={() => setAbierta(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-black text-tori-900"><LandingValue value={f.q} /></span>
                  <motion.span
                    animate={{ rotate: open ? 135 : 0 }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tori-50 text-tori-600"
                  >
                    <Plus size={16} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <p className="px-5 pb-5 leading-relaxed text-slate-600"><LandingValue value={f.a} /></p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}
