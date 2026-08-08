'use client'

import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ClipboardList,
  Coins,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import LogoTori from '@/components/LogoTori'
import ToriMascot from '@/components/ToriMascot'
import FeaturesSection from '@/components/landing/FeaturesSection'
import DashboardDemo from '@/components/landing/DashboardDemo'
import TestimonialsSection from '@/components/landing/TestimonialsSection'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' },
} as const

const diagnosticoItems = [
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

const flujoProblema = ['Cliente', 'WhatsApp', 'Pedido', 'Pago', 'Inventario', 'Empaque', 'Envío', 'Seguimiento']

const erroresComunes = ['Pedidos incompletos', 'Cobros olvidados', 'Direcciones copiadas', 'Inventario incierto']

const antesGrid = [
  { icon: MessageCircle, title: 'WhatsApp', sub: 'Conversaciones' },
  { icon: BarChart3, title: 'Excel', sub: 'Hojas y cuentas' },
  { icon: ClipboardList, title: 'Notas', sub: 'Pendientes' },
  { icon: Truck, title: 'Courier', sub: 'Envíos' },
]

const despuesGrid = [
  { icon: ShoppingCart, title: 'Pedidos', sub: 'Más ordenados' },
  { icon: Coins, title: 'Ventas', sub: 'Más claridad' },
  { icon: Package, title: 'Inventario', sub: 'Más control' },
  { icon: Truck, title: 'Envíos', sub: 'Menos copiar' },
]

const pasos = [
  {
    num: '1',
    title: 'Crea tu cuenta',
    desc: 'Empieza tu prueba gratuita y configura tu negocio.',
  },
  {
    num: '2',
    title: 'Organiza tu operación',
    desc: 'Configura tus productos, ventas, inventario y envíos.',
  },
  {
    num: '3',
    title: 'Empieza a trabajar',
    desc: 'Deja que Tori te ayude a mantener todo organizado.',
  },
]

const paraQuienSi = [
  'Vendes principalmente por WhatsApp.',
  'Captas clientes desde TikTok, Instagram o Facebook.',
  'Tienes pedidos constantemente.',
  'Usas Excel, Google Sheets, notas o cuadernos.',
  'Organizar el negocio consume demasiado tiempo.',
  'Quieres vender más sin trabajar cada vez más horas.',
]

const paraQuienNo = [
  'Buscas un ERP empresarial extremadamente complejo.',
  'Quieres una herramienta que haga absolutamente todo.',
  'Tu operación necesita procesos corporativos muy específicos.',
]

const planBasicFeatures = [
  'Hasta 50 envíos al mes',
  'Hasta 2 métodos de envío',
  '50 productos y 100 ventas',
  'Compras y gastos',
  'Etiquetas de envío',
  'Exportar a Shalom (10 al mes)',
]

const planProFeatures = [
  'Envíos, productos y ventas ilimitados',
  'Todos los métodos de envío',
  'Logo, colores y marca blanca',
  'Tarifas por distrito',
  'Hora de corte, anticipación y cupo diario',
  'Redes sociales, URL de redirección y cambio masivo',
]

const faqs = [
  {
    q: '¿Necesito conocimientos técnicos para usar Tori?',
    a: 'No. Tori está diseñado para ser sencillo y guiarte durante el uso.',
  },
  {
    q: '¿Tengo que cambiar la forma en que vendo?',
    a: 'No. Puedes seguir utilizando tus canales habituales, como WhatsApp, TikTok e Instagram.',
  },
  {
    q: '¿Tori reemplaza WhatsApp?',
    a: 'No. Tori organiza la información que genera tu negocio para que puedas gestionarla mejor.',
  },
  {
    q: '¿Tengo que dejar Excel inmediatamente?',
    a: 'No. Puedes comenzar utilizando Tori y hacer la transición a tu propio ritmo.',
  },
  {
    q: '¿Tori es solo para empresas grandes?',
    a: 'No. Tori está pensado para emprendedores que necesitan organizar mejor su negocio a medida que crecen.',
  },
  {
    q: '¿Cuánto cuesta probar Tori?',
    a: 'Puedes probar Tori durante 30 días gratis, sin tarjeta.',
  },
]

const heroStats = [
  { label: 'Ventas', value: 'S/ 1,248', sub: '+12.4%', subClass: 'text-emerald-600' },
  { label: 'Pedidos', value: '32', sub: '8 por enviar', subClass: 'text-tori-600' },
  { label: 'Inventario', value: '286', sub: 'unidades disponibles', subClass: 'text-slate-500' },
  { label: 'Disponible', value: 'S/ 764', sub: 'Claro en segundos', subClass: 'text-emerald-600' },
]

function FAQItem({ faq, open, onToggle }: { faq: (typeof faqs)[number]; open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <button onClick={onToggle} className="w-full cursor-pointer flex justify-between gap-4 text-left">
        <span className="font-black text-slate-900">{faq.q}</span>
        <span className={`text-tori-600 transition-transform duration-200 shrink-0 ${open ? 'rotate-45' : ''}`}>
          {open ? <Minus size={18} /> : <Plus size={18} />}
        </span>
      </button>
      {open && <p className="mt-3 text-slate-500 leading-relaxed">{faq.a}</p>}
    </div>
  )
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0)
  const [showSticky, setShowSticky] = useState(false)
  const [marcados, setMarcados] = useState<number[]>([])

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function toggleMarco(i: number) {
    setMarcados((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
  }

  const navLinks = [
    { label: '¿Te pasa?', href: '#diagnostico' },
    { label: 'Cómo funciona', href: '#solucion' },
    { label: 'Soluciones', href: '#funciones' },
    { label: 'Historias', href: '#historias' },
    { label: 'Precios', href: '#precios' },
  ]

  const count = marcados.length
  const resultadoDiag = count
    ? count <= 2
      ? {
          title: 'Parece que todavía tienes varias cosas bajo control.',
          text: 'Aun así, si tu negocio sigue creciendo, este es un buen momento para ordenar antes de que el volumen te obligue a hacerlo.',
        }
      : count <= 5
        ? {
            title: 'Ya estás sintiendo el costo de trabajar con todo separado.',
            text: 'No significa que seas desordenado. Significa que tu negocio está creciendo y tus herramientas necesitan acompañarlo.',
          }
        : {
            title: 'Tori probablemente fue hecho pensando en un negocio como el tuyo.',
            text: 'Tienes varias señales de que organizar pedidos, ventas, inventario y envíos ya consume demasiado de tu tiempo.',
          }
    : null

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased overflow-x-hidden pb-20 lg:pb-0">
      {/* ============ NAV ============ */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-3">
          <nav className="glass border border-slate-200/70 rounded-2xl shadow-sm px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="#inicio" className="flex items-center gap-2 font-black text-xl text-tori-700">
              <LogoTori size={36} />
              Tori
            </Link>

            <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="hover:text-tori-600 transition-colors">
                  {l.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center justify-center rounded-xl bg-tori-600 hover:bg-tori-700 text-white px-5 py-2.5 font-bold text-sm shadow-lg shadow-tori-600/20 transition"
              >
                Probar Tori
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Menú"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </nav>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden mt-2 glass border border-slate-200/70 rounded-2xl shadow-lg p-3"
            >
              <div className="flex flex-col">
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-sm font-semibold text-slate-700 py-2.5 px-2 hover:text-tori-600"
                  >
                    {l.label}
                  </a>
                ))}
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 flex items-center justify-center rounded-xl bg-tori-600 hover:bg-tori-700 text-white px-5 py-2.5 font-bold text-sm"
                >
                  Probar Tori
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section id="inicio" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28 grid-bg">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-tori-200/50 blur-3xl rounded-full" />
        <div className="absolute top-40 -left-48 w-96 h-96 bg-sky-100 blur-3xl rounded-full" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-tori-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-tori-700 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Para emprendedores que venden por WhatsApp
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.04] text-slate-950">
              Vender por WhatsApp debería darte{' '}
              <span className="gradient-text">más ventas, no más desorden.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-600 max-w-xl">
              Cada venta trae un cliente, un pedido, un pago, un producto y un envío.{' '}
              <strong className="text-slate-800">
                Tori conecta todo para que tú no tengas que recordarlo todo.
              </strong>
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-tori-600 hover:bg-tori-700 text-white px-6 py-3.5 font-extrabold shadow-xl shadow-tori-600/20 transition"
              >
                Quiero ordenar mi negocio
              </Link>
              <a
                href="#diagnostico"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 hover:border-tori-300 hover:text-tori-700 transition"
              >
                Quiero saber si Tori es para mí
              </a>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              {['30 días gratis', 'Sin tarjeta', 'Cancela cuando quieras'].map((b) => (
                <span key={b} className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500" />
                  {b}
                </span>
              ))}
            </div>
          </motion.div>

          {/* HERO PRODUCT MOCKUP */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-gradient-to-br from-tori-200/40 to-sky-100/30 blur-2xl rounded-[3rem]" />
            <div className="relative bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
              <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
                <span className="text-xs font-bold text-slate-400">Tori · Tu negocio</span>
                <LogoTori size={28} />
              </div>
              <div className="p-4 sm:p-6 bg-slate-50/80">
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Resumen de hoy</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">Todo bajo control.</p>
                  </div>
                  <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 font-bold">
                    Actualizado
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {heroStats.map((s) => (
                    <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4">
                      <p className="text-xs text-slate-400">{s.label}</p>
                      <p className="text-xl font-black mt-1 text-slate-900">{s.value}</p>
                      <p className={`text-xs font-bold mt-1 ${s.subClass}`}>{s.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-white border border-slate-100 rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-slate-900">Envíos pendientes</p>
                      <p className="text-xs text-slate-400 mt-1">Información lista para preparar</p>
                    </div>
                    <ArrowRight size={18} className="text-tori-600" />
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[72%] bg-tori-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ y: [16, 0, 0, -8], opacity: [0, 1, 1, 1] }}
              transition={{ duration: 4, times: [0, 0.15, 0.8, 1], repeat: Infinity, repeatDelay: 1.2, delay: 1 }}
              className="hidden md:flex absolute -bottom-7 -left-4 sm:-left-8 bg-white border border-slate-200 shadow-card rounded-2xl px-4 py-3 items-center gap-3"
            >
              <ToriMascot variant="happy" size={40} />
              <div>
                <p className="text-xs text-slate-400">Tori dice:</p>
                <p className="text-sm font-extrabold text-slate-800">&ldquo;Tú vende. Yo ayudo con el orden.&rdquo;</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ AUTODIAGNÓSTICO ============ */}
      <section id="diagnostico" className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[.18em] font-black text-tori-600">
              Ahora sé sincero contigo mismo
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              ¿Cuántas de estas cosas te han pasado?
            </h2>
            <p className="mt-4 text-slate-500">
              No tienes que marcar todas. Solo queremos que seas sincero contigo mismo.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-slate-700">Marca las que te hayan pasado</p>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  count > 0 ? 'bg-tori-50 text-tori-700' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {count} / {diagnosticoItems.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mb-6">
              <div
                className="h-full rounded-full bg-tori-500 transition-all duration-300"
                style={{ width: `${(count / diagnosticoItems.length) * 100}%` }}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {diagnosticoItems.map((item, i) => {
                const marcado = marcados.includes(i)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleMarco(i)}
                    className={`check text-left w-full rounded-2xl border p-4 hover:border-tori-300 transition flex items-start gap-3 ${
                      marcado ? 'border-tori-400 bg-tori-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span
                      className={`box shrink-0 w-6 h-6 rounded-lg border-2 grid place-items-center text-xs font-black transition ${
                        marcado ? 'bg-tori-500 border-tori-500 text-white' : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={`text-sm sm:text-base font-semibold leading-snug ${
                        marcado ? 'text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {resultadoDiag && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-3xl border border-tori-200 bg-tori-50 p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
            >
              <ToriMascot variant="happy" size={56} className="shrink-0" />
              <div className="flex-1">
                <p className="text-xl font-black text-slate-900">{resultadoDiag.title}</p>
                <p className="mt-2 text-slate-600">{resultadoDiag.text}</p>
              </div>
              <a
                href="#solucion"
                className="shrink-0 rounded-xl bg-tori-600 hover:bg-tori-700 text-white px-5 py-3 font-bold transition"
              >
                Quiero tener más control
              </a>
            </motion.div>
          )}
        </div>
      </section>

      {/* ============ PROBLEMA ============ */}
      <section id="problema" className="py-20 sm:py-28 bg-slate-50 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="max-w-3xl">
            <span className="text-xs uppercase tracking-[.18em] font-black text-tori-600">El problema real</span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              El problema no es que tengas muchas ventas.
            </h2>
            <p className="mt-4 text-xl text-slate-600">
              Es todo lo que tienes que hacer <strong className="text-slate-900">después</strong> de cada venta.
            </p>
          </motion.div>

          <div className="mt-12 grid lg:grid-cols-2 gap-10 items-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {flujoProblema.map((paso, i) => (
                <div
                  key={paso}
                  className={`connector rounded-2xl border p-4 text-center font-bold text-sm ${
                    i >= 3
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-700'
                  } `}
                >
                  {paso}
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="rounded-3xl bg-white border border-slate-200 p-7 sm:p-9 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle size={22} className="text-amber-500" />
                </div>
                <div>
                  <p className="font-black text-lg text-slate-900">Cuando todo termina en un lugar diferente...</p>
                  <p className="text-slate-500 text-sm mt-1">tu negocio empieza a depender de tu memoria.</p>
                </div>
              </div>
              <div className="mt-6 h-px bg-slate-100" />
              <p className="mt-6 text-2xl font-black leading-tight text-slate-900">Y ahí comienzan los errores.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {erroresComunes.map((e) => (
                  <div key={e} className="rounded-xl bg-slate-50 p-3 text-slate-700 font-semibold">
                    {e}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ IDEA CENTRAL: TODO CONECTADO ============ */}
      <section id="solucion" className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-tori-50/50 to-white" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase tracking-[.18em] font-black text-tori-600">Aquí entra Tori</span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              Todo lo que hoy tienes separado, <span className="gradient-text">conectado.</span>
            </h2>
            <p className="mt-5 text-lg text-slate-600">
              No necesitas otra herramienta para complicarte. Necesitas que pedidos, ventas, inventario, dinero y
              envíos puedan trabajar juntos.
            </p>
          </motion.div>

          <div className="mt-14 grid lg:grid-cols-[1fr_auto_1fr] gap-7 items-center">
            <div className="grid grid-cols-2 gap-3">
              {antesGrid.map((g) => (
                <div key={g.title} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                  <g.icon size={24} className="text-slate-400" />
                  <p className="font-black mt-3 text-slate-900">{g.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{g.sub}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-[2rem] bg-white border border-tori-200 shadow-soft grid place-items-center">
                <div className="text-center">
                  <ToriMascot variant="logo" size={52} />
                  <p className="font-black text-tori-700 mt-1 text-sm">TORI</p>
                </div>
              </div>
              <span className="text-xs font-bold text-tori-600">Conecta</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {despuesGrid.map((g) => (
                <div key={g.title} className="rounded-2xl bg-white border border-tori-100 p-5 shadow-card">
                  <g.icon size={24} className="text-tori-600" />
                  <p className="font-black mt-3 text-slate-900">{g.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{g.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div {...fadeUp} className="mt-12 text-center">
            <p className="text-xl sm:text-2xl font-black text-slate-900">El resultado no es trabajar más.</p>
            <p className="mt-2 text-lg text-slate-500">Es tener claridad para dedicar más tiempo a vender.</p>
          </motion.div>
        </div>
      </section>

      {/* ============ DEMO PRINCIPAL ============ */}
      <DashboardDemo />

      {/* ============ TRES SOLUCIONES ============ */}
      <FeaturesSection />

      {/* ============ FACILIDAD ============ */}
      <section className="py-20 sm:py-28 bg-tori-50/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rounded-[2rem] bg-white border border-tori-100 shadow-card p-8 sm:p-12 text-center"
          >
            <div className="flex justify-center">
              <ToriMascot variant="guide" size={72} />
            </div>
            <span className="mt-4 inline-block text-xs uppercase tracking-[.18em] font-black text-tori-600">
              ¿Te preocupa que sea complicado?
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900">
              A nuestro primer emprendedor también.
            </h2>
            <p className="mt-5 text-slate-600 max-w-2xl mx-auto">
              Antes de probar Tori pensaba que podía ser complicado y que no entendería cómo usarlo.
            </p>
            <blockquote className="mt-8 text-2xl sm:text-3xl font-black text-slate-900">
              &ldquo;Es como mi Excel, pero en orden.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-slate-400">
              La mejor explicación de Tori puede venir de alguien que ya lo usa.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ MOMENTO TORI ============ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.div {...fadeUp}>
            <div className="flex justify-center">
              <ToriMascot variant="happy" size={64} />
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-black text-slate-900">
              Tori no viene a decirte cómo emprender.
            </h2>
            <p className="mt-2 text-xl sm:text-2xl text-slate-500">Viene a ayudarte a que sea un poco más fácil.</p>
            <div className="mt-6 inline-block rounded-2xl bg-slate-50 border border-slate-200 px-6 py-4">
              <p className="font-black text-slate-800">
                &ldquo;Tú encárgate de vender. Yo ayudo con que no se te pierda todo lo demás.&rdquo;
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ HISTORIAS ============ */}
      <TestimonialsSection />

      {/* ============ PARA QUIEN ============ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase tracking-[.18em] font-black text-tori-600">¿Tori es para ti?</span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              Si mientras leías esto pensaste &ldquo;eso me pasa a mí&rdquo;...
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              probablemente Tori fue hecho pensando en alguien como tú.
            </p>
          </motion.div>
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl bg-tori-50 border border-tori-100 p-7"
            >
              <h3 className="font-black text-xl text-slate-900">Tori puede encajar contigo si...</h3>
              <ul className="mt-5 space-y-3 text-slate-600">
                {paraQuienSi.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-tori-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-3xl bg-slate-50 border border-slate-200 p-7 flex flex-col"
            >
              <h3 className="font-black text-xl text-slate-900">Quizá no sea lo que buscas si...</h3>
              <ul className="mt-5 space-y-3 text-slate-600 flex-1">
                {paraQuienNo.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                      <X size={12} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl bg-white border border-slate-200 p-4 text-sm font-bold text-slate-700">
                Tori está pensado para emprendedores que quieren ordenar su negocio sin complicarse.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ CÓMO FUNCIONA ============ */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center">
            <span className="text-xs uppercase tracking-[.18em] font-black text-tori-600">Así de simple</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Empieza a ordenar tu negocio en pocos pasos.
            </h2>
          </motion.div>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {pasos.map((p, i) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-3xl border border-slate-200 p-7"
              >
                <span className="w-10 h-10 rounded-xl bg-tori-600 text-white grid place-items-center font-black">
                  {p.num}
                </span>
                <h3 className="mt-5 text-xl font-black text-slate-900">{p.title}</h3>
                <p className="mt-2 text-slate-500">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRUEBA / PRECIOS ============ */}
      <section id="precios" className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center">
            <span className="text-xs uppercase tracking-[.18em] font-black text-tori-600">Pruébalo sin riesgo</span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              30 días para descubrir si Tori es para ti.
            </h2>
            <p className="mt-4 text-lg text-slate-500">Empieza gratis y decide después.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-10 rounded-[2rem] border-2 border-tori-200 bg-tori-50/50 p-7 sm:p-10"
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white p-5 text-center border border-slate-100">
                <ShieldCheck size={24} className="mx-auto text-tori-600" />
                <p className="mt-2 font-black text-slate-900">30 días gratis</p>
              </div>
              <div className="rounded-2xl bg-white p-5 text-center border border-slate-100">
                <ShieldCheck size={24} className="mx-auto text-emerald-600" />
                <p className="mt-2 font-black text-slate-900">Sin tarjeta</p>
              </div>
              <div className="rounded-2xl bg-white p-5 text-center border border-slate-100">
                <CheckCircle2 size={24} className="mx-auto text-tori-600" />
                <p className="mt-2 font-black text-slate-900">Cancela cuando quieras</p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-tori-600 hover:bg-tori-700 text-white px-8 py-4 font-black shadow-xl shadow-tori-600/20 transition"
              >
                Probar Tori gratis
                <ArrowRight size={16} className="ml-2" />
              </Link>
              <p className="mt-3 text-xs text-slate-400">Sin tarjeta · Sin compromiso</p>
            </div>
          </motion.div>

          {/* Planes */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
            >
              <h3 className="text-lg font-bold text-slate-900">Básico</h3>
              <p className="mt-1 text-sm text-slate-500">Para empezar a ordenarte</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">Gratis</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Para siempre, después de la prueba</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {planBasicFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check size={15} className="mt-0.5 shrink-0 text-tori-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border border-slate-200 text-slate-700 hover:border-tori-400 hover:text-tori-700 transition-all duration-200"
              >
                Probar Pro gratis
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative flex flex-col rounded-2xl border-2 border-tori-400 bg-white p-6 sm:p-8 shadow-xl shadow-tori-600/10"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-tori-600 text-white text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                Más popular
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">Pro</h3>
              <p className="mt-1 text-sm text-slate-500">Para negocios en crecimiento</p>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm line-through text-slate-400 mb-1">S/ 39.90</p>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700 whitespace-nowrap">
                    Precio de lanzamiento
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-slate-900">S/ 29.90</span>
                  <span className="text-sm text-slate-500 font-medium">/mes</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">30 días gratis, luego S/ 29.90/mes</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {planProFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check size={15} className="mt-0.5 shrink-0 text-tori-500" />
                    <span className="font-semibold text-slate-800">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-tori-600 hover:bg-tori-700 text-white hover:shadow-xl hover:shadow-tori-600/20 transition-all duration-200"
              >
                Comenzar prueba gratis
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Sin permanencia. Puedes cambiar o cancelar tu plan cuando quieras.
          </p>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center">
            <span className="text-xs uppercase tracking-[.18em] font-black text-tori-600">Preguntas frecuentes</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Antes de empezar, quizá quieras saber esto.
            </h2>
          </motion.div>
          <motion.div {...fadeUp} className="mt-10 space-y-3">
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
      <section className="relative overflow-hidden py-24 sm:py-32 bg-gradient-to-br from-tori-700 to-tori-500 text-white">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.div {...fadeUp}>
            <div className="flex justify-center">
              <ToriMascot variant="happy" size={88} />
            </div>
            <h2 className="mt-5 text-3xl sm:text-5xl font-black tracking-tight">
              Tu negocio ya está creciendo.
            </h2>
            <p className="mt-4 text-xl sm:text-2xl text-white/85">
              Ahora haz que organizarlo no te quite el tiempo para hacerlo crecer.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-white text-tori-700 px-8 py-4 font-black hover:bg-slate-50 transition shadow-xl"
            >
              Empezar a usar Tori
              <ArrowRight size={16} className="ml-2" />
            </Link>
            <p className="mt-4 text-sm text-white/70">Menos tiempo buscando y ordenando. Más tiempo para vender.</p>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-slate-950 text-slate-400 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-2 text-white font-black">
                <LogoTori size={28} />
                Tori
              </div>
              <p className="mt-2 text-sm max-w-xs">
                Tu compañero de negocio para trabajar con más orden y tranquilidad.
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              <ul className="space-y-2">
                <li className="text-white font-bold text-xs uppercase tracking-wider">Producto</li>
                <li><a href="#solucion" className="hover:text-white transition-colors">Cómo funciona</a></li>
                <li><a href="#funciones" className="hover:text-white transition-colors">Soluciones</a></li>
                <li><a href="#historias" className="hover:text-white transition-colors">Historias</a></li>
                <li><a href="#precios" className="hover:text-white transition-colors">Precios</a></li>
              </ul>
              <ul className="space-y-2">
                <li className="text-white font-bold text-xs uppercase tracking-wider">Acceso</li>
                <li><Link href="/login" className="hover:text-white transition-colors">Iniciar sesión</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Comenzar gratis</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs">© {new Date().getFullYear()} Tori</p>
            <a href="#inicio" className="text-xs hover:text-white transition-colors">Ir arriba</a>
          </div>
        </div>
      </footer>

      {/* ============ CTA FIJA (móvil) ============ */}
      {showSticky && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed md:hidden bottom-3 left-3 right-3 z-40"
        >
          <Link
            href="/register"
            className="flex items-center justify-center rounded-2xl bg-tori-600 text-white py-3.5 font-black shadow-2xl shadow-tori-900/30 border border-white/20"
          >
            Probar Tori gratis
          </Link>
        </motion.div>
      )}
    </div>
  )
}
