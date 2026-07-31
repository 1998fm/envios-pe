'use client'

import { motion } from 'framer-motion'
import {
  Truck,
  Smartphone,
  Settings,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Boxes,
  ShoppingCart,
  Warehouse,
  Menu,
  X,
  Plus,
  Minus,
  MapPin,
  ClipboardList,
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
    title: 'Envíos ordenados',
    desc: 'Estados, etiquetas, exportación Shalom y copia de datos. Sabes qué va hoy y qué ya salió.',
  },
  {
    icon: Boxes,
    title: 'Inventario y stock',
    desc: 'Registra tus productos, controla existencias y recibe alertas cuando algo se está acabando.',
  },
  {
    icon: ShoppingCart,
    title: 'Ventas con pago',
    desc: 'Efectivo, Yape/Plin o tarjeta. Las ventas pendientes quedan marcadas hasta confirmar el pago.',
  },
  {
    icon: Warehouse,
    title: 'Compras a proveedores',
    desc: 'Lleva el registro de lo que compras y cuánto inviertes. Tu negocio completo en un solo lugar.',
  },
  {
    icon: MapPin,
    title: 'Logística inteligente',
    desc: 'Horarios de corte, cupo diario, días de atención y tarifas por distrito calculadas automáticamente.',
  },
  {
    icon: Smartphone,
    title: 'Formulario con tu marca',
    desc: 'Tus clientes ven tu logo y tus colores. Piden sin registrarse, sin bajar apps, sin fricción.',
  },
]

const steps = [
  {
    step: '01',
    icon: Settings,
    title: 'Configura tu negocio',
    desc: 'Sube tu logo, activa tus métodos de envío y define tus tarifas por distrito.',
  },
  {
    step: '02',
    icon: Smartphone,
    title: 'Comparte tu link',
    desc: 'Recibe un link personalizado y compártelo por WhatsApp, redes o tu web.',
  },
  {
    step: '03',
    icon: ClipboardList,
    title: 'Gestiona todo',
    desc: 'Pedidos, stock, ventas y compras en un dashboard. Filtra, exporta y despacha.',
  },
]

const testimonials = [
  {
    initials: 'CR',
    gradient: 'from-sky-500 to-cyan-500',
    quote: 'Antes tenía direcciones en 4 chats distintos y siempre se me escapaba algún pedido. Con Tori todo me llega ordenado, solo abro el dashboard y sé qué va hoy.',
    name: 'Camila Rivas',
    role: 'Repostera — @dulces.cami',
  },
  {
    initials: 'JM',
    gradient: 'from-indigo-500 to-purple-500',
    quote: 'Usaba Excel para mis envíos y siempre terminaba borrando algo por accidente. Ahora mis clientes llenan su pedido solos y yo solo reviso y despacho. Me cambió la vida.',
    name: 'Jorge Manrique',
    role: 'Boutique de ropa — Lima',
  },
  {
    initials: 'AP',
    gradient: 'from-emerald-500 to-teal-500',
    quote: 'Tenía miedo de crecer porque no daba abasto con los pedidos. Tori me permitió duplicar mis ventas sin volverme loco. El formulario público es un golazo.',
    name: 'Andrea Paz',
    role: 'Distribuidora de abarrotes — Ate',
  },
]

