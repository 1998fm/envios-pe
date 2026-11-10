'use client'

import { motion, useScroll, useSpring } from 'framer-motion'
import { useRef } from 'react'
import { Reveal, Spotlight } from './ui'

const pasos = [
  { num: '1', title: 'Crea tu cuenta', desc: 'Empieza tu prueba gratuita y configura tu negocio.' },
  { num: '2', title: 'Organiza tu operación', desc: 'Configura tus productos, ventas, inventario y envíos.' },
  { num: '3', title: 'Empieza a trabajar', desc: 'Deja que Tori te ayude a mantener todo organizado.' },
]

export default function Pasos() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] })
  const alto = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })

  return (
    <section className="relative bg-slate-50/70 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-tori-200 bg-tori-50 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-tori-700">
            <span className="h-1.5 w-1.5 rounded-full bg-tori-500" />
            Así de simple
          </span>
          <h2 className="mt-4 text-3xl font-black leading-[1.1] tracking-tight text-tori-900 sm:text-5xl">
            Empieza a ordenar tu negocio en pocos pasos.
          </h2>
        </Reveal>

        <div ref={ref} className="relative pl-14">
          <div className="absolute bottom-6 left-[19px] top-6 w-0.5 bg-slate-200" />
          <motion.div
            style={{ scaleY: alto, transformOrigin: 'top' }}
            className="absolute bottom-6 left-[19px] top-6 w-0.5 bg-tori-500"
          />
          <div className="space-y-5">
            {pasos.map((p, i) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="relative"
              >
                <motion.span
                  initial={{ scale: 0.6 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="absolute -left-14 top-6 grid h-10 w-10 place-items-center rounded-xl bg-tori-600 font-black text-white shadow-lg shadow-tori-600/30"
                >
                  {p.num}
                </motion.span>
                <Spotlight className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-transform hover:-translate-y-1">
                  <h3 className="text-xl font-black text-tori-900">{p.title}</h3>
                  <p className="mt-2 text-slate-600">{p.desc}</p>
                </Spotlight>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
