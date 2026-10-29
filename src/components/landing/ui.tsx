'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Caveat } from 'next/font/google'
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'

// Fuente "a mano" para las pequeñas anotaciones (da carácter propio a la marca).
export const mano = Caveat({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' })

/** Aparece suavemente al entrar en pantalla. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Tarjeta con un halo de luz que sigue al cursor. */
export function Spotlight({
  children,
  className = '',
  glow = 'rgba(8,123,192,0.10)',
}: {
  children: ReactNode
  className?: string
  glow?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <div ref={ref} onMouseMove={onMove} className={`group relative overflow-hidden ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(420px circle at var(--mx,50%) var(--my,50%), ${glow}, transparent 45%)` }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

/** Número que "rueda" hasta su nuevo valor cada vez que cambia. */
export function CountUp({
  value,
  prefix = '',
  decimals = 0,
  className,
}: {
  value: number
  prefix?: string
  decimals?: number
  className?: string
}) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 110, damping: 20 })
  const ref = useRef<HTMLSpanElement>(null)
  const fmt = (n: number) =>
    prefix +
    n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  useEffect(() => {
    mv.set(value)
  }, [value, mv])

  useEffect(
    () =>
      spring.on('change', (v) => {
        if (ref.current) ref.current.textContent = fmt(v)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spring, prefix, decimals]
  )

  return (
    <span ref={ref} className={className}>
      {fmt(value)}
    </span>
  )
}

/**
 * Resalta una frase como con marcador fluorescente: una pincelada azul clara
 * detrás del texto que se dibuja de izquierda a derecha. El texto conserva su
 * color (un solo color: sin degradados).
 */
export function Resaltado({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.span
      initial={{ backgroundSize: '0% 100%' }}
      whileInView={{ backgroundSize: '100% 100%' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
      className={`px-1 -mx-1 ${className}`}
      style={{
        backgroundImage: 'linear-gradient(180deg, transparent 58%, #b9e4ff 58%, #b9e4ff 92%, transparent 92%)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '0 0',
        WebkitBoxDecorationBreak: 'clone',
        boxDecorationBreak: 'clone',
      }}
    >
      {children}
    </motion.span>
  )
}

/**
 * Tacha una palabra con un garabato dibujado a mano y escribe encima la
 * corrección, como si alguien hubiera editado el título con un lápiz.
 */
export function Tachado({ children, nota }: { children: ReactNode; nota?: string }) {
  return (
    <span className="relative inline-block">
      <span className="text-slate-400">{children}</span>
      <svg
        aria-hidden
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -left-1 top-[52%] h-[0.5em] w-[calc(100%+0.5rem)] -translate-y-1/2 overflow-visible"
      >
        <motion.path
          d="M4 24 C 30 8, 50 34, 78 18 S 126 6, 150 22 S 186 12, 198 16"
          fill="none"
          stroke="#087bc0"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.9, ease: 'easeInOut' }}
        />
        <motion.path
          d="M10 30 C 46 16, 92 34, 130 14 S 176 26, 196 10"
          fill="none"
          stroke="#087bc0"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.75"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1.5, ease: 'easeInOut' }}
        />
      </svg>
      {nota && (
        <motion.span
          initial={{ opacity: 0, y: 6, rotate: -8 }}
          whileInView={{ opacity: 1, y: 0, rotate: -6 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 1.9 }}
          className={`${mano.className} pointer-events-none absolute -top-[0.55em] left-[8%] whitespace-nowrap text-[0.62em] font-bold leading-none text-tori-600`}
        >
          {nota}
        </motion.span>
      )}
    </span>
  )
}

/** Encabezado de sección con el mismo ritmo en toda la página. */
export function SectionHead({
  eyebrow,
  title,
  sub,
  center = false,
}: {
  eyebrow: string
  title: ReactNode
  sub?: ReactNode
  center?: boolean
}) {
  return (
    <Reveal className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <span className="inline-flex items-center gap-2 rounded-full border border-tori-200 bg-tori-50 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-tori-700">
        <span className="h-1.5 w-1.5 rounded-full bg-tori-500" />
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-black leading-[1.1] tracking-tight text-tori-900 sm:text-5xl">{title}</h2>
      {sub && <p className="mt-5 text-lg leading-relaxed text-slate-600">{sub}</p>}
    </Reveal>
  )
}

/** Tarjeta clara estándar. */
export const panel = 'rounded-3xl border border-slate-200 bg-white shadow-sm'