const faqs = [
  {
    q: '¿Necesito que mis clientes se registren para pedir?',
    a: 'No. Tus clientes llenan tu formulario público sin crear cuenta, sin bajar ninguna app. Solo entran al link, completan sus datos y ya está.',
  },
  {
    q: '¿Puedo usar mis propios métodos de envío?',
    a: 'Sí. Activa motorizado, Shalom, Olva, cualquier agencia o agrega un método personalizado con el nombre que quieras. También puedes ofrecer recojo en tienda.',
  },
  {
    q: '¿Cómo registro los pagos de mis ventas?',
    a: 'Efectivo y Yape/Plin se registran como pagadas al momento. Con tarjeta la venta queda pendiente hasta que confirmes que el pago llegó.',
  },
  {
    q: '¿El trial es gratis y sin tarjeta?',
    a: 'Sí. Recibes 30 días del plan Pro completo sin ingresar tarjeta y sin ningún compromiso.',
  },
  {
    q: '¿Qué pasa cuando termina el trial?',
    a: 'Bajas al plan Básico, que es gratis para siempre: formulario público, 50 envíos al mes y el control esencial de tu negocio.',
  },
  {
    q: '¿Controlo el stock y las compras?',
    a: 'Sí. Registras productos, ves el stock en tiempo real, recibes alertas de stock mínimo y llevas tus compras a proveedores desde el mismo sistema.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Cada negocio tiene su información aislada. Solo tú accedes a tus pedidos, ventas y clientes.',
  },
  {
    q: '¿Puedo cancelar o cambiar de plan?',
    a: 'Cuando quieras y sin penalidades. Cambia de plan, cancela o vuelve al Básico gratis desde tu cuenta.',
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
        Crear cuenta
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
                Crear cuenta
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
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold mb-5">
                <BarChart3 size={13} />
                Envíos, stock y ventas en un solo lugar
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
                Vende, controla tu stock y{' '}
                <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  envía sin caos.
                </span>
              </h1>
              <p className="mt-5 text-base sm:text-xl text-slate-600 leading-relaxed max-w-lg">
                Tori reúne tus pedidos, inventario, ventas y compras en un dashboard simple. 
                Tus clientes piden por tu formulario y todo aparece ordenado para que tú solo despaches.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
                >
                  Crear cuenta gratis
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
                  30 días Pro gratis
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

            {/* Mockup simplificado */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              className="relative"
            >
              <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hoy · Resumen</p>
                    <p className="text-lg font-extrabold text-slate-900">12 pedidos activos</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100" />
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[
                    { initial: 'M', name: 'María García', sub: 'Motorizado · Hoy', badge: 'Enviado', badgeClass: 'bg-emerald-100 text-emerald-700' },
                    { initial: 'C', name: 'Carlos López', sub: 'Shalom · Mañana', badge: 'Empacado', badgeClass: 'bg-amber-100 text-amber-700' },
                    { initial: 'A', name: 'Ana Torres', sub: 'Recojo · Hoy', badge: 'Listo', badgeClass: 'bg-sky-100 text-sky-700' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {item.initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400 truncate">{item.sub}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Stock bajo', value: '3', color: 'text-amber-600' },
                    { label: 'Ventas hoy', value: 'S/ 480', color: 'text-emerald-600' },
                    { label: 'Compras mes', value: 'S/ 1,250', color: 'text-sky-600' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                      <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ MÉTRICAS ============ */}
      <section className="py-10 sm:py-14 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '+200', label: 'negocios registrados' },
              { number: '30s', label: 'en crear un pedido' },
              { number: '+40%', label: 'menos reclamos' },
              { number: '3min', label: 'en configurar' },
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
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Comienza en{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                3 pasos
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Configura tu negocio, comparte tu link y empieza a gestionar todo desde un solo lugar.
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
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Todo tu negocio en{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                un solo sistema
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              No solo envíos. Controla ventas, stock y compras sin cambiar de herramienta.
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

      {/* ============ TESTIMONIOS ============ */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Lo que dicen los{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                negocios
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
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8"
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
      <section id="planes" className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Planes{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                simples y claros
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              30 días Pro gratis, sin tarjeta, sin compromiso. Después decide si sigues.
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
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">Gratis</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Después del trial, para siempre</p>
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
              <div className="mt-3">
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
                Empezar prueba gratis
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Preguntas{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                frecuentes
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Las dudas que nos preguntan antes de empezar.
            </p>
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
                Organiza tu negocio hoy
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-xl text-sky-100 max-w-lg mx-auto">
                Crea tu cuenta en 30 segundos. Sin tarjeta, sin compromiso.
                Prueba todo lo que Tori puede hacer por tu negocio.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 mt-6 sm:mt-8 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm font-semibold bg-white text-sky-700 hover:bg-sky-50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
              >
                Empezar prueba gratis
                <ArrowRight size={16} />
              </Link>
              <p className="mt-3 text-xs text-sky-200/70">Sin tarjeta · Cancela cuando quieras · 30 días Pro completo</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            <LogoTori size={22} />
            Tori — tu sistema todo-en-uno
          </div>
          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} Tori — Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
              Crear cuenta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
