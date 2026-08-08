'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Star } from 'lucide-react'

const testimonios = [
  {
    initial: 'CR',
    grad: 'from-sky-500 to-cyan-500',
    quote: 'Es como mi Excel, pero en orden.',
    context: 'Repostería · Lima',
    result: 'Sin re-aprender nada. Solo con su información ordenada.',
  },
  {
    initial: 'JM',
    grad: 'from-indigo-500 to-purple-500',
    quote: 'Ahora sé cuánto dinero tengo disponible en segundos.',
    context: 'Repostería · Lima',
    result: 'El dinero disponible al instante, sin formatos a mano.',
  },
  {
    initial: 'AP',
    grad: 'from-amber-500 to-orange-500',
    quote: 'Ahora puedo usar mi tiempo para vender más.',
    context: 'Repostería · Lima',
    result: 'Antes perdía horas organizando pedidos.',
  },
  {
    initial: 'JM',
    grad: 'from-indigo-500 to-purple-500',
    quote: 'Ahora tengo más claridad y confianza de lo que tenemos.',
    context: 'Repostería · Lima',
    result: 'De la frustración al control de su negocio.',
  },
]

export default function TestimonialsSection() {
  return (
    <section id="historias" className="py-14 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Historias reales</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Personas como tú ya ordenaron{' '}
            <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              su negocio con Tori.
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Frases de emprendedores que ya usan Tori. Las tomamos tal cual.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {testimonios.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm`}
                >
                  {t.initial}
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{t.context}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                {t.result}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
