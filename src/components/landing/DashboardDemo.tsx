'use client'

import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  ChevronRight,
  Hourglass,
  Package,
  PackageOpen,
  TrendingUp,
} from 'lucide-react'
import LogoTori from '@/components/LogoTori'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' },
} as const

const kpis = [
  { label: 'Ventas del mes', value: 'S/ 12,340', icon: TrendingUp, iconClass: 'bg-sky-100 text-sky-600' },
  { label: 'Ventas hoy', value: 'S/ 485', icon: Banknote, iconClass: 'bg-emerald-100 text-emerald-600' },
  { label: 'Por despachar', value: '8', icon: Package, iconClass: 'bg-amber-100 text-amber-600' },
  { label: 'Envíos del mes', value: '96', icon: PackageOpen, iconClass: 'bg-purple-100 text-purple-600' },
  { label: 'Stock bajo', value: '3', icon: AlertTriangle, iconClass: 'bg-red-100 text-red-600' },
]

const pendientes = [
  { n: '2', label: 'sin empacar', icon: Boxes, cls: 'bg-red-100 text-red-600' },
  { n: '6', label: 'por enviar', icon: Package, cls: 'bg-amber-100 text-amber-600' },
  { n: 'S/ 320', label: 'por cobrar', icon: Hourglass, cls: 'bg-indigo-100 text-indigo-600' },
  { n: '3', label: 'bajo stock', icon: AlertTriangle, cls: 'bg-orange-100 text-orange-600' },
]

const pedidosRecientes = [
  { name: 'María García', sub: 'Cesta de regalo · Motorizado', badge: 'Enviado', badgeClass: 'bg-emerald-100 text-emerald-700' },
  { name: 'Carlos López', sub: 'Box de brownies · Shalom', badge: 'Por despachar', badgeClass: 'bg-amber-100 text-amber-700' },
  { name: 'Ana Torres', sub: 'Polos x3 · Recojo', badge: 'Pago confirmado', badgeClass: 'bg-sky-100 text-sky-700' },
]

const puntos = [
  {
    num: '1',
    label: 'Dinero',
    desc: 'Tu saldo disponible siempre a la vista.',
    className: '-top-5 -left-5 lg:-top-6 lg:-left-8',
  },
  {
    num: '2',
    label: 'Ventas',
    desc: 'Cuánto vendiste hoy y en el mes.',
    className: '-top-5 -right-5 lg:-top-6 lg:-right-8',
  },
  {
    num: '3',
    label: 'Envíos',
    desc: 'Lo que va a salir y lo que ya salió.',
    className: 'top-1/2 -right-5 lg:-right-10 -translate-y-1/2',
  },
  {
    num: '4',
    label: 'Pedidos',
    desc: 'Cada pedido llega ordenado, sin buscarlo.',
    className: '-bottom-5 -left-5 lg:-bottom-7 lg:-left-8',
  },
  {
    num: '5',
    label: 'Inventario',
    desc: 'Lo que te falta por reabastecer.',
    className: '-bottom-5 -right-5 lg:-bottom-7 lg:-right-8',
  },
]

export default function DashboardDemo() {
  return (
    <section id="mira-tori" className="py-14 sm:py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Mira cómo funciona Tori</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Así se ve tu negocio{' '}
            <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              dentro de Tori.
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Pedidos, inventario, ventas, dinero y envíos. Todo en un solo lugar.
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-full blur-3xl opacity-70 pointer-events-none" />

          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">
            {/* Chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="ml-3 hidden sm:block flex-1 max-w-xs text-center text-[10px] font-medium text-slate-400 bg-slate-50 rounded-lg px-3 py-1 truncate">
                app.tori.pe/dashboard
              </span>
            </div>

            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LogoTori size={24} />
                  <span className="text-sm font-extrabold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    Tori
                  </span>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-[10px] font-bold">
                  + Nuevo
                </span>
              </div>

              {/* Saldo disponible */}
              <div className="rounded-2xl bg-gradient-to-r from-sky-600 via-sky-600 to-indigo-700 p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Saldo disponible</p>
                  <p className="text-2xl sm:text-3xl font-extrabold mt-0.5 leading-none">S/ 4,860.50</p>
                  <p className="text-[10px] text-white/70 mt-1">Ventas − Compras − Gastos</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">Ventas</p>
                    <p className="text-sm font-extrabold mt-0.5">S/ 12,340</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">Compras</p>
                    <p className="text-sm font-extrabold mt-0.5">S/ 5,200</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">Gastos</p>
                    <p className="text-sm font-extrabold mt-0.5">S/ 2,279.50</p>
                  </div>
                </div>
              </div>

              {/* KPIs */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                {kpis.map((k) => (
                  <div key={k.label} className="rounded-xl border border-slate-100 bg-white p-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${k.iconClass}`}>
                      <k.icon size={14} />
                    </div>
                    <p className="mt-2 text-sm font-extrabold text-slate-900 leading-none">{k.value}</p>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Pendiente de acción */}
              <div className="mt-3 rounded-xl border border-slate-100 p-3.5">
                <p className="text-xs font-bold text-slate-900">Pendiente de acción</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Lo que necesita tu atención hoy.</p>
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {pendientes.map((p) => (
                    <div key={p.label} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.cls}`}>
                        <p.icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-slate-900 leading-none">{p.n}</p>
                        <p className="text-[9px] text-slate-500 truncate">{p.label}</p>
                      </div>
                      <ChevronRight size={12} className="ml-auto text-slate-300 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Últimos pedidos */}
              <div className="mt-3 rounded-xl border border-slate-100 p-3.5">
                <p className="text-xs font-bold text-slate-900">Últimos pedidos</p>
                <div className="mt-2.5 space-y-2">
                  {pedidosRecientes.map((p, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-lg border border-slate-100 p-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[11px] text-slate-900 truncate">{p.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{p.sub}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold whitespace-nowrap ${p.badgeClass}`}>
                        {p.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pins de navegación (desktop) */}
          {puntos.map((p, i) => (
            <motion.div
              key={p.num}
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
              className={`hidden lg:flex absolute items-start gap-2.5 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 px-3.5 py-2.5 ${p.className}`}
            >
              <span className="w-6 h-6 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {p.num}
              </span>
              <div className="max-w-[150px]">
                <p className="text-xs font-bold text-slate-900 leading-none">{p.label}</p>
                <p className="mt-1 text-[10px] text-slate-500 leading-tight">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Leyenda móvil */}
        <motion.div {...fadeUp} className="mt-8 lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {puntos.map((p) => (
            <div key={p.num} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
              <span className="w-6 h-6 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {p.num}
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-none">{p.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-500 leading-tight">{p.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div {...fadeUp} className="mt-8 sm:mt-10 text-center">
          <a
            href="#funciones"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:border-sky-500 hover:text-sky-700 transition-all duration-200"
          >
            Ver qué puede hacer Tori por ti
            <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
