'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import ToriMascot from '@/components/ToriMascot'
import { Reveal, SectionHead, panel } from './ui'

const items = [
  'Busqué una conversación en WhatsApp para encontrar los datos de un pedido.',
  'Vendí algo y después no estaba seguro de si todavía quedaba.',
  'Olvidé cobrar un pedido.',
  'Olvidé enviar un pedido.',
  'Mandé un pedido incompleto.',
  'Copié direcciones manualmente para preparar envíos.',
  'Tengo información repartida entre WhatsApp, Excel, notas o cuadernos.',
  'Después de cada live tengo que sentarme a ordenar todo.',
  'Siento que paso demasiado tiempo organizando en lugar de vender.',
]

function resultado(count: number) {
  if (count === 0) return null
  if (count <= 2)
    return {
      title: 'Parece que todavía tienes varias cosas bajo control.',
      text: 'Aun así, si tu negocio sigue creciendo, este es un buen momento para ordenar antes de que el volumen te obligue a hacerlo.',
      color: '#16a34a',
    }
  if (count <= 5)
    return {
      title: 'Ya estás sintiendo el costo de trabajar con todo separado.',
      text: 'No significa que seas desordenado. Significa que tu negocio está creciendo y tus herramientas necesitan acompañarlo.',
      color: '#087bc0',
    }
  return {
    title: 'Tori probablemente fue hecho pensando en un negocio como el tuyo.',
    text: 'Tienes varias señales de que organizar pedidos, ventas, inventario y envíos ya consume demasiado de tu tiempo.',
    color: '#7c3aed',
  }
}

export default function Diagnostico() {
  const [marcados, setMarcados] = useState<number[]>([])
  const count = marcados.length
  const res = resultado(count)
  const pct = count / items.length

  const toggle = (i: number) =>
    setMarcados((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))

  // Medidor de media vuelta: longitud de arco de 0 a 1.
  const arco = 'M 20 110 A 90 90 0 0 1 200 110'

  return (
    <section id="diagnostico" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead
          center
          eyebrow="Ahora sé sincero contigo mismo"
          title="¿Cuántas de estas cosas te han pasado?"
          sub="No tienes que marcar todas. Solo queremos que seas sincero contigo mismo."
        />

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <Reveal>
            <p className="mb-4 text-sm font-semibold text-slate-500">Marca las que te hayan pasado</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item, i) => {
                const on = marcados.includes(i)
                return (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => toggle(i)}
                    whileTap={{ scale: 0.97 }}
                    animate={{ scale: on ? 1.015 : 1 }}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      on
                        ? 'border-tori-400 bg-tori-50 shadow-[0_10px_30px_-12px_rgba(8,123,192,0.45)]'
                        : 'border-slate-200 bg-white hover:border-tori-300 hover:bg-tori-50/40'
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 text-xs font-black transition ${
                        on ? 'border-tori-600 bg-tori-600 text-white' : 'border-slate-300 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className={`text-sm font-semibold leading-snug sm:text-base ${on ? 'text-tori-900' : 'text-slate-700'}`}>
                      {item}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </Reveal>

          {/* medidor */}
          <Reveal delay={0.1} className="lg:sticky lg:top-28">
            <div className={`${panel} p-6 text-center`}>
              <svg viewBox="0 0 220 125" className="mx-auto w-full max-w-[260px]">
                <path d={arco} fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
                <motion.path
                  d={arco}
                  fill="none"
                  stroke={res?.color ?? '#087bc0'}
                  strokeWidth="14"
                  strokeLinecap="round"
                  initial={false}
                  animate={{ pathLength: pct }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                />
                <text x="110" y="92" textAnchor="middle" className="fill-tori-900 text-[34px] font-black">
                  {count}
                </text>
                <text x="110" y="112" textAnchor="middle" className="fill-slate-400 text-[11px] font-semibold">
                  de {items.length}
                </text>
              </svg>

              <AnimatePresence mode="wait">
                {res ? (
                  <motion.div
                    key={res.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-3"
                  >
                    <div className="flex justify-center">
                      <ToriMascot variant="happy" size={52} />
                    </div>
                    <p className="mt-3 text-lg font-black leading-snug text-tori-900">{res.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{res.text}</p>
                    <a
                      href="#solucion"
                      className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-tori-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-tori-600/25 transition hover:bg-tori-700"
                    >
                      Quiero tener más control
                    </a>
                  </motion.div>
                ) : (
                  <motion.p key="vacio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-slate-400">
                    Marca una para empezar.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
