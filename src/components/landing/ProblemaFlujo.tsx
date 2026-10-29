'use client'

import { motion, useInView } from 'framer-motion'
import { AlertTriangle, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Reveal, SectionHead } from './ui'

const flujo = ['Cliente', 'WhatsApp', 'Pedido', 'Pago', 'Inventario', 'Empaque', 'Envío', 'Seguimiento']
const errores = ['Pedidos incompletos', 'Cobros olvidados', 'Direcciones copiadas', 'Inventario incierto']
const PRIMER_RIESGO = 3 // a partir de "Pago" empieza lo que se hace después de la venta
const ULTIMO = flujo.length - 1

export default function ProblemaFlujo() {
  const ref = useRef<HTMLDivElement>(null)
  // Arranca solo cuando la persona llega a esta parte (una sola vez).
  const enPantalla = useInView(ref, { once: true, amount: 0.6 })
  const [activo, setActivo] = useState(0)
  const [auto, setAuto] = useState(false)

  // OJO: el temporizador no puede depender de un estado que él mismo cambia: la
  // limpieza del efecto lo cancelaría antes de dispararse.
  useEffect(() => {
    if (!enPantalla) return
    const t = setTimeout(() => setAuto(true), 700)
    return () => clearTimeout(t)
  }, [enPantalla])

  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => {
      setActivo((a) => {
        if (a >= ULTIMO) {
          setAuto(false)
          return a
        }
        return a + 1
      })
    }, 950)
    return () => clearInterval(t)
  }, [auto])

  function reproducir() {
    if (auto) return setAuto(false)
    if (activo >= ULTIMO) setActivo(0)
    setAuto(true)
  }

  const terminado = activo >= ULTIMO && !auto
  const encendidos = activo < PRIMER_RIESGO ? 0 : Math.min(errores.length, activo - PRIMER_RIESGO + 1)
  const enRiesgo = activo >= PRIMER_RIESGO

  return (
    <section id="problema" className="relative overflow-hidden bg-slate-50/70 py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="El problema real"
          title="El problema no es que tengas muchas ventas."
          sub={
            <>
              Es todo lo que tienes que hacer <strong className="text-tori-900">después</strong> de cada venta.
            </>
          }
        />

        <div>
          <div ref={ref} className="mt-14">
          <Reveal delay={0.1}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Así recorre una venta tu día</p>
              <button
                onClick={reproducir}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-tori-900 shadow-sm transition hover:border-tori-400 hover:text-tori-700"
              >
                {auto ? <Pause size={13} /> : terminado ? <RotateCcw size={13} /> : <Play size={13} />}
                {auto ? 'Pausar' : terminado ? 'Repetir' : 'Reproducir'}
              </button>
            </div>

            {/* línea de tiempo */}
            <div className="relative">
              <div className="absolute left-0 right-0 top-[22px] hidden h-0.5 bg-slate-200 lg:block" />
              <motion.div
                className={`absolute left-0 top-[22px] hidden h-0.5 lg:block ${
                  enRiesgo ? 'bg-gradient-to-r from-tori-500 to-amber-400' : 'bg-tori-500'
                }`}
                animate={{ width: `${(activo / ULTIMO) * 100}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
              />
              <div className="relative grid grid-cols-4 gap-3 lg:grid-cols-8">
                {flujo.map((paso, i) => {
                  const hecho = i <= activo
                  const riesgo = i >= PRIMER_RIESGO
                  return (
                    <button
                      key={paso}
                      onClick={() => {
                        setAuto(false)
                        setActivo(i)
                      }}
                      className="group flex cursor-pointer flex-col items-center gap-2"
                    >
                      <motion.span
                        animate={{ scale: i === activo ? 1.18 : 1 }}
                        className={`grid h-11 w-11 place-items-center rounded-full border-2 text-sm font-black transition-colors ${
                          hecho
                            ? riesgo
                              ? 'border-amber-400 bg-amber-400 text-white shadow-[0_6px_18px_-4px_rgba(245,158,11,0.6)]'
                              : 'border-tori-600 bg-tori-600 text-white shadow-[0_6px_18px_-4px_rgba(8,123,192,0.55)]'
                            : 'border-slate-300 bg-white text-slate-400 group-hover:border-tori-400'
                        }`}
                      >
                        {i + 1}
                      </motion.span>
                      <span
                        className={`text-xs font-bold transition-colors ${
                          hecho ? (riesgo ? 'text-amber-700' : 'text-tori-900') : 'text-slate-400'
                        }`}
                      >
                        {paso}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Reveal>
          </div>

          <Reveal delay={0.15} className="mt-10">
            <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10 lg:grid-cols-2 lg:items-center">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50">
                  <AlertTriangle size={22} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-black text-tori-900">Cuando todo termina en un lugar diferente...</p>
                  <p className="mt-1 text-sm text-slate-500">tu negocio empieza a depender de tu memoria.</p>
                  <motion.p
                    animate={{ opacity: enRiesgo ? 1 : 0.3 }}
                    className="mt-5 text-3xl font-black leading-tight text-tori-900"
                  >
                    Y ahí comienzan los errores.
                  </motion.p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {errores.map((e, i) => {
                  const on = i < encendidos
                  return (
                    <motion.div
                      key={e}
                      animate={{ scale: on ? 1 : 0.96, opacity: on ? 1 : 0.5 }}
                      className={`rounded-xl border p-3 font-semibold transition-colors ${
                        on
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {e}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
