'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Coins,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Palette,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Star,
  Store,
  Truck,
  UserRound,
  Warehouse,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import LogoTori from '@/components/LogoTori'
import ToriMascot from '@/components/ToriMascot'

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

const consecuencias = [
  { icon: Clock, title: 'Tiempo', desc: 'Horas que podrías usar para vender.' },
  { icon: Coins, title: 'Dinero', desc: 'Pérdidas causadas por errores, olvidos o falta de control.' },
  { icon: Package, title: 'Pedidos', desc: 'Pedidos incompletos, equivocados u olvidados.' },
  { icon: Search, title: 'Información', desc: 'Tiempo buscando datos entre chats, hojas y notas.' },
  { icon: MessageCircle, title: 'WhatsApp', desc: 'Cientos de conversaciones que revisar para encontrar información.' },
]

const antesItems = [
  'Buscar conversaciones.',
  'Revisar notas.',
  'Actualizar hojas.',
  'Buscar direcciones.',
  'Revisar pedidos uno por uno.',
  'Intentar recordar qué pasó.',
]

const despuesItems = [
  'Pedidos organizados.',
  'Envíos listos.',
  'Inventario claro.',
  'Dinero disponible visible.',
  'Menos trabajo repetitivo.',
  'Mayor tranquilidad.',
]

const features = [
  {
    icon: MessageCircle,
    title: 'Deja de buscar pedidos en WhatsApp.',
    problem: '¿Sigues buscando conversaciones para encontrar los datos de un pedido?',
    solution: 'Tu cliente completa sus datos desde tu formulario y la información llega organizada a Tori.',
    benefit: 'Menos copiar. Menos errores. Más tiempo.',
  },
  {
    icon: Boxes,
    title: '¿Vendiste algo y ya no recuerdas si quedaba?',
    problem: 'Controlar el inventario después de cada venta puede convertirse en otro trabajo más.',
    solution: 'Tori mantiene tu inventario conectado con tus ventas.',
    benefit: 'Sabes qué tienes disponible y reduces el riesgo de vender algo que ya no tienes.',
  },
  {
    icon: Coins,
    title: 'Ten claro cuánto dinero tienes disponible.',
    problem: 'Hacer cuentas constantemente para saber cómo va el negocio.',
    solution: 'Tori te ayuda a tener una visión clara de tu dinero disponible.',
    benefit: 'Porque vender más también significa saber cuánto realmente tienes.',
  },
  {
    icon: ShoppingCart,
    title: 'Organiza tus ventas y cobros.',
    problem: 'Cuando las ventas y los cobros están dispersos, es fácil perder el control.',
    solution: 'Registra y consulta tus ventas y cobros desde un mismo sistema.',
    benefit: 'Más claridad sobre lo que vendiste y lo que tienes pendiente.',
  },
  {
    icon: Warehouse,
    title: 'Controla compras y gastos.',
    problem: 'Los gastos pequeños también terminan afectando las cuentas.',
    solution: 'Registra compras y gastos para tener una visión más completa del negocio.',
    benefit: 'Deja de hacer cuentas a ciegas.',
  },
  {
    icon: Truck,
    title: 'Coordina tus envíos con menos trabajo.',
    problem: 'Preparar información para el courier manualmente consume tiempo.',
    solution: 'Tori organiza la información necesaria para gestionar tus envíos.',
    benefit: 'Menos trabajo manual y menos posibilidades de equivocarte.',
  },
]

const featureFormulario = {
  icon: Palette,
  title: 'Tu formulario, a tu manera.',
  problem: 'No todos los negocios necesitan pedir los mismos datos.',
  solution: 'Personaliza el formulario que utilizan tus clientes para solicitar sus envíos.',
  benefit: 'Recibe la información que realmente necesitas, ordenada desde el inicio.',
}

const steps = [
  {
    step: '01',
    icon: Settings,
    title: 'Crea tu cuenta',
    desc: 'Empieza tu prueba gratuita y configura tu negocio.',
  },
  {
    step: '02',
    icon: ClipboardList,
    title: 'Organiza tu operación',
    desc: 'Configura tus productos, ventas, inventario y envíos.',
  },
  {
    step: '03',
    icon: CheckCircle2,
    title: 'Empieza a trabajar',
    desc: 'Deja que Tori te ayude a mantener todo organizado.',
  },
]

