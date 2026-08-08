'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'

function VisualPedidos() {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
      <div className="flex justify-between items-center">
        <p className="font-black">Nuevo pedido</p>
        <span className="text-xs text-emerald-600 font-bold">Datos completos</span>
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-11 rounded-xl bg-slate-50 border border-slate-100 px-3 flex items-center text-sm text-slate-500">
          Nombre: María López
        </div>
        <div className="h-11 rounded-xl bg-slate-50 border border-slate-100 px-3 flex items-center text-sm text-slate-500">
          Dirección: Av. Siempre Viva 123
        </div>
        <div className="h-11 rounded-xl bg-slate-50 border border-slate-100 px-3 flex items-center text-sm text-slate-500">
          Courier: Shalom
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <span className="rounded-xl bg-tori-600 text-white px-4 py-2 text-sm font-bold">Preparar envío</span>
      </div>
    </div>
  )
}

function VisualDinero() {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
      <p className="text-sm font-bold text-slate-500">Dinero disponible</p>
      <p className="text-4xl font-black mt-2">S/ 764.00</p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-[10px] text-emerald-700">Ventas</p>
          <p className="font-black mt-1">S/ 1,248</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] text-slate-500">Gastos</p>
          <p className="font-black mt-1">S/ 284</p>
        </div>
        <div className="rounded-xl bg-tori-50 p-3">
          <p className="text-[10px] text-tori-700">Cobros</p>
          <p className="font-black mt-1">12</p>
        </div>
      </div>
      <div className="mt-5 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="w-[76%] h-full bg-emerald-500 rounded-full" />
      </div>
    </div>
  )
}

function VisualInventario() {
  const items = [
    { name: 'Vestido Luna', qty: '24', bar: 'w-[80%]', barClass: 'bg-emerald-400', qtyClass: 'text-emerald-600' },
    { name: 'Polo Basic', qty: '7', bar: 'w-[28%]', barClass: 'bg-amber-400', qtyClass: 'text-amber-600' },
    { name: 'Jean Wide', qty: '18', bar: 'w-[60%]', barClass: 'bg-tori-400', qtyClass: 'text-tori-600' },
  ]
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
      <div className="flex justify-between items-center">
        <p className="font-black">Inventario</p>
        <span className="text-xs text-slate-400">286 unidades</span>
      </div>
      <div className="mt-5 space-y-4">
        {items.map((p) => (
          <div key={p.name}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">{p.name}</span>
              <span className={`text-sm font-black ${p.qtyClass}`}>{p.qty}</span>
            </div>
            <div className="mt-1.5 h-2 bg-slate-100 rounded-full">
              <div className={`h-full rounded-full ${p.bar} ${p.barClass}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const soluciones = [
  {
    badge: 'PEDIDOS + ENVÍOS',
    badgeClass: 'bg-tori-50 text-tori-700',
    title: 'Tus pedidos dejan de estar perdidos.',
    text: 'Tu cliente coloca sus datos una vez. Tori recibe la información organizada para que preparar y gestionar tus envíos sea mucho más sencillo.',
    chips: ['Formulario', 'Direcciones', 'Courier'],
    Visual: VisualPedidos,
  },
  {
    badge: 'VENTAS + DINERO',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    title: 'Deja de hacer cuentas para saber cómo va el negocio.',
    text: 'Ten una visión más clara de tus ventas, cobros, gastos y dinero disponible para tomar decisiones sin depender de varias hojas.',
    chips: ['Ventas', 'Cobros', 'Dinero'],
    Visual: VisualDinero,
  },
  {
    badge: 'INVENTARIO + PRODUCTOS',
    badgeClass: 'bg-violet-50 text-violet-700',
    title: 'Sabes qué tienes antes de prometer lo que no tienes.',
    text: 'Relaciona tus ventas con tus productos para tener una visión más clara de lo que queda disponible.',
    chips: ['Stock', 'Productos', 'Ventas'],
    Visual: VisualInventario,
  },
]

export default function FeaturesSection() {
  return (
    <section id="funciones" className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <span className="text-xs uppercase tracking-[.18em] font-black text-tori-600">Tres grandes soluciones</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight">
            No te mostramos siete funciones.{' '}
            <span className="gradient-text">Te mostramos tres cambios en tu día.</span>
          </h2>
          <p className="mt-5 text-lg text-slate-600">Cada bloque responde a un problema real de un emprendedor.</p>
        </motion.div>

        <div className="mt-12 space-y-5">
          {soluciones.map((s, i) => {
            const invertido = i % 2 === 1
            return (
              <motion.article
                key={s.badge}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="rounded-3xl border border-slate-200 overflow-hidden bg-slate-50 grid lg:grid-cols-2"
              >
                <div className={`p-7 sm:p-10 flex flex-col justify-center ${invertido ? 'lg:order-2' : ''}`}>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${s.badgeClass}`}>{s.badge}</span>
                  <h3 className="mt-4 text-3xl font-black text-slate-900">{s.title}</h3>
                  <p className="mt-4 text-slate-600 leading-relaxed">{s.text}</p>
                  <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                    {s.chips.map((c) => (
                      <span key={c} className="bg-white border border-slate-200 rounded-full px-3 py-2">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={`p-5 sm:p-8 flex items-center ${invertido ? 'lg:order-1' : ''}`}>
                  <s.Visual />
                </div>
              </motion.article>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-12 text-center"
        >
          <p className="text-lg text-slate-600">
            ¿Quieres ver todas las soluciones que Tori ya tiene?
          </p>
          <a
            href="#precios"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-tori-600 hover:bg-tori-700 text-white px-6 py-3.5 font-extrabold shadow-xl shadow-tori-600/20 transition"
          >
            Probar Tori gratis
            <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
