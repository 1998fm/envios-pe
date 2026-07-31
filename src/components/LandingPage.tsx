'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Menu,
  Minus,
  Package,
  Plus,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  Truck,
  Warehouse,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import LogoTori from '@/components/LogoTori'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' },
} as const

const features = [
  {
    icon: Truck,
    title: 'Recibe pedidos ordenados',
    desc: 'Tus clientes llenan sus datos y eligen su envío. Todo llega a un solo lugar, sin desorden ni mensajes perdidos.',
  },
  {
    icon: Boxes,
    title: 'Controla tu stock',
    desc: 'Registra tus productos y Tori te avisa cuando algo se está por acabar. Nunca más te quedas sin inventario.',
  },
  {
    icon: ShoppingCart,
    title: 'Lleva tus ventas y cobros',
    desc: 'Efectivo, Yape/Plin o tarjeta. Si un pago falta, te queda marcado para que no se te olvide.',
  },
  {
    icon: Warehouse,
    title: 'Registra compras y gastos',
    desc: 'Proveedores, materiales, pasajes y delivery. Sabes cuánto entra y cuánto sale de tu negocio.',
  },
  {
    icon: MapPin,
    title: 'Define tu reparto',
    desc: 'Precios por distrito, horarios de corte y cupo diario. Tori calcula por ti, sin hacer cuentas a mano.',
  },
  {
    icon: Smartphone,
    title: 'Formulario con tu marca',
    desc: 'Tus clientes ven tu logo y tus colores. Piden desde el celular, sin registrarse y sin bajar apps.',
  },
]

const steps = [
  {
    step: '01',
    icon: Settings,
    title: 'Crea tu cuenta',
    desc: 'Ponle tu nombre y tu logo a tu negocio. Todo listo en menos de 5 minutos.',
  },
  {
    step: '02',
    icon: Smartphone,
    title: 'Comparte tu link',
    desc: 'Tu formulario de pedidos, listo para WhatsApp, Instagram o tu web.',
  },
  {
    step: '03',
    icon: ClipboardList,
    title: 'Recibe y despacha',
    desc: 'Cada pedido llega ordenado a tu panel. Tú solo revisas y despachas.',
  },
]

const testimonials = [
  {
    initials: 'CR',
    gradient: 'from-sky-500 to-cyan-500',
    quote: 'Tenía un WhatsApp lleno de pedidos y direcciones. Ahora cada cliente llena su pedido en mi formulario y yo solo reviso qué despachar.',
    name: 'Camila Rivas',
    role: 'Repostería — Lima',
  },
  {
    initials: 'JM',
    gradient: 'from-indigo-500 to-purple-500',
    quote: 'Antes usaba Excel y siempre se me escapaba algo. Ahora pedidos, stock y ventas están en un solo lugar y nada se pierde.',
    name: 'Jorge Manrique',
    role: 'Boutique de ropa — Lima',
  },
  {
    initials: 'AP',
    gradient: 'from-emerald-500 to-teal-500',
    quote: 'El formulario con mi marca hizo que pedir sea facilísimo. Mis ventas crecieron y ya no se me escapa ningún pedido.',
    name: 'Andrea Paz',
    role: 'Distribuidora — Ate',
  },
]

const faqs = [
  {
    q: '¿Mis clientes necesitan registrarse para pedir?',
    a: 'No. Solo entran a tu link, llenan sus datos y listo. Sin cuenta, sin apps, sin complicaciones.',
  },
  {
    q: '¿Puedo usar mis propios métodos de envío?',
    a: 'Sí. Motorizado, Shalom, Olva, una agencia o el método que tú quieras. También puedes ofrecer recojo en tienda.',
  },
  {
    q: '¿Cómo cobro a mis clientes?',
    a: 'Puedes cobrar en efectivo, Yape/Plin o tarjeta. Si un pago falta, queda marcado para que no se te olvide.',
  },
  {
    q: '¿Probar Tori cuesta algo?',
    a: 'No. Son 30 días gratis del plan Pro completo, sin registrar tarjeta ni compromiso.',
  },
  {
    q: '¿Qué pasa cuando termina la prueba?',
    a: 'Te quedas con el plan Básico gratis para siempre: tu formulario, tus pedidos y hasta 50 envíos al mes.',
  },
  {
    q: '¿Puedo controlar el stock de mis productos?',
    a: 'Sí. Registra tus productos y Tori te avisa cuando queda poco. Así nunca te quedas sin inventario.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Tu información está separada de la de otros negocios y solo tú puedes verla.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Claro. Cambia o cancela tu plan cuando quieras, sin multas ni letra pequeña.',
  },
]

