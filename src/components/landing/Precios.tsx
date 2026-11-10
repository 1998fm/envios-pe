'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PRECIOS_PLUS } from '@/lib/planGating'
import { CountUp, Reveal, SectionHead, Spotlight } from './ui'

const basico = [
  'Solicitudes de pedidos ilimitadas',
  'Formulario para tus clientes',
  'Hasta 2 métodos de envío',
  'Búsqueda y filtros de pedidos',
  'Validación y gestión individual de pedidos',
  'Configuración básica de tu negocio',
]

const businessPlus = [
  'Todo lo de Básico',
  'Productos, inventario, ventas, compras y gastos',
  'Resumen y reportes de tu negocio',
  'Copiar datos y exportar Excel/CSV',
  'Etiquetas de envío y de producto con QR',
  'Shalom Pro y cambios masivos',
  'Todos los métodos de envío',
  'Logo, redes sociales y marca blanca',
  'Tarifas por distrito y control logístico',
  'Lector QR y hasta 4 miembros del equipo',
]

type Periodo = 'mensual' | 'trimestral'

const PRECIOS_PLAN = { business_plus: PRECIOS_PLUS }

export default function Precios() {
  const [periodo, setPeriodo] = useState<Periodo>('mensual')
  const trim = periodo === 'trimestral'

  const b = PRECIOS_PLAN.business_plus[periodo]
  const ahorro = (plan: 'business_plus') =>
    Math.round((PRECIOS_PLAN[plan].mensual.valor * 3 - PRECIOS_PLAN[plan].trimestral.valor) * 100) / 100

  return (
    <section id="precios" className="relative bg-tori-50/60 py-14 sm:py-20">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead
          center
          eyebrow="Pruébalo sin riesgo"
          title="Empieza gratis. Crece con Plus."
          sub="Prueba Plus durante 14 días, sin tarjeta. Después elige cómo seguir."
        />

        {/* selector de periodo */}
        <Reveal className="mt-7 flex flex-col items-center gap-3">
          <div className="relative flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {(['mensual', 'trimestral'] as Periodo[]).map((o) => (
              <button
                key={o}
                onClick={() => setPeriodo(o)}
                className={`relative cursor-pointer rounded-full px-6 py-2 text-sm font-bold capitalize transition-colors ${
                  periodo === o ? 'text-white' : 'text-slate-500 hover:text-tori-700'
                }`}
              >
                {periodo === o && (
                  <motion.span
                    layoutId="periodo-pill"
                    className="absolute inset-0 rounded-full bg-tori-600"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{o}</span>
              </button>
            ))}
          </div>
          <p className="h-4 text-xs font-semibold text-emerald-600">
            {trim ? 'Pagando cada 3 meses ahorras en cada plan' : ''}
          </p>
        </Reveal>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Básico */}
          <Reveal>
            <Spotlight className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <h3 className="text-lg font-bold text-tori-900">Básico</h3>
              <p className="mt-1 text-sm text-slate-500">Recibe y gestiona tus pedidos</p>
              <div className="mt-4">
                <span className="text-5xl font-extrabold text-tori-900">Gratis</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Sin límite mensual de solicitudes</p>
              <ul className="mt-5 flex-1 space-y-2">
                {basico.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check size={15} className="mt-0.5 shrink-0 text-tori-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-7 flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-tori-900 transition hover:border-tori-400 hover:bg-tori-50"
              >
                Probar Plus gratis
              </Link>
            </Spotlight>
          </Reveal>

          {/* Plus */}
          <Reveal delay={0.16}>
            <div className="relative h-full">
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-violet-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                Todas las herramientas
              </div>
              <Spotlight className="flex h-full flex-col rounded-3xl border border-violet-200 bg-white p-6 shadow-sm sm:p-7" glow="rgba(124,58,237,0.10)">
                <h3 className="mt-2 text-lg font-bold text-tori-900">Plus</h3>
                <p className="mt-1 text-sm text-slate-500">Ilimitado y con herramientas avanzadas</p>
                <div className="mt-4">
                  <div className="flex h-6 items-center">
                    {trim && (
                      <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Ahorras S/ {ahorro('business_plus').toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <CountUp value={b.valor} prefix="S/ " decimals={2} className="text-5xl font-extrabold text-tori-900" />
                    <span className="text-sm font-medium text-slate-500">{trim ? '/3 meses' : '/mes'}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {trim ? 'Pago cada 3 meses' : `O S/ ${PRECIOS_PLAN.business_plus.trimestral.valor.toFixed(2)} cada 3 meses`}
                </p>
                <ul className="mt-5 flex-1 space-y-2">
                  {businessPlus.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={15} className="mt-0.5 shrink-0 text-violet-500" />
                      <span className="font-semibold text-slate-800">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700"
                >
                  Probar Plus gratis
                  <ArrowRight size={16} />
                </Link>
              </Spotlight>
            </div>
          </Reveal>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sin tarjeta para probar. Puedes continuar en Básico gratis al terminar los 14 días.
        </p>
      </div>
    </section>
  )
}
