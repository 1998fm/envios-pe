'use client'

import { motion } from 'framer-motion'
import { BarChart3, ClipboardList, Coins, MessageCircle, Package, ShoppingCart, Truck } from 'lucide-react'
import { useState } from 'react'
import ToriMascot from '@/components/ToriMascot'
import { Reveal, Resaltado, SectionHead } from './ui'

const antes = [
  { icon: MessageCircle, title: 'WhatsApp', sub: 'Conversaciones', rot: -5, x: -6, y: 4 },
  { icon: BarChart3, title: 'Excel', sub: 'Hojas y cuentas', rot: 4, x: 8, y: -6 },
  { icon: ClipboardList, title: 'Notas', sub: 'Pendientes', rot: 6, x: -4, y: 6 },
  { icon: Truck, title: 'Courier', sub: 'Envíos', rot: -4, x: 6, y: -4 },
]

const despues = [
  { icon: ShoppingCart, title: 'Pedidos', sub: 'Más ordenados' },
  { icon: Coins, title: 'Ventas', sub: 'Más claridad' },
  { icon: Package, title: 'Inventario', sub: 'Más control' },
  { icon: Truck, title: 'Envíos', sub: 'Menos copiar' },
]

export default function AntesDespues() {
  const [conectado, setConectado] = useState(false)

  return (
    <section id="solucion" className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          center
          eyebrow="Aquí entra Tori"
          title={
            <>
              Todo lo que hoy tienes separado, <Resaltado>conectado.</Resaltado>
            </>
          }
          sub="No necesitas otra herramienta para complicarte. Necesitas que pedidos, ventas, inventario, dinero y envíos puedan trabajar juntos."
        />

        {/* interruptor */}
        <Reveal delay={0.1} className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={() => setConectado((v) => !v)}
            aria-pressed={conectado}
            className="relative flex cursor-pointer items-center rounded-full border border-slate-200 bg-white p-1 text-sm font-black shadow-sm"
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full ${
                conectado ? 'right-1 bg-tori-600' : 'left-1 bg-slate-500'
              }`}
            />
            <span className={`relative z-10 px-6 py-2 transition-colors ${!conectado ? 'text-white' : 'text-slate-500'}`}>
              Hoy
            </span>
            <span className={`relative z-10 px-6 py-2 transition-colors ${conectado ? 'text-white' : 'text-slate-500'}`}>
              Con Tori
            </span>
          </button>
          <p className="text-xs text-slate-400">{conectado ? 'Todo trabaja junto' : 'Toca el interruptor'}</p>
        </Reveal>

        <div className="mt-12 grid items-center gap-6 lg:grid-cols-[1fr_72px_auto_72px_1fr]">
          {/* izquierda: lo separado */}
          <div className="grid grid-cols-2 gap-3">
            {antes.map((g) => (
              <motion.div
                key={g.title}
                animate={{
                  rotate: conectado ? 0 : g.rot,
                  x: conectado ? 0 : g.x,
                  y: conectado ? 0 : g.y,
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                className={`rounded-2xl border p-5 shadow-sm transition-colors ${
                  conectado ? 'border-tori-300 bg-tori-50' : 'border-dashed border-slate-300 bg-white'
                }`}
              >
                <g.icon size={24} className={conectado ? 'text-tori-600' : 'text-slate-400'} />
                <p className="mt-3 font-black text-tori-900">{g.title}</p>
                <p className="mt-1 text-xs text-slate-500">{g.sub}</p>
              </motion.div>
            ))}
          </div>

          <Conector activo={conectado} />

          {/* centro */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative grid h-32 w-32 place-items-center">
              {conectado &&
                [0, 1].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute inset-0 rounded-[2rem] border-2 border-tori-400/60"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.7, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 1, ease: 'easeOut' }}
                  />
                ))}
              <motion.div
                animate={{ scale: conectado ? 1.08 : 1, filter: conectado ? 'grayscale(0)' : 'grayscale(0.9)' }}
                className={`grid h-28 w-28 place-items-center rounded-[2rem] border bg-white transition-shadow ${
                  conectado ? 'border-tori-300 shadow-[0_20px_50px_-12px_rgba(8,123,192,0.45)]' : 'border-slate-200 shadow-sm'
                }`}
              >
                <div className="text-center">
                  <ToriMascot variant="logo" size={52} />
                  <p className="mt-1 text-sm font-black text-tori-700">TORI</p>
                </div>
              </motion.div>
            </div>
            <span className={`text-xs font-bold transition-colors ${conectado ? 'text-tori-600' : 'text-slate-400'}`}>
              Conecta
            </span>
          </div>

          <Conector activo={conectado} />

          {/* derecha: lo conectado */}
          <div className="grid grid-cols-2 gap-3">
            {despues.map((g, i) => (
              <motion.div
                key={g.title}
                animate={{
                  opacity: conectado ? 1 : 0.35,
                  scale: conectado ? 1 : 0.94,
                  filter: conectado ? 'blur(0px)' : 'blur(1.5px)',
                }}
                transition={{ delay: conectado ? 0.15 + i * 0.08 : 0 }}
                className="rounded-2xl border border-tori-200 bg-white p-5 shadow-md shadow-tori-600/10"
              >
                <g.icon size={24} className="text-tori-600" />
                <p className="mt-3 font-black text-tori-900">{g.title}</p>
                <p className="mt-1 text-xs text-slate-500">{g.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <Reveal delay={0.1} className="mt-14 text-center">
          <p className="text-xl font-black text-tori-900 sm:text-2xl">El resultado no es trabajar más.</p>
          <p className="mt-2 text-lg text-slate-500">Es tener claridad para dedicar más tiempo a vender.</p>
        </Reveal>
      </div>
    </section>
  )
}

/** Cable que se "enciende" cuando todo está conectado. */
function Conector({ activo }: { activo: boolean }) {
  return (
    <div className="relative hidden h-0.5 overflow-hidden rounded-full bg-slate-200 lg:block">
      <motion.div
        className="absolute inset-y-0 left-0 bg-tori-500"
        animate={{ width: activo ? '100%' : '0%' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {activo && (
        <motion.span
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-tori-600 shadow-[0_0_8px_2px_rgba(8,123,192,0.6)]"
          initial={{ left: '0%' }}
          animate={{ left: '100%' }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  )
}