function FAQItem({ faq, open, onToggle }: { faq: (typeof faqs)[number]; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-slate-100">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-800 sm:text-base">{faq.q}</span>
        <span className={`shrink-0 text-sky-600 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          {open ? <Minus size={18} /> : <Plus size={18} />}
        </span>
      </button>
      {open && (
        <p className="pb-4 pr-8 text-sm leading-relaxed text-slate-500">{faq.a}</p>
      )}
    </div>
  )
}

const bars = [38, 62, 45, 78, 52, 88, 70, 96, 64, 82]

const stockCritico = [
  { name: 'Caja kraft M', qty: '18 / 40', pct: 45, color: 'bg-amber-500' },
  { name: 'Cinta adhesiva', qty: '6 / 40', pct: 15, color: 'bg-red-500' },
  { name: 'Etiquetas Tori', qty: '33 / 50', pct: 66, color: 'bg-sky-500' },
]

const metodosForm = [
  { icon: Truck, label: 'Motorizado', active: true },
  { icon: Package, label: 'Shalom', active: false },
  { icon: Store, label: 'Recojo', active: false },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0)

  const nav = (
    <nav className="flex items-center gap-5 sm:gap-8">
      <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
        Iniciar sesión
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
      >
        Comenzar gratis
        <ArrowRight size={15} />
      </Link>
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoTori size={40} />
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              Tori
            </span>
          </Link>

          <div className="hidden sm:block">{nav}</div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sm:hidden px-4 pb-4 border-b border-slate-100 bg-white"
          >
            <div className="flex flex-col gap-3">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-slate-600 py-2">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white"
              >
                Comenzar gratis
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* ============ HERO ============ */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-100/60 via-transparent to-indigo-100/30 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-sky-200 text-sky-700 text-xs font-semibold mb-6">
                <BarChart3 size={13} />
                Pensado para emprendedores
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
                Organiza tus pedidos{' '}
                <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  en un solo lugar.
                </span>
              </h1>
              <p className="mt-5 text-base sm:text-xl text-slate-600 leading-relaxed max-w-lg">
                Tus clientes piden desde un formulario con tu logo. Tú ves todos los pedidos
                juntos en un panel simple: qué falta despachar, qué cobrar y qué comprar.
                Sin Excel, sin chats perdidos.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
                >
                  Comenzar gratis
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:border-sky-500 hover:text-sky-700 transition-all duration-200"
                >
                  Ver cómo funciona
                </a>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  30 días gratis
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  Sin tarjeta
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  Cancela cuando quieras
                </span>
              </div>
            </motion.div>

            {/* Mockup del formulario (lo que ve tu cliente) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              className="relative"
            >
              <div className="absolute -top-8 -right-6 hidden md:block w-60 h-60 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-full blur-3xl opacity-70" />

              <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">
                {/* Barra de navegador */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="ml-3 hidden sm:block flex-1 max-w-xs text-center text-[10px] font-medium text-slate-400 bg-slate-50 rounded-lg px-3 py-1 truncate">
                    dulcesdemaria.pe/pedido
                  </span>
                </div>

                <div className="p-4 sm:p-6">
                  {/* Header del formulario */}
                  <div className="flex items-center gap-3 mb-5">
                    <LogoTori size={40} />
                    <div>
                      <p className="text-base font-extrabold text-slate-900">Dulces de María</p>
                      <p className="text-[11px] text-slate-400">Haz tu pedido en 1 minuto</p>
                    </div>
                  </div>

                  {/* Datos del cliente */}
                  <div className="rounded-xl border border-slate-100 p-3.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tus datos</p>
                    <div className="mt-2.5 space-y-2">
                      <div className="h-2.5 w-full rounded-full bg-slate-100" />
                      <div className="h-2.5 w-2/3 rounded-full bg-slate-100" />
                      <div className="h-2.5 w-1/2 rounded-full bg-slate-100" />
                    </div>
                  </div>

                  {/* Métodos de envío */}
                  <div className="mt-3.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">¿Cómo lo recibes?</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {metodosForm.map((m, i) => (
                        <div
                          key={i}
                          className={`rounded-xl p-2.5 text-center ${
                            m.active
                              ? 'border-2 border-sky-500 bg-sky-50'
                              : 'border border-slate-100 bg-white'
                          }`}
                        >
                          <m.icon size={15} className={`mx-auto ${m.active ? 'text-sky-600' : 'text-slate-400'}`} />
                          <p className={`text-[9px] font-bold mt-1 ${m.active ? 'text-sky-700' : 'text-slate-500'}`}>
                            {m.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tarifa */}
                  <div className="mt-3.5 flex items-center justify-between rounded-xl border border-slate-100 p-3.5">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Distrito: Miraflores</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">Envío S/ 8.00</p>
                    </div>
                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    </span>
                  </div>

                  {/* Botón */}
                  <div className="mt-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-center py-3 text-sm font-bold shadow-lg shadow-sky-500/20">
                    Confirmar pedido
                  </div>
                </div>
              </div>

              {/* Notificación flotante: pedido recibido */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="hidden md:flex absolute -bottom-6 -left-8 items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 px-4 py-3"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Check size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Nuevo pedido</p>
                  <p className="text-[10px] text-slate-400">María García · Motorizado · hace 1 min</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ MÉTRICAS ============ */}
      <section className="py-10 sm:py-14 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '1', label: 'sola app para todo tu negocio' },
              { number: '+200', label: 'emprendedores ya lo usan' },
              { number: '5 min', label: 'para empezar a vender' },
              { number: '0', label: 'pedidos perdidos en chats' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">{item.number}</div>
                <div className="mt-1 text-xs sm:text-sm text-slate-500">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CÓMO FUNCIONA ============ */}
      <section id="como-funciona" className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Cómo funciona</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Empieza en{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                3 pasos
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              No necesitas saber de tecnología ni de sistemas. Solo seguir estos pasos.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
                className="relative bg-white border border-slate-200 rounded-2xl p-6 sm:p-8"
              >
                <span className="text-5xl sm:text-6xl font-black text-sky-100 leading-none">{item.step}</span>
                <div className="mt-2 w-12 h-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" />
                <item.icon size={24} className="mt-5 text-sky-600" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FUNCIONES CLAVE ============ */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Funcionalidades</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Todo lo que tu negocio{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                necesita
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Simple de usar, pensado para quienes recién empiezan y para los que ya crecieron.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 hover:border-sky-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                  <item.icon size={20} className="text-sky-600" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PANEL DE RESUMEN ============ */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div {...fadeUp}>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Panel de resumen</p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Ves todo claro en{' '}
                <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  un solo panel
                </span>
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  'Cuánto vendes, cuánto gastas y tu saldo, de un vistazo.',
                  'Pedidos por despachar y productos con stock bajo, marcados para que no se te olviden.',
                  'Todo tu historial de pedidos, ventas y compras siempre a la mano.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-sky-600" />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -top-6 -left-6 hidden md:block w-52 h-52 bg-gradient-to-br from-indigo-100 to-sky-100 rounded-full blur-3xl opacity-70" />
              <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resumen de la semana</p>
                    <p className="text-lg font-extrabold text-slate-900">Ventas · S/ 3,280</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500">
                    Exportar
                  </div>
                </div>

                <div className="flex items-end gap-2 sm:gap-3 h-32">
                  {bars.map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-sky-600 to-indigo-500 relative" style={{ height: `${h}%` }}>
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 hidden sm:block text-[9px] font-semibold text-slate-400">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'][i % 7]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Stock bajo</p>
                  <div className="space-y-3">
                    {stockCritico.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-xs font-semibold text-slate-700 truncate">{s.name}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="w-10 shrink-0 text-right text-[10px] font-semibold text-slate-400">{s.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIOS ============ */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Testimonios</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Historias de{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                emprendedores
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-base shadow-sm`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PLANES ============ */}
      <section id="planes" className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Precios</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Planes{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                simples y claros
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              30 días gratis. Después, tú decides si sigues.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
            >
              <h3 className="text-lg font-bold text-slate-900">Básico</h3>
              <p className="mt-1 text-sm text-slate-500">Para empezar a ordenarte</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">Gratis</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Para siempre, después de la prueba</p>
              <Link
                href="/register"
                className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border border-slate-200 text-slate-700 hover:border-sky-500 hover:text-sky-700 transition-all duration-200"
              >
                Probar Pro gratis
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative rounded-2xl border-2 border-sky-500 bg-white p-6 sm:p-8 shadow-xl shadow-sky-500/10"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider">
                Más popular
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">Pro</h3>
              <p className="mt-1 text-sm text-slate-500">Para negocios en crecimiento</p>
              <div className="mt-4">
                <p className="text-sm line-through text-slate-400 mb-1">S/ 39.90</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-slate-900">S/ 29.90</span>
                  <span className="text-sm text-slate-500 font-medium">/mes</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">30 días gratis, luego S/ 29.90/mes</p>
              <Link
                href="/register"
                className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
              >
                Comenzar prueba gratis
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="py-14 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Preguntas</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Dudas{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                frecuentes
              </span>
            </h2>
          </motion.div>

          <motion.div {...fadeUp} className="bg-white rounded-2xl border border-slate-200 px-5 sm:px-8">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                open={faqAbierta === i}
                onToggle={() => setFaqAbierta(faqAbierta === i ? null : i)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-sky-600 via-sky-600 to-indigo-700 px-5 sm:px-12 py-10 sm:py-16 text-center text-white"
          >
            <div className="relative">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Empieza a ordenar tu negocio hoy
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-xl text-sky-100 max-w-lg mx-auto">
                Crea tu cuenta, comparte tu link y recibe tu primer pedido
                organizado en minutos. Sin tarjeta, sin complicaciones.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 mt-6 sm:mt-8 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm font-semibold bg-white text-sky-700 hover:bg-sky-50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
              >
                Comenzar gratis
                <ArrowRight size={16} />
              </Link>
              <p className="mt-3 text-xs text-sky-200/70">30 días de prueba · Sin tarjeta · Cancela cuando quieras</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            <LogoTori size={22} />
            Tori — organiza los pedidos de tu emprendimiento
          </div>
          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} Tori — Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
