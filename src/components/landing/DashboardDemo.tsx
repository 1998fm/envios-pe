'use client'

import { LandingValue } from '@/components/landing/editor/LandingEditable'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, MousePointerClick } from 'lucide-react'
import { useState } from 'react'
import { CountUp, Reveal, Resaltado } from './ui'

const beneficios = [
  'Pedidos y envíos organizados.',
  'Ventas e inventario relacionados.',
  'Dinero disponible visible.',
  'Menos tareas repetitivas.',
]

const ESTADOS = ['Pendiente', 'Listo', 'Envío'] as const
type Estado = (typeof ESTADOS)[number]

const estiloEstado: Record<Estado, string> = {
  Pendiente: 'bg-amber-50 text-amber-700 ring-amber-300',
  Listo: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
  Envío: 'bg-tori-50 text-tori-700 ring-tori-300',
}

export default function DashboardDemo() {
  const [pedidos, setPedidos] = useState<{ name: string; estado: Estado }[]>([
    { name: 'María · Lima', estado: 'Pendiente' },
    { name: 'Andrea · Callao', estado: 'Listo' },
    { name: 'Sofía · Surco', estado: 'Envío' },
  ])

  function avanzar(i: number) {
    setPedidos((p) =>
      p.map((x, idx) =>
        idx === i ? { ...x, estado: ESTADOS[(ESTADOS.indexOf(x.estado) + 1) % ESTADOS.length] } : x
      )
    )
  }

  // "Por preparar" = lo que todavía no salió en envío (6 de base + los que aún no salen en esta lista: 8 al inicio).
  const porPreparar = 6 + pedidos.filter((p) => p.estado !== 'Envío').length
  const todoEnviado = pedidos.every((p) => p.estado === 'Envío')

  return (
    <section className="relative overflow-hidden bg-tori-50/60 py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-tori-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-tori-700">
              <span className="h-1.5 w-1.5 rounded-full bg-tori-500" /><LandingValue value={"Una sola vista"} /></span>
            <h2 className="mt-4 text-3xl font-black leading-[1.1] tracking-tight text-tori-900 sm:text-5xl"><LandingValue value={"De “¿dónde estaba?” a"} /><LandingValue value={' '} />
              <Resaltado><LandingValue value={"“ya sé qué tengo que hacer”."} /></Resaltado>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600"><LandingValue value={"Tori reúne la información que necesitas para gestionar tu día sin estar saltando entre chats, hojas y notas."} /></p>
            <ul className="mt-8 space-y-3">
              {beneficios.map((b, i) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-tori-600 text-white">
                    <Check size={12} />
                  </span>
                  <span className="text-slate-700"><LandingValue value={b} /></span>
                </motion.li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-tori-900/10">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <span className="font-bold text-tori-900"><LandingValue value={"Panel de control"} /></span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    todoEnviado ? 'bg-tori-50 text-tori-700' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <LandingValue value={todoEnviado ? 'Todo enviado' : 'Todo en orden'} />
                </span>
              </div>
              <div className="bg-slate-50/60 p-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: 'Ventas', v: <CountUp value={1248} prefix="S/ " /> },
                    { l: 'Disponible', v: <CountUp value={764} prefix="S/ " /> },
                    { l: 'Pedidos', v: <CountUp value={32} /> },
                    { l: 'Productos', v: <CountUp value={286} /> },
                  ].map((s) => (
                    <div key={s.l} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs text-slate-400"><LandingValue value={s.l} /></p>
                      <p className="mt-1 text-2xl font-black text-tori-900"><LandingValue value={s.v} /></p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-tori-900"><LandingValue value={"Pedidos por preparar"} /></span>
                    <CountUp value={porPreparar} className="text-lg font-black text-tori-600" />
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {pedidos.map((p, i) => (
                      <div key={p.name} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600"><LandingValue value={p.name} /></span>
                        <button
                          onClick={() => avanzar(i)}
                          className={`min-w-[88px] cursor-pointer rounded-full px-3 py-1 text-xs font-bold ring-1 transition hover:scale-105 active:scale-95 ${estiloEstado[p.estado]}`}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                              key={p.estado}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.15 }}
                              className="block"
                            >
                              <LandingValue value={p.estado} />
                            </motion.span>
                          </AnimatePresence>
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <MousePointerClick size={12} /><LandingValue value={" Toca un estado para avanzar el pedido"} /></p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
