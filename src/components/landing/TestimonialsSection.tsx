'use client'

import { LandingValue } from '@/components/landing/editor/LandingEditable'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import ToriMascot from '@/components/ToriMascot'
import { Reveal, Resaltado, SectionHead } from './ui'

const testimonios = [
  { quote: 'Es como mi Excel, pero en orden.', sub: 'Venta online' },
  { quote: 'Ahora sé cuánto dinero tengo disponible en segundos.', sub: 'Venta online' },
  { quote: 'Ahora puedo usar mi tiempo para vender más.', sub: 'Venta online' },
]

export default function TestimonialsSection() {
  const [i, setI] = useState(0)
  const [pausa, setPausa] = useState(false)

  useEffect(() => {
    if (pausa) return
    const t = setInterval(() => setI((v) => (v + 1) % testimonios.length), 5000)
    return () => clearInterval(t)
  }, [pausa])

  const t = testimonios[i]

  return (
    <section id="historias" className="relative bg-slate-50/70 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHead
          center
          eyebrow="Historias reales"
          title={
            <><LandingValue value={"Tori ya forma parte del día a día de "} /><Resaltado><LandingValue value={"otros emprendedores."} /></Resaltado>
            </>
          }
          sub="No queremos decirte que Tori funciona. Preferimos que lo cuenten quienes ya lo están usando."
        />

        <Reveal delay={0.1} className="mt-14">
          <div
            onMouseEnter={() => setPausa(true)}
            onMouseLeave={() => setPausa(false)}
            className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-14"
          >
            <span className="pointer-events-none absolute -left-2 -top-10 select-none text-[12rem] font-black leading-none text-tori-100"><LandingValue value={"“"} /></span>
            <div className="relative min-h-[150px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-3xl font-black leading-tight text-tori-900 sm:text-5xl"><LandingValue value={t.quote} /></p>
                  <div className="mt-8 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-tori-600 text-sm font-black text-white"><LandingValue value={"T"} /></span>
                    <div>
                      <p className="font-bold text-tori-900"><LandingValue value={"Emprendedor usuario de Tori"} /></p>
                      <p className="text-sm text-slate-500"><LandingValue value={t.sub} /></p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative mt-8 flex gap-2">
              {testimonios.map((_, k) => (
                <button
                  key={k}
                  onClick={() => setI(k)}
                  aria-label={`Historia ${k + 1}`}
                  className="group relative h-6 flex-1 cursor-pointer"
                >
                  <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200">
                    <LandingValue value={k === i && (
                      <motion.span
                        key={`${i}-${pausa}`}
                        className="block h-full rounded-full bg-tori-600"
                        initial={{ width: pausa ? '100%' : '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: pausa ? 0 : 5, ease: 'linear' }}
                      />
                    )} />
                    <LandingValue value={k < i && <span className="block h-full w-full rounded-full bg-tori-300" />} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-6">
          <div className="grid items-center gap-6 rounded-3xl bg-gradient-to-br from-tori-700 to-tori-500 p-7 text-white shadow-xl shadow-tori-600/20 sm:p-9 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-bold text-tori-100"><LandingValue value={"Una transformación que resume todo"} /></p>
              <p className="mt-2 text-2xl font-black leading-snug sm:text-3xl"><LandingValue value={"“Antes me frustraba de tanto trabajo. Ahora puedo usar mi tiempo para vender más.”"} /></p>
            </div>
            <div className="flex justify-center">
              <ToriMascot variant="happy" size={88} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
