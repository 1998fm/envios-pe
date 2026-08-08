'use client'

import { motion } from 'framer-motion'
import ToriMascot from '@/components/ToriMascot'

const testimonios = [
  {
    quote: 'Es como mi Excel, pero en orden.',
    sub: 'Venta online',
  },
  {
    quote: 'Ahora sé cuánto dinero tengo disponible en segundos.',
    sub: 'Venta online',
  },
  {
    quote: 'Ahora puedo usar mi tiempo para vender más.',
    sub: 'Venta online',
  },
]

export default function TestimonialsSection() {
  return (
    <section id="historias" className="py-20 sm:py-28 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="text-xs uppercase tracking-[.18em] font-black text-tori-600">Historias reales</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight">
            Tori ya forma parte del día a día de{' '}
            <span className="gradient-text">otros emprendedores.</span>
          </h2>
          <p className="mt-4 text-slate-500">
            No queremos decirte que Tori funciona. Preferimos que lo cuenten quienes ya lo están usando.
          </p>
        </motion.div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {testimonios.map((t, i) => (
            <motion.article
              key={t.quote}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm"
            >
              <div className="text-4xl text-tori-300 font-black leading-none">&ldquo;</div>
              <p className="mt-2 text-xl font-black leading-snug text-slate-900">{t.quote}</p>
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="font-bold text-slate-800">Emprendedor usuario de Tori</p>
                <p className="text-sm text-slate-400 mt-1">{t.sub}</p>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-6 rounded-3xl bg-tori-600 text-white p-7 sm:p-9"
        >
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <p className="text-tori-100 text-sm font-bold">Una transformación que resume todo</p>
              <p className="mt-2 text-2xl sm:text-3xl font-black leading-snug">
                &ldquo;Antes me frustraba de tanto trabajo. Ahora puedo usar mi tiempo para vender más.&rdquo;
              </p>
            </div>
            <div className="flex justify-center">
              <ToriMascot variant="happy" size={88} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
