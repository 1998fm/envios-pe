'use client'

import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, Check, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import LogoTori from '@/components/LogoTori'
import ToriMascot from '@/components/ToriMascot'
import FAQ from '@/components/landing/FAQ'
import FeaturesSection from '@/components/landing/FeaturesSection'
import Pasos from '@/components/landing/Pasos'
import PedidoDemo from '@/components/landing/PedidoDemo'
import Precios from '@/components/landing/Precios'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import { Reveal, Resaltado } from '@/components/landing/ui'

const navLinks = [
  { label: 'Cómo funciona', href: '#solucion', id: 'solucion' },
  { label: 'Soluciones', href: '#funciones', id: 'funciones' },
  { label: 'Historias', href: '#historias', id: 'historias' },
  { label: 'Precios', href: '#precios', id: 'precios' },
]

/** Botón que se inclina levemente hacia el cursor. */
function BotonMagnetico({ href, children, className }: { href: string; children: React.ReactNode; className: string }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18 })
  const sy = useSpring(y, { stiffness: 220, damping: 18 })

  function mover(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * 0.22)
    y.set((e.clientY - (r.top + r.height / 2)) * 0.3)
  }
  function soltar() {
    x.set(0)
    y.set(0)
  }

  return (
    <div onMouseMove={mover} onMouseLeave={soltar} className="inline-block p-3">
      <motion.div style={{ x: sx, y: sy }}>
        <Link href={href} className={className}>
          {children}
        </Link>
      </motion.div>
    </div>
  )
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSticky, setShowSticky] = useState(false)
  const [seccion, setSeccion] = useState('')
  const heroRef = useRef<HTMLElement>(null)

  // Barra de progreso de lectura
  const { scrollYProgress } = useScroll()
  const progreso = useSpring(scrollYProgress, { stiffness: 120, damping: 28 })

  // Parallax suave del héroe
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(heroScroll, [0, 1], [0, 60])

  // Luz que sigue al cursor (solo con puntero fino)
  const cx = useMotionValue(-400)
  const cy = useMotionValue(-400)
  const lx = useSpring(cx, { stiffness: 90, damping: 22 })
  const ly = useSpring(cy, { stiffness: 90, damping: 22 })

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    const fino = window.matchMedia('(pointer: fine)').matches
    const onMove = (e: PointerEvent) => {
      cx.set(e.clientX - 250)
      cy.set(e.clientY - 250)
    }
    if (fino) window.addEventListener('pointermove', onMove, { passive: true })

    // Sección activa para resaltar el menú
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSeccion(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    )
    navLinks.forEach((l) => {
      const el = document.getElementById(l.id)
      if (el) obs.observe(el)
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
      obs.disconnect()
    }
  }, [cx, cy])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white pb-20 text-slate-700 antialiased lg:pb-0">
      {/* fondo claro: cuadrícula suave y luces azules */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(185,228,255,0.55),transparent_60%)]" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(8,123,192,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(8,123,192,0.06) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black 15%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 15%, transparent 70%)',
        }}
      />
      <motion.div
        aria-hidden
        style={{ x: lx, y: ly }}
        className="pointer-events-none fixed left-0 top-0 z-0 hidden h-[500px] w-[500px] rounded-full bg-tori-300/20 blur-3xl lg:block"
      />

      <div className="relative z-10">
        {/* ============ NAV ============ */}
        <header className="fixed inset-x-0 top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6">
            <nav className="relative flex h-16 items-center justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 px-4 shadow-md shadow-tori-900/5 backdrop-blur-xl sm:px-6">
              <Link href="#inicio" className="flex items-center gap-2 text-xl font-black text-tori-700">
                <LogoTori size={36} />
                Tori
              </Link>

              <div className="hidden items-center gap-1 md:flex">
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      seccion === l.id ? 'text-tori-700' : 'text-slate-500 hover:text-tori-700'
                    }`}
                  >
                    {seccion === l.id && (
                      <motion.span
                        layoutId="nav-activo"
                        className="absolute inset-0 rounded-full bg-tori-50"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative">{l.label}</span>
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden px-3 text-sm font-semibold text-slate-500 transition-colors hover:text-tori-700 lg:inline-flex"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="hidden items-center justify-center rounded-xl bg-tori-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-tori-600/25 transition hover:bg-tori-700 sm:inline-flex"
                >
                  Probar Plus
                </Link>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
                  aria-label="Menú"
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>

              <motion.div
                style={{ scaleX: progreso, transformOrigin: 'left' }}
                className="absolute inset-x-0 bottom-0 h-[2px] bg-tori-500"
              />
            </nav>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-xl md:hidden"
                >
                  <div className="flex flex-col">
                    {navLinks.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        onClick={() => setMenuOpen(false)}
                        className="px-2 py-2.5 text-sm font-semibold text-slate-700 hover:text-tori-700"
                      >
                        {l.label}
                      </a>
                    ))}
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="px-2 py-2.5 text-sm font-semibold text-slate-700 hover:text-tori-700"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="mt-2 flex items-center justify-center rounded-xl bg-tori-600 px-5 py-2.5 text-sm font-bold text-white"
                    >
                      Probar Plus
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ============ HERO ============ */}
        <section ref={heroRef} id="inicio" className="relative overflow-hidden pb-14 pt-28 sm:pb-20 sm:pt-36">
          <motion.div
            style={{ y: heroY }}
            className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]"
          >
            <div>
              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-tori-200 bg-white px-3 py-1.5 text-xs font-bold text-tori-700 shadow-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Para emprendedores que venden por WhatsApp
              </motion.div>

              <motion.h1
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl font-black leading-[1.12] tracking-tight text-tori-900 sm:text-5xl lg:text-6xl"
              >
                Vende por WhatsApp.<br />
                Recibe tus pedidos <Resaltado>en orden.</Resaltado>
              </motion.h1>

              <motion.p
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl"
              >
                Comparte tu formulario con tus clientes y recibe sus datos organizados en un solo panel.
                <strong className="text-tori-900"> Con Plus, también controla tus ventas, inventario y gastos.</strong>
              </motion.p>

              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-tori-600 px-6 py-3.5 font-extrabold text-white shadow-xl shadow-tori-600/25 transition hover:scale-[1.03] hover:bg-tori-700 active:scale-95"
                >
                  Probar Plus gratis
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#solucion"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-tori-900 transition hover:border-tori-400 hover:bg-tori-50"
                >
                  Ver cómo funciona
                </a>
              </motion.div>

              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"
              >
                {['14 días gratis', 'Sin tarjeta', 'Después, Básico gratis'].map((b) => (
                  <span key={b} className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-500" />
                    {b}
                  </span>
                ))}
              </motion.div>

              <p className="mt-5 max-w-md text-sm text-slate-500">
                El cliente completa tu formulario. No necesitas conectar tu WhatsApp.
              </p>
            </div>

            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="px-1 sm:px-6"
            >
              <PedidoDemo />
            </motion.div>
          </motion.div>
        </section>

        <Pasos />
        <FeaturesSection />
        <TestimonialsSection />
        <Precios />
        <FAQ />

        {/* ============ CTA FINAL ============ */}
        <section className="relative overflow-hidden py-14 sm:py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-tori-700 via-tori-600 to-tori-500" />
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-tori-300/30 blur-3xl" />
          <div className="relative mx-auto max-w-4xl px-4 text-center text-white sm:px-6">
            <Reveal>
              <div className="flex justify-center">
                <ToriMascot variant="happy" size={88} />
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Tú encárgate de vender.</h2>
              <p className="mt-4 text-xl text-white/90 sm:text-2xl">
                Tori te ayuda a que los pedidos y todo lo demás estén en orden.
              </p>
              <div className="mt-6">
                <BotonMagnetico
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 font-black text-tori-700 shadow-2xl transition hover:bg-tori-50"
                >
                  Probar Plus gratis
                  <ArrowRight size={16} className="ml-2" />
                </BotonMagnetico>
              </div>
              <p className="text-sm text-white/80">14 días de Plus sin tarjeta. Después puedes seguir en Básico gratis.</p>
            </Reveal>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="border-t border-slate-200 bg-slate-50 py-10 text-slate-500">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2 font-black text-tori-700">
                  <LogoTori size={28} />
                  Tori
                </div>
                <p className="mt-2 max-w-xs text-sm">
                  Tu compañero de negocio para trabajar con más orden y tranquilidad.
                </p>
              </div>
              <div className="flex gap-8 text-sm">
                <ul className="space-y-2">
                  <li className="text-xs font-bold uppercase tracking-wider text-tori-900">Producto</li>
                  <li><a href="#solucion" className="transition-colors hover:text-tori-700">Cómo funciona</a></li>
                  <li><a href="#funciones" className="transition-colors hover:text-tori-700">Soluciones</a></li>
                  <li><a href="#historias" className="transition-colors hover:text-tori-700">Historias</a></li>
                  <li><a href="#precios" className="transition-colors hover:text-tori-700">Precios</a></li>
                </ul>
                <ul className="space-y-2">
                  <li className="text-xs font-bold uppercase tracking-wider text-tori-900">Acceso</li>
                  <li><Link href="/login" className="transition-colors hover:text-tori-700">Iniciar sesión</Link></li>
                  <li><Link href="/register" className="transition-colors hover:text-tori-700">Comenzar gratis</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-6 sm:flex-row">
              <p className="text-xs">© {new Date().getFullYear()} Tori</p>
              <a href="#inicio" className="text-xs transition-colors hover:text-tori-700">Ir arriba</a>
            </div>
          </div>
        </footer>

        {/* ============ CTA FIJA (móvil) ============ */}
        <AnimatePresence>
          {showSticky && (
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-x-3 bottom-3 z-40 md:hidden"
            >
              <Link
                href="/register"
                className="flex items-center justify-center rounded-2xl bg-tori-600 py-3.5 font-black text-white shadow-2xl shadow-tori-900/30"
              >
                Probar Plus gratis
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