const historias = [
  {
    quote: 'Es como mi Excel, pero en orden.',
    context: 'Emprendedora de repostería · Lima',
    result: 'Ahora sabe cuánto dinero tiene disponible en segundos y ya no llena manualmente el formato de Shalom ni busca direcciones en WhatsApp.',
  },
  {
    quote: 'Ahora puedo usar mi tiempo para vender más.',
    context: 'Emprendedora de repostería · Lima',
    result: 'Antes podía perder alrededor de 3 horas al día organizando pedidos.',
  },
  {
    quote: 'Todo es práctico y fácil de usar.',
    context: 'Emprendedora de repostería · Lima',
    result: 'Describe Tori como simple, necesario y funcional.',
  },
  {
    quote: 'Ahora tengo más claridad y confianza de lo que tenemos.',
    context: 'Emprendedora de repostería · Lima',
    result: 'Pasó de sentirse desordenado y frustrado a sentirse con mayor claridad y control.',
  },
]

const paraQuienSi = [
  'Vendes principalmente por WhatsApp.',
  'Captas clientes desde TikTok, Instagram o Facebook.',
  'Tienes pedidos constantemente.',
  'Usas Excel, Google Sheets, cuadernos, notas o varias herramientas para organizarte.',
  'Sientes que organizar el negocio consume demasiado tiempo.',
  'Quieres vender más sin trabajar cada vez más horas.',
]

