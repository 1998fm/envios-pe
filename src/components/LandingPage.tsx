'use client'

import { motion } from 'framer-motion'
import {
  Package, ClipboardList, Truck, Settings, Smartphone, Zap, DollarSign, Clock,
  ShieldCheck, BarChart3, ArrowRight, CheckCircle, Store, ShoppingBag,
  Warehouse, ArrowUpRight, Menu, X, Globe, Search,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import LogoTori from '@/components/LogoTori'

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' },
} as const

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: 'easeOut' },
} as const

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const nav = (
    <nav className="flex items-center gap-5 sm:gap-8">
      <Link href="/login" className="text-base font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        Iniciar sesión
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
      >
        Crear cuenta
        <ArrowRight size={16} />
      </Link>
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* ============================================
          HEADER
      ============================================ */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <LogoTori size={60} />
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              Tori
            </span>
          </Link>

          <div className="hidden sm:block">
            {nav}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="sm:hidden px-4 pb-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950"
            >
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-base font-semibold text-slate-600 dark:text-slate-400 py-2"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white"
                >
                  Crear cuenta
                  <ArrowRight size={18} />
                </Link>
              </div>
            </motion.div>
          )}
      </header>

      {/* ============================================
          HERO
      ============================================ */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-100/60 via-transparent to-indigo-100/30 dark:from-sky-900/20 dark:via-transparent dark:to-indigo-900/10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-sky-400/10 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-semibold mb-6">
                <BarChart3 size={14} />
                Más de 200 negocios peruanos ya ordenaron sus envíos
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Deja de buscar direcciones en{' '}
                <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  WhatsApp.
                </span>
                <br />
                Recibe todo ordenado.
              </h1>
              <p className="mt-3 text-sm font-medium text-sky-600 dark:text-sky-400 font-semibold">
                Tori — el sistema que ordena tus envíos automáticamente
              </p>
              <p className="mt-5 text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                Tus clientes llenan tus datos en tu formulario y todo aparece ordenado en tu dashboard: 
                dirección, método, pago. Tú solo abres, revisas y despachas. Sin chats perdidos, sin hojas sueltas.
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-700 dark:hover:text-sky-300 transition-all duration-200"
                >
                  Ver cómo funciona
                </a>
              </div>
              <div className="mt-6 flex items-center gap-6 text-xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  30 días Pro gratis
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Sin tarjeta
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Cancela cuando quieras
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              className="relative"
            >
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
                {/* Dashboard Header */}
                <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shrink-0">
                      T
                    </div>
                    <span className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                      Tori
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 whitespace-nowrap">
                      Pro · Trial 28d
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <div className="w-14 sm:w-20 h-7 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-700" />
                    <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-700" />
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 min-w-[140px]">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <div className="w-full pl-9 pr-3 py-2 rounded-xl text-[11px] sm:text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-400 truncate">
                        Buscar por nombre, DNI o teléfono...
                      </div>
                    </div>
                    <div className="w-20 sm:w-24 h-8 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0" />
                    <div className="w-20 sm:w-24 h-8 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0" />
                  </div>
                </div>

                {/* Envio Cards */}
                <div className="p-4 sm:p-5 space-y-3">
                  {[
                    { initial: 'M', name: 'María García', dni: '76543210', tel: '999 888 777', metodo: 'Motorizado', estado: 'ENVIADO', border: 'border-l-emerald-500', badgeClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
                    { initial: 'C', name: 'Carlos López', dni: '71234567', tel: '988 777 666', metodo: 'Shalom', estado: 'EMPACADO', border: 'border-l-amber-500', badgeClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
                    { initial: 'A', name: 'Ana Torres', dni: '70123456', tel: '977 666 555', metodo: 'Motorizado', estado: 'NO_EMPACADO', border: 'border-l-red-500', badgeClass: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`${item.border} bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-l-4 p-3 sm:p-4`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        {/* Checkbox */}
                        <div className="w-4 h-4 sm:w-5 sm:h-5 mt-1 rounded border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                        {/* Avatar */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shrink-0 bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] sm:text-sm shadow-sm">
                          {item.initial}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</div>
                          <div className="flex flex-col sm:flex-row sm:gap-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>DNI {item.dni}</span>
                            <span className="sm:inline">TLF {item.tel}</span>
                          </div>
                        </div>
                        {/* Badges */}
                        <div className="flex items-center gap-1.5 sm:gap-2 self-center shrink-0">
                          <span className="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {item.metodo === 'Motorizado' ? 'Moto' : item.metodo}
                          </span>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap ${item.badgeClass}`}>
                            {item.estado === 'ENVIADO' ? 'Enviado' : item.estado === 'EMPACADO' ? 'Empac.' : 'No Emp.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom summary */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">Hoy · 3 pedidos</div>
                  <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <BarChart3 size={10} className="text-emerald-500 shrink-0" />
                      +40% menos reclamos
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle size={10} className="text-emerald-500 shrink-0" />
                      100% ordenado
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          MÉTRICAS
      ============================================ */}
      <section className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { number: '+200', label: 'negocios registrados', icon: Store },
              { number: '30', label: 'segundos en crear pedido', suffix: 's', icon: Zap },
              { number: '+40%', label: 'menos reclamos', icon: ShieldCheck },
              { number: '3', label: 'minutos en configurar', suffix: 'min', icon: Settings },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <item.icon size={20} className="mx-auto text-sky-500 dark:text-sky-400 mb-2" />
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                  {item.number}
                  {item.suffix}
                </div>
                <div className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          PROBLEMA
      ============================================ */}
      <section id="problema" className="py-16 sm:py-24 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              ¿Te suena familiar?
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              El 90% de negocios que empiezan a hacer envíos terminan con estos problemas.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                number: '01',
                title: '¿Tus pedidos se pierden en los chats?',
                desc: 'Te llegan direcciones por WhatsApp, Instagram y Messenger. Cuando abres el chat ya no encuentras el mensaje. Tu cliente se molesta y tú pierdes la venta.',
                color: 'text-red-500',
                bg: 'bg-red-50 dark:bg-red-900/10',
                border: 'border-red-200 dark:border-red-900/30',
              },
              {
                number: '02',
                title: '¿Sigues anotando direcciones en papel?',
                desc: 'Apuntas en una libreta, luego pasas a Excel, alguien borra una fila sin querer. A fin de mes no sabes cuántos envíos hiciste ni cuánto te deben.',
                color: 'text-amber-500',
                bg: 'bg-amber-50 dark:bg-amber-900/10',
                border: 'border-amber-200 dark:border-amber-900/30',
              },
              {
                number: '03',
                title: '¿No sabes qué pedido va hoy?',
                desc: 'El motorizado llama y no tienes la dirección lista. El cliente pregunta «¿ya salió mi pedido?» y no sabes qué responder. Tu operación te controla a ti.',
                color: 'text-sky-600',
                bg: 'bg-sky-50 dark:bg-sky-900/10',
                border: 'border-sky-200 dark:border-sky-900/30',
              },
            ].map((item, i) => (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative ${item.bg} ${item.border} border rounded-2xl p-6 sm:p-8`}
              >
                <span className={`text-6xl sm:text-7xl font-black ${item.color} opacity-20 leading-none`}>
                  {item.number}
                </span>
                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="text-center mt-10">
            <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400">
              Perder un pedido no solo significa perder dinero.{' '}
              También pierdes la confianza del cliente.
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
              Tori pone orden en tu operación.{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Y tus clientes vuelven a confiar.
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          ANTES / DESPUÉS
      ============================================ */}
      <section className="py-16 sm:py-24 bg-sky-50/50 dark:bg-sky-950/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Antes de Tori vs.{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Después de Tori
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 sm:p-8"
            >
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">Antes de Tori</h3>
              <ul className="space-y-3">
                {[
                  'Direcciones perdidas en WhatsApp',
                  'Excel y libretas desordenadas',
                  'Pedidos olvidados',
                  'Clientes molestos esperando',
                  'Caos al crecer',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <span className="text-red-500 font-bold text-xs">✕</span>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-6 sm:p-8"
            >
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-4">Después de Tori</h3>
              <ul className="space-y-3">
                {[
                  'Todo llega ordenado al dashboard',
                  'Un solo lugar para gestionar',
                  'Estados del pedido en tiempo real',
                  'Menos reclamos y clientes felices',
                  'Tu negocio crece sin caos',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <span className="text-emerald-500 font-bold text-xs">✓</span>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          CÓMO FUNCIONA
      ============================================ */}
      <section id="como-funciona" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Comienza en{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                3 pasos
              </span>
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Configura tu negocio, comparte tu link y empieza a recibir pedidos en minutos.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                icon: Settings,
                title: 'Configura tu negocio',
                desc: 'Sube tu logo, activa los métodos de envío que ofreces y define tus tarifas por distrito.',
              },
              {
                step: '02',
                icon: Smartphone,
                title: 'Comparte tu link',
                desc: 'Recibe un link personalizado como /f/tu-negocio. Compártelo con tus clientes por WhatsApp, redes o tu web.',
              },
              {
                step: '03',
                icon: ClipboardList,
                title: 'Gestiona pedidos',
                desc: 'Recibe notificaciones, cambia estados, exporta datos y mantén el control total desde el dashboard.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
                className="relative bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8"
              >
                <span className="text-5xl sm:text-6xl font-black text-sky-100 dark:text-sky-900/40 leading-none">
                  {item.step}
                </span>
                <div className="mt-2 w-12 h-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" />
                <item.icon size={24} className="mt-5 text-sky-600 dark:text-sky-400" />
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          CTA TRIAL (mitad del landing)
      ============================================ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-sky-600 to-indigo-700 px-6 sm:px-12 py-12 sm:py-16 text-center text-white"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_white_0%,_transparent_60%)] opacity-10 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Prueba Pro gratis 30 días
              </h2>
              <p className="mt-4 text-lg sm:text-xl text-sky-100 max-w-lg mx-auto">
                Crea tu cuenta en 30 segundos. Sin tarjeta, sin compromiso.
                Disfruta de todas las funciones Pro sin pagar un sol.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-2xl text-sm font-semibold bg-white text-sky-700 hover:bg-sky-50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
              >
                Empezar prueba gratis
                <ArrowUpRight size={16} />
              </Link>
              <p className="mt-3 text-xs text-sky-200/70">Sin tarjeta • Cancela cuando quieras • 30 días Pro completo</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          EL SISTEMA
      ============================================ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              El sistema que{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                ordena tus envíos
              </span>
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Métodos de entrega, tarifas por zona, horarios inteligentes. 
              Todo lo que tu negocio necesita para enviar sin dolor de cabeza.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Truck, title: 'Motorizado', desc: 'Tus clientes reciben su pedido el mismo día. Tú solo despachas.', gradient: 'from-sky-500 to-cyan-500' },
              { icon: Globe, title: 'Agencias nacionales', desc: 'Llega a todo el Perú con las principales agencias de transporte interprovincial.', gradient: 'from-indigo-500 to-purple-500' },
              { icon: DollarSign, title: 'Tarifas por distrito', desc: 'El cliente ve el costo exacto al llenar el formulario. Sin preguntar, sin calcular.', gradient: 'from-emerald-500 to-teal-500' },
              { icon: Clock, title: 'Control de horarios', desc: 'Nunca más recibirás un pedido después de que el motorizado salió.', gradient: 'from-amber-500 to-orange-500' },
              { icon: Smartphone, title: 'Sin complicaciones', desc: 'Tu cliente solicita sin registrarse, sin crear cuenta, sin bajar apps. Solo llena el formulario y ya.', gradient: 'from-rose-500 to-pink-500' },
              { icon: Warehouse, title: 'Tu propio método', desc: '¿Usas otra agencia? Agrega un método personalizado con el nombre que quieras.', gradient: 'from-slate-500 to-slate-600' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                  <item.icon size={20} className="text-white" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURES
      ============================================ */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Todo lo que necesitas para{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                vender más
              </span>
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Herramientas diseñadas para que tu negocio de envíos funcione sin complicaciones.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              { icon: Smartphone, title: 'Formulario con tu marca', desc: 'Tus clientes ven tu logo, tus colores y tu identidad. No más plantillas genéricas.' },
              { icon: Zap, title: 'Envíos masivos', desc: 'Genera 50 pedidos en 10 segundos desde un Excel. Ideal para días de alto volumen.' },
              { icon: Truck, title: 'Fecha de entrega automática', desc: 'Calculamos la fecha programada según tus horarios de corte y días de atención.' },
              { icon: BarChart3, title: 'Dashboard en tiempo real', desc: 'Nunca vuelvas a preguntar "¿dónde está el pedido?". Filtra y exporta con un clic.' },
              { icon: Settings, title: 'Control de logística', desc: 'Define horarios de corte, cupo diario y días de atención para cada método de envío.' },
              { icon: ShieldCheck, title: 'Datos seguros', desc: 'Cada negocio tiene sus datos aislados. Solo tú accedes a tu información.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <item.icon size={20} className="text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          PARA QUIÉN ES
      ============================================ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ideal para{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                tu negocio
              </span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Store, title: 'Emprendedores', desc: 'Boutiques, bakeries, talleres y pequeños negocios que entregan sus productos.' },
              { icon: ShoppingBag, title: 'E-commerces', desc: 'Tiendas online que necesitan organizar sus envíos sin depender de Google Sheets.' },
              { icon: Warehouse, title: 'Distribuidores', desc: 'Negocios con reparto local o nacional que requieren control de flota y logística.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center p-6 sm:p-8"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                  <item.icon size={28} className="text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIOS
      ============================================ */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Lo que dicen los{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                negocios
              </span>{' '}
              que ya ordenaron sus envíos
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
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
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-base shadow-sm`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t.name}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{t.role}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          PLANES
      ============================================ */}
      <section id="planes" className="py-16 sm:py-24 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Planes{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                simples y claros
              </span>
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              30 días Pro gratis, sin tarjeta, sin compromiso. Después decide si sigues.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
            {/* Básico */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                30 días Pro gratis
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-4">Básico</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">Gratis</span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Después del trial, para siempre</p>
              <Link
                href="/register"
                className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-700 dark:hover:text-sky-300 transition-all duration-200"
              >
                Probar Pro gratis
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative rounded-2xl border-2 border-sky-500 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-xl shadow-sky-500/10"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider">
                Más popular
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">Pro</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">S/ 29.90</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">/mes</span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">30 días gratis, luego S/ 29.90/mes</p>
              <Link
                href="/register"
                className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
              >
                Empezar prueba gratis
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>

          {/* Tabla comparativa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-10 max-w-3xl mx-auto"
          >
            <h3 className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              Compara funciones
            </h3>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <th className="text-left px-5 py-4 font-semibold text-slate-600 dark:text-slate-400">Función</th>
                    <th className="text-center px-5 py-4 font-semibold text-slate-600 dark:text-slate-400">Básico</th>
                    <th className="text-center px-5 py-4 font-semibold text-sky-600 dark:text-sky-400">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Pedidos por mes', basic: '50', pro: 'Ilimitados' },
                    { feature: 'Formulario público', basic: <CheckCircle size={16} className="text-emerald-500 mx-auto" />, pro: <CheckCircle size={16} className="text-emerald-500 mx-auto" /> },
                    { feature: 'Tu marca en el formulario', basic: <span className="text-slate-300 dark:text-slate-600 mx-auto block">—</span>, pro: <CheckCircle size={16} className="text-emerald-500 mx-auto" /> },
                    { feature: 'Métodos de envío', basic: '2', pro: 'Todos' },
                    { feature: 'Dashboard con filtros', basic: <CheckCircle size={16} className="text-emerald-500 mx-auto" />, pro: <CheckCircle size={16} className="text-emerald-500 mx-auto" /> },
                    { feature: 'Control de horarios', basic: <span className="text-slate-300 dark:text-slate-600 mx-auto block">—</span>, pro: <CheckCircle size={16} className="text-emerald-500 mx-auto" /> },
                    { feature: 'Envíos masivos Excel', basic: <span className="text-slate-300 dark:text-slate-600 mx-auto block">—</span>, pro: <CheckCircle size={16} className="text-emerald-500 mx-auto" /> },
                    { feature: 'Exportación a Excel', basic: <CheckCircle size={16} className="text-emerald-500 mx-auto" />, pro: <CheckCircle size={16} className="text-emerald-500 mx-auto" /> },
                    { feature: 'Cambio masivo de estados', basic: <span className="text-slate-300 dark:text-slate-600 mx-auto block">—</span>, pro: <CheckCircle size={16} className="text-emerald-500 mx-auto" /> },
                  ].map((row, i) => (
                    <tr key={row.feature} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{row.feature}</td>
                      <td className="px-5 py-3.5 text-center">{row.basic}</td>
                      <td className="px-5 py-3.5 text-center">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          FOOTER
      ============================================ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            <LogoTori size={22} />
            Tori — tu ayudante fiel
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Tori — Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Crear cuenta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
