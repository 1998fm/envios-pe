'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const beneficios = [
  'Pedidos y envíos organizados.',
  'Ventas e inventario relacionados.',
  'Dinero disponible visible.',
  'Menos tareas repetitivas.',
]

const pedidos = [
  { name: 'María · Lima', badge: 'Pendiente', badgeClass: 'bg-amber-400/10 text-amber-300' },
  { name: 'Andrea · Callao', badge: 'Listo', badgeClass: 'bg-emerald-400/10 text-emerald-300' },
  { name: 'Sofía · Surco', badge: 'Envío', badgeClass: 'bg-tori-400/10 text-tori-300' },
]

export default function DashboardDemo() {
  return (
    <section className="py-20 sm:py-28 bg-slate-950 text-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="text-xs uppercase tracking-[.18em] font-black text-tori-300">Una sola vista</span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight">
              De &ldquo;¿dónde estaba?&rdquo; a{' '}
              <span className="gradient-text">&ldquo;ya sé qué tengo que hacer&rdquo;.</span>
            </h2>
            <p className="mt-5 text-slate-300 text-lg leading-relaxed">
              Tori reúne la información que necesitas para gestionar tu día sin estar saltando entre chats, hojas y
              notas.
            </p>
            <div className="mt-7 space-y-3">
              {beneficios.map((b) => (
                <div key={b} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-tori-400/15 text-tori-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} />
                  </span>
                  <span className="text-slate-200">{b}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex justify-between">
                <span className="font-bold">Panel de control</span>
                <span className="text-xs text-emerald-300 bg-emerald-400/10 rounded-full px-2.5 py-1">
                  Todo en orden
                </span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-800 p-4">
                    <p className="text-xs text-slate-400">Ventas</p>
                    <p className="text-2xl font-black mt-1">S/ 1,248</p>
                  </div>
                  <div className="rounded-2xl bg-slate-800 p-4">
                    <p className="text-xs text-slate-400">Disponible</p>
                    <p className="text-2xl font-black mt-1">S/ 764</p>
                  </div>
                  <div className="rounded-2xl bg-slate-800 p-4">
                    <p className="text-xs text-slate-400">Pedidos</p>
                    <p className="text-2xl font-black mt-1">32</p>
                  </div>
                  <div className="rounded-2xl bg-slate-800 p-4">
                    <p className="text-xs text-slate-400">Productos</p>
                    <p className="text-2xl font-black mt-1">286</p>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-slate-800 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold">Pedidos por preparar</span>
                    <span className="text-tori-300 font-bold">8</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {pedidos.map((p) => (
                      <div key={p.name} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{p.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${p.badgeClass}`}>{p.badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