const paraQuienNo = [
  'Buscas un ERP empresarial extremadamente complejo.',
  'Quieres una herramienta que haga absolutamente todo.',
  'Tu negocio necesita procesos corporativos muy específicos.',
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
    a: 'No. Puedes seguir utilizando tus canales de venta habituales, como WhatsApp, TikTok e Instagram.',
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

const navItems = [
  { icon: Truck, label: 'Pedidos' },
  { icon: Boxes, label: 'Inventario' },
  { icon: ShoppingCart, label: 'Ventas' },
  { icon: Warehouse, label: 'Compras' },
  { icon: MapPin, label: 'Logística' },
]

const pedidosHero = [
  { initial: 'M', name: 'María García', sub: 'Cesta de regalo · Motorizado', badge: 'Enviado', badgeClass: 'bg-emerald-100 text-emerald-700' },
  { initial: 'C', name: 'Carlos López', sub: 'Box de brownies · Shalom', badge: 'Por despachar', badgeClass: 'bg-amber-100 text-amber-700' },
  { initial: 'A', name: 'Ana Torres', sub: 'Polos x3 · Recojo en tienda', badge: 'Pago confirmado', badgeClass: 'bg-sky-100 text-sky-700' },
]

const heroStats = [
  { label: 'Stock bajo', value: '3', color: 'text-amber-600' },
  { label: 'Cobros pendientes', value: '5', color: 'text-slate-700' },
  { label: 'Envíos hoy', value: '12', color: 'text-sky-600' },
]

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
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Funciones', href: '#funciones' },
    { label: 'Historias', href: '#historias' },
    { label: 'Precios', href: '#precios' },
  ]

  const nav = (
    <nav className="flex items-center gap-5 sm:gap-8">
      {navLinks.map((l) => (
        <a key={l.href} href={l.href} className="hidden lg:block text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
          {l.label}
        </a>
      ))}
      <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
        Iniciar sesión
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
      >
        Probar Tori
        <ArrowRight size={15} />
      </Link>
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden pb-20 lg:pb-0">
      {/* ============ BANNER DE PROMOCIÓN ============ */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white text-center text-xs sm:text-sm font-semibold py-2 px-4">
        <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5">
          30 días gratis, sin tarjeta ·
          <Link href="/register" className="underline underline-offset-2 font-bold hover:text-sky-100">
            Empieza ahora
          </Link>
        </span>
      </div>

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
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-slate-600 py-2">
                  {l.label}
                </a>
              ))}
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-slate-600 py-2">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white"
              >
                Probar Tori
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
                Para emprendedores que venden por WhatsApp
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
                Vender por WhatsApp debería darte más ventas,{' '}
                <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  no más desorden.
                </span>
              </h1>
              <p className="mt-5 text-base sm:text-xl text-slate-600 leading-relaxed max-w-lg">
                Respondes mensajes, haces lives, vendes, cobras, controlas tus productos y preparas pedidos.
                Pero si cada venta significa más cosas que recordar, quizá no necesitas trabajar más.
                Necesitas tener tu negocio bajo control.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
                >
                  Quiero ordenar mi negocio
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

              {/* Prueba social */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {['from-sky-500 to-cyan-500', 'from-indigo-500 to-purple-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500'].map(
                    (g, i) => (
                      <div
                        key={i}
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}
                      >
                        {['CR', 'JM', 'AP', 'DV'][i]}
                      </div>
                    ),
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-snug">
                  Emprendedores de repostería, ropa y comida{' '}
                  <span className="font-semibold text-slate-700">ya lo usan</span>
                </p>
              </div>
            </motion.div>

            {/* Mockup del dashboard (lo que ves tú) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              className="relative"
            >
              <div className="absolute -top-8 -right-6 hidden md:block w-60 h-60 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-full blur-3xl opacity-70" />

              <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">
                {/* Barra de ventana */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="ml-3 hidden sm:block flex-1 max-w-xs text-center text-[10px] font-medium text-slate-400 bg-slate-50 rounded-lg px-3 py-1 truncate">
                    app.tori.pe/dashboard
                  </span>
                </div>

                <div className="flex">
                  {/* Sidebar */}
                  <div className="hidden sm:block w-40 border-r border-slate-100 p-3">
                    <div className="flex items-center gap-1.5 mb-4 px-1.5">
                      <LogoTori size={20} />
                      <span className="text-sm font-extrabold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                        Tori
                      </span>
                    </div>
                    <div className="space-y-1">
                      {navItems.map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-semibold ${
                            item.label === 'Pedidos' ? 'bg-sky-50 text-sky-700' : 'text-slate-400'
                          }`}
                        >
                          <item.icon size={13} />
                          {item.label}
                          {item.label === 'Pedidos' && (
                            <span className="ml-auto relative flex w-2 h-2">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contenido principal */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Resumen del día
                        </p>
                        <p className="text-base font-extrabold text-slate-900">12 pedidos activos</p>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-[10px] font-bold">
                        + Nuevo
                      </div>
                    </div>

                    <div className="space-y-2">
                      {pedidosHero.map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                            {item.initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{item.sub}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${item.badgeClass}`}>
                            {item.badge}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {heroStats.map((s, i) => (
                        <div key={i} className="rounded-lg bg-slate-50 p-2">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                          <p className={`text-xs font-extrabold ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta flotante: venta pagada */}
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
                  <p className="text-xs font-bold text-slate-900">Venta pagada</p>
                  <p className="text-[10px] text-slate-400">Yape · S/ 45.00 · hace 2 min</p>
                </div>
              </motion.div>

              {/* Toast de nuevo pedido en loop */}
              <motion.div
                animate={{ y: [20, 0, 0, -20], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 4, times: [0, 0.15, 0.8, 1], repeat: Infinity, repeatDelay: 1.2, delay: 2.5 }}
                className="hidden md:flex absolute -top-6 -right-4 items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 px-4 py-3"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
                  <ShoppingCart size={16} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Nuevo pedido</p>
                  <p className="text-[10px] text-slate-400">Lucía · 2 box de brownies · Motorizado</p>
                </div>
              </motion.div>

              {/* Tori te acompaña */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="hidden md:flex absolute -bottom-5 -right-4 items-center gap-2.5 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 px-3.5 py-2.5"
              >
                <ToriMascot variant="happy" size={36} />
                <p className="text-[10px] font-semibold text-slate-700 leading-tight max-w-[130px]">
                  Tranquilo, de esto me encargo yo.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ AUTODIAGNÓSTICO ============ */}
      <section id="diagnostico" className="py-14 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-10 sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Ahora sé sincero contigo mismo</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              ¿Cuántas de estas cosas te{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                han pasado?
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              No tienes que marcar todas. Solo queremos que seas sincero contigo mismo.
            </p>
          </motion.div>

          <div className="space-y-2.5">
            {diagnosticoItems.map((item, i) => {
              const marcado = marcados.includes(i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleMarco(i)}
                  className={`w-full flex items-start gap-3 text-left rounded-2xl border-2 px-4 py-3.5 transition-all duration-200 ${
                    marcado
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 bg-white hover:border-sky-300'
                  }`}
                >
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      marcado ? 'bg-sky-600 border-sky-600' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {marcado && <Check size={13} className="text-white" />}
                  </span>
                  <span className={`text-sm leading-relaxed ${marcado ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                    {item}
                  </span>
                </button>
              )
            })}
          </div>

          {marcados.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50 p-6 sm:p-8 text-center"
            >
              <div className="flex justify-center mb-3">
                <ToriMascot variant="happy" size={48} />
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900">Si marcaste varias, tranquilo.</p>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
                No significa que seas desordenado. Significa que tu negocio creció y tus herramientas no crecieron contigo.
              </p>
              <a
                href="#problema"
                className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
              >
                Quiero tener más control
                <ArrowRight size={16} />
              </a>
            </motion.div>
          )}
        </div>
      </section>

      {/* ============ EL PROBLEMA REAL ============ */}
      <section id="problema" className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">El problema real</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              El problema no es que tengas{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                muchas ventas.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Es todo lo que tienes que hacer después de cada venta.
            </p>
          </motion.div>

          {/* Flujo visual: todo lo que pasa después de cada venta */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-2 min-w-max mx-auto justify-center">
              {flujoProblema.map((paso, i) => (
                <div key={paso} className="flex items-center gap-2">
                  <span className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm">
                    {paso}
                  </span>
                  {i < flujoProblema.length - 1 && (
                    <ArrowRight size={14} className="shrink-0 text-slate-300" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <motion.div {...fadeUp} className="mt-10 sm:mt-12 text-center max-w-2xl mx-auto">
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              Cuando cada cosa termina en un lugar diferente, tu negocio termina{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                dependiendo de tu memoria.
              </span>
            </p>
            <p className="mt-4 text-lg sm:text-xl font-extrabold text-red-600">Y ahí comienzan los errores.</p>
          </motion.div>
        </div>
      </section>

      {/* ============ CONSECUENCIAS ============ */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">El costo del desorden</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Y ese desorden te está{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                costando
              </span>{' '}
              más de lo que parece.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            {consecuencias.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <c.icon size={20} className="text-red-500" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{c.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-10 sm:mt-12 max-w-2xl mx-auto text-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <p className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug">
                &ldquo;Sé que estoy vendiendo... pero no sé exactamente qué está pasando con mi negocio.&rdquo;
              </p>
              <p className="mt-3 text-xs text-slate-400">La frase de muchos emprendedores antes de encontrar Tori</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ TRANSICIÓN: AQUÍ ENTRA TORI ============ */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Aquí entra Tori</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              No necesitas{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                trabajar más.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Necesitas que el trabajo repetitivo deje de depender de ti.
            </p>
          </motion.div>

          {/* Tori te habla */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 p-6 sm:p-8"
          >
            <div className="flex items-start gap-4">
              <ToriMascot variant="guide" size={56} className="shrink-0" />
              <div className="rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-200 px-4 py-3.5 flex-1">
                <p className="text-xs font-bold text-slate-400 mb-1">Hola, soy Tori.</p>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  Tu compañero de negocio. Te ayudo a organizar tus pedidos, ventas, inventario y envíos
                  para que tengas todo mucho más claro y puedas dedicar tu tiempo a lo que realmente hace crecer tu negocio:{' '}
                  <span className="font-extrabold text-slate-900">Vender.</span>
                </p>
              </div>
            </div>
            <a
              href="#funciones"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
            >
              Conocer Tori
              <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ============ TRANSFORMACIÓN: ANTES Y DESPUÉS ============ */}
      <section id="como-funciona" className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Antes y después</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              De &ldquo;¿dónde estaba ese pedido?&rdquo; a{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                &ldquo;ya sé qué tengo que hacer&rdquo;.
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-10 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8"
            >
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Antes</p>
              <ul className="space-y-3">
                {antesItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <X size={16} className="mt-0.5 shrink-0 text-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6 sm:p-8"
            >
              <p className="text-sm font-bold uppercase tracking-wider text-sky-600 mb-4">Con Tori</p>
              <ul className="space-y-3">
                {despuesItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-800 font-semibold">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ FUNCIONES ============ */}
      <section id="funciones" className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Todo lo que necesitas, en un solo lugar</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Menos trabajo repetitivo.{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Más control.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Tori conecta las tareas que antes tenías repartidas entre WhatsApp, Excel, notas y otras herramientas.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 hover:border-sky-300 hover:shadow-lg transition-all duration-200 flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <f.icon size={20} className="text-sky-600" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900 leading-snug">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.problem}</p>
                <div className="mt-4 rounded-xl bg-sky-50 border border-sky-100 p-3.5 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 mb-1">Lo que Tori hace</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{f.solution}</p>
                </div>
                <p className="mt-3 inline-flex items-start gap-1.5 text-xs font-bold text-emerald-700">
                  <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                  {f.benefit}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Spotlight: tu formulario, a tu manera */}
          <div className="mt-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center bg-white border border-slate-200 rounded-3xl p-6 sm:p-10">
            <motion.div {...fadeUp}>
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center mb-4">
                <Palette size={20} className="text-sky-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">{featureFormulario.title}</h3>
              <p className="mt-2 text-sm sm:text-base text-slate-600">{featureFormulario.problem}</p>
              <div className="mt-4 rounded-xl bg-sky-50 border border-sky-100 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 mb-1">Lo que Tori hace</p>
                <p className="text-sm text-slate-700">{featureFormulario.solution}</p>
              </div>
              <p className="mt-3 inline-flex items-start gap-1.5 text-xs font-bold text-emerald-700">
                <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                {featureFormulario.benefit}
              </p>
            </motion.div>

            {/* Mockup del formulario */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative mx-auto w-full max-w-sm"
            >
              <div className="absolute -top-8 -right-6 w-60 h-60 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-full blur-3xl opacity-70" />

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
                      <div className="h-2.5 w-full rounded-full bg-slate-200 animate-pulse" />
                      <div className="h-2.5 w-2/3 rounded-full bg-slate-200 animate-pulse" />
                      <div className="h-2.5 w-1/2 rounded-full bg-slate-200 animate-pulse" />
                    </div>
                  </div>

                  {/* Métodos de envío */}
                  <div className="mt-3.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      ¿Cómo lo recibes?
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {metodosForm.map((m, i) => (
                        <div
                          key={i}
                          className={`rounded-xl p-2.5 text-center ${
                            m.active ? 'border-2 border-sky-500 bg-sky-50' : 'border border-slate-100 bg-white'
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
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Distrito: Miraflores
                      </p>
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
                animate={{ y: [16, 0, 0, -16], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 4, times: [0, 0.15, 0.8, 1], repeat: Infinity, repeatDelay: 1.2, delay: 1.5 }}
                className="hidden md:flex absolute -bottom-6 -left-10 items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 px-4 py-3"
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

      {/* ============ FACILIDAD ============ */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div {...fadeUp}>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">¿Te preocupa que sea complicado?</p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                A nuestro primer{' '}
                <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  emprendedor
                </span>{' '}
                también.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                Antes de probar Tori pensaba que podía ser complicado y que no entendería cómo usarlo.
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug">
                  &ldquo;Es como mi Excel, pero en orden.&rdquo;
                </p>
              </div>

              <p className="mt-5 text-sm text-slate-600 leading-relaxed">
                Tori está pensado para que puedas entender qué hacer sin tener que convertirte en experto en sistemas.
              </p>
              <p className="mt-2 inline-flex items-start gap-1.5 text-sm font-semibold text-slate-800">
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                Todo está explicado claramente y te guía por lo que suele ser fácil de entender.
              </p>
            </motion.div>

            {/* Panel de resumen */}
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

      {/* ============ HISTORIAS ============ */}
      <section id="historias" className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Historias reales</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Tori ya forma parte del día a día de{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                otros emprendedores.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              No queremos decirte que Tori funciona. Preferimos que lo cuenten quienes ya lo están usando.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {historias.map((h, i) => (
              <motion.div
                key={h.quote}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={13} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-base font-extrabold text-slate-900 leading-snug">&ldquo;{h.quote}&rdquo;</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{h.context}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  {h.result}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ¿TORI ES PARA TI? ============ */}
      <section id="para-quien" className="py-14 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">¿Tori es para ti?</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Tori es para emprendedores que quieren ordenar su negocio{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                sin complicarse.
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-6 sm:p-8"
            >
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-700 mb-4">Sí, es para mí si...</p>
              <ul className="space-y-3">
                {paraQuienSi.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8"
            >
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">No es para ti si...</p>
              <ul className="space-y-3">
                {paraQuienNo.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-500">
                    <X size={16} className="mt-0.5 shrink-0 text-slate-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div {...fadeUp} className="mt-10 text-center max-w-2xl mx-auto">
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              Si mientras leías esto pensaste &ldquo;eso me pasa a mí&rdquo;, probablemente Tori fue hecho{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                pensando en alguien como tú.
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ CÓMO FUNCIONA ============ */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Así de simple</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Empieza a ordenar tu negocio en{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                pocos pasos.
              </span>
            </h2>
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

      {/* ============ PRUEBA / PRECIOS ============ */}
      <section id="precios" className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Pruébalo sin riesgo</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              30 días para descubrir si Tori{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                es para ti.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">Empieza gratis y decide después.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
              {['30 días gratis', 'Sin tarjeta', 'Cancela cuando quieras'].map((b) => (
                <span key={b} className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  {b}
                </span>
              ))}
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
            >
              Probar Tori gratis
              <ArrowRight size={16} />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto mt-4">
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
                    <Check size={15} className="mt-0.5 shrink-0 text-sky-500" />
                    {f}
                  </li>
                ))}
              </ul>
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
              className="relative flex flex-col rounded-2xl border-2 border-sky-500 bg-white p-6 sm:p-8 shadow-xl shadow-sky-500/10"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider">
                Más popular
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">Pro</h3>
              <p className="mt-1 text-sm text-slate-500">Para negocios en crecimiento</p>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm line-through text-slate-400 mb-1">S/ 39.90</p>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
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
                    <Check size={15} className="mt-0.5 shrink-0 text-sky-500" />
                    <span className="font-semibold text-slate-800">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
              >
                Comenzar prueba gratis
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Sin permanencia. Puedes cambiar o cancelar tu plan cuando quieras, sin multas ni letra pequeña.
          </p>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Preguntas frecuentes</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Lo que nos{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                preguntan
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
              <ToriMascot variant="happy" size={76} className="mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest text-sky-200 mb-2">Tu negocio ya está creciendo.</p>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Ahora haz que organizarlo no te quite el tiempo para hacerlo crecer.
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-xl text-sky-100 max-w-lg mx-auto">
                Menos tiempo buscando, copiando y ordenando. Más tiempo para vender.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 mt-6 sm:mt-8 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm font-semibold bg-white text-sky-700 hover:bg-sky-50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
              >
                Empezar a usar Tori
                <ArrowRight size={16} />
              </Link>
              <p className="mt-4 text-xs text-sky-200/70">
                30 días de prueba · Sin tarjeta · Cancela cuando quieras
              </p>
              <p className="mt-2 text-sm text-sky-100/90 font-semibold">🐶 Nos vemos dentro.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto] gap-8 sm:gap-12 items-start">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                <LogoTori size={22} />
                Tori
              </div>
              <p className="mt-3 text-xs text-slate-400 max-w-xs leading-relaxed">
                Tori existe para ayudar a los emprendedores a recuperar el control de su negocio y dedicar más tiempo a vender y crecer.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Producto</p>
              <ul className="space-y-2.5 text-xs text-slate-500">
                <li>
                  <a href="#como-funciona" className="hover:text-sky-600 transition-colors">Cómo funciona</a>
                </li>
                <li>
                  <a href="#funciones" className="hover:text-sky-600 transition-colors">Funciones</a>
                </li>
                <li>
                  <a href="#historias" className="hover:text-sky-600 transition-colors">Historias</a>
                </li>
                <li>
                  <a href="#precios" className="hover:text-sky-600 transition-colors">Precios</a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-sky-600 transition-colors">Preguntas frecuentes</a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Acceso</p>
              <ul className="space-y-2.5 text-xs text-slate-500">
                <li>
                  <Link href="/login" className="hover:text-sky-600 transition-colors">Iniciar sesión</Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-sky-600 transition-colors">Comenzar gratis</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-xs text-slate-400">
              © {new Date().getFullYear()} Tori — Todos los derechos reservados.
            </div>
            <div className="flex items-center gap-4">
              <a href="#como-funciona" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Ir arriba
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ============ BARRA CTA FIJA (móvil) ============ */}
      {showSticky && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
        >
          <div className="min-w-0">
            <p className="text-sm font-extrabold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              Tori
            </p>
            <p className="text-[10px] text-slate-500">30 días gratis · sin tarjeta</p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200"
          >
            Probar Tori
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      )}
    </div>
  )
}
