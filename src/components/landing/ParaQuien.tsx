'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Reveal, SectionHead } from './ui'

const si = [
  'Vendes principalmente por WhatsApp.',
  'Captas clientes desde TikTok, Instagram o Facebook.',
  'Tienes pedidos constantemente.',
  'Usas Excel, Google Sheets, notas o cuadernos.',
  'Organizar el negocio consume demasiado tiempo.',
  'Quieres vender más sin trabajar cada vez más horas.',
]

const no = [
  'Buscas un ERP empresarial extremadamente complejo.',
  'Quieres una herramienta que haga absolutamente todo.',
  'Tu operación necesita procesos corporativos muy específicos.',
]

export default function ParaQuien() {
  const [encaja, setEncaja] = useState(true)
  const lista = encaja ? si : no

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHead
          center
          eyebrow="¿Tori es para ti?"
          title="Si mientras leías esto pensaste “eso me pasa a mí”..."
          sub="probablemente Tori fue hecho pensando en alguien como tú."
        />

        <Reveal delay={0.1} className="mt-12">
          <div className="mx-auto flex w-fit rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {[
              { v: true, label: 'Tori puede encajar contigo si...' },
              { v: false, label: 'Quizá no sea lo que buscas si...' },
            ].map((o) => (
              <button
                key={String(o.v)}
                onClick={() => setEncaja(o.v)}
                className={`relative cursor-pointer rounded-full px-4 py-2.5 text-xs font-bold transition-colors sm:px-6 sm:text-sm ${
                  encaja === o.v ? 'text-white' : 'text-slate-500 hover:text-tori-700'
                }`}
              >
                {encaja === o.v && (
                  <motion.span
                    layoutId="paraquien-pill"
                    className={`absolute inset-0 rounded-full ${o.v ? 'bg-tori-600' : 'bg-slate-500'}`}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{o.label}</span>
              </button>
            ))}
          </div>

          <div
            className={`mt-6 rounded-3xl border p-7 transition-colors sm:p-10 ${
              encaja ? 'border-tori-200 bg-tori-50/70' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.ul
                key={String(encaja)}
                initial="oculto"
                animate="visible"
                exit={{ opacity: 0 }}
                variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
                className="space-y-4"
              >
                {lista.map((item) => (
                  <motion.li
                    key={item}
                    variants={{ oculto: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0 } }}
                    className="flex items-start gap-3 text-lg text-slate-700"
                  >
                    <span
                      className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                        encaja ? 'bg-tori-600 text-white' : 'bg-slate-300 text-white'
                      }`}
                    >
                      {encaja ? <Check size={12} /> : <X size={12} />}
                    </span>
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </AnimatePresence>

            {!encaja && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700">
                Tori está pensado para emprendedores que quieren ordenar su negocio sin complicarse.
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
