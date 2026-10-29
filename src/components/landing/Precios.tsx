'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Check, CheckCircle2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { CountUp, Reveal, SectionHead, Spotlight } from './ui'

const basico = [
  'Hasta 50 envíos al mes',
  'Hasta 2 métodos de envío',
  '50 productos y 100 ventas',
  'Compras y gastos',
  'Etiquetas de envío',
  'Exportar a Shalom (8 al mes)',
]

const pro = [
  '500 envíos al mes',
  '200 productos y 2000 ventas',
  'Todos los métodos de envío',
  'Logo, colores y marca blanca',
  'Tarifas por distrito',
  'Hora de corte, anticipación y cupo diario',
  'Etiquetas de producto con QR',
  'Ganancia por venta',
  'URL de redirección y cambio masivo',
]

const businessPlus = [
  'Envíos, productos y ventas ilimitados',
  'Todos los métodos de envío',
  'Redes sociales en tu formulario',
  'Lector de QR en ventas',
  'Exportar datos a Excel/CSV',
  'Todo lo del plan Pro',
  'Soporte prioritario',
]

type Periodo = 'mensual' | 'trimestral'

// Mismos precios que lib/mercadopago.ts (no se importa de allí: arrastra el SDK de servidor).
const PRECIOS_PLAN = {
  pro: { mensual: { valor: 29.9 }, trimestral: { valor: 79.9 } },
  business_plus: { mensual: { valor: 49.9 }, trimestral: { valor: 129.9 } },
} as const

export default function Precios() {
  const [periodo, setPeriodo] = useState<Periodo>('mensual')
  const trim = periodo === 'trimestral'

  const p = PRECIOS_PLAN.pro[periodo]
  const b = PRECIOS_PLAN.business_plus[periodo]
  const ahorro = (plan: 'pro' | 'business_plus') =>
    Math.round((PRECIOS_PLAN[plan].mensual.valor * 3 - PRECIOS_PLAN[plan].trimestral.valor) * 100) / 100

  return (
    <section id="precios" className="relative bg-tori-50/60 py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead
          center
          eyebrow="Pruébalo sin riesgo"
          title="30 días para descubrir si Tori es para ti."
          sub="Empieza gratis y decide después."
        />

        <Reveal delay={0.1} className="mx-auto mt-10 max-w-4xl">
          <div className="rounded-[2rem] border border-tori-200 bg-white p-7 shadow-sm sm:p-10">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, t: '30 días gratis', c: 'text-tori-600' },
                { icon: ShieldCheck, t: 'Sin tarjeta', c: 'text-emerald-600' },
                { icon: CheckCircle2, t: 'Cancela cuando quieras', c: 'text-tori-600' },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
                  <x.icon size={24} className={`mx-auto ${x.c}`} />
                  <p className="mt-2 font-black text-tori-900">{x.t}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-tori-600 px-8 py-4 font-black text-white shadow-xl shadow-tori-600/25 transition hover:scale-[1.03] hover:bg-tori-700 active:scale-95"
              >
                Probar Tori gratis
                <ArrowRight size={16} className="ml-2" />
              </Link>
              <p className="mt-3 text-xs text-slate-400">Sin tarjeta · Sin compromiso</p>
            </div>
          </div>
        </Reveal>

        {/* selector de periodo */}
        <Reveal className="mt-14 flex flex-col items-center gap-3">
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

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Básico */}
          <Reveal>
            <Spotlight className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <h3 className="text-lg font-bold text-tori-900">Básico</h3>
              <p className="mt-1 text-sm text-slate-500">Para empezar a ordenarte</p>
              <div className="mt-4">
                <span className="text-5xl font-extrabold text-tori-900">Gratis</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Para siempre, después de la prueba</p>
              <ul className="mt-6 flex-1 space-y-2.5">
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
                Probar Pro gratis
              </Link>
            </Spotlight>
          </Reveal>

          {/* Pro */}
          <Reveal delay={0.08}>
            <div className="relative h-full rounded-3xl bg-gradient-to-b from-tori-400 to-tori-700 p-[2px] shadow-2xl shadow-tori-600/25">
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-tori-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                Más popular
              </div>
              <Spotlight className="flex h-full flex-col rounded-[22px] bg-white p-7 sm:p-8" glow="rgba(8,123,192,0.14)">
                <h3 className="mt-2 text-lg font-bold text-tori-900">Pro</h3>
                <p className="mt-1 text-sm text-slate-500">Para negocios en crecimiento</p>
                <div className="mt-4">
                  <div className="flex h-6 items-center gap-2">
                    {!trim && (
                      <>
                        <p className="text-sm text-slate-400 line-through">S/ 39.90</p>
                        <span className="whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          Precio de lanzamiento
                        </span>
                      </>
                    )}
                    {trim && (
                      <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Ahorras S/ {ahorro('pro').toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <CountUp value={p.valor} prefix="S/ " decimals={2} className="text-5xl font-extrabold text-tori-900" />
                    <span className="text-sm font-medium text-slate-500">{trim ? '/3 meses' : '/mes'}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {trim ? `30 días gratis, luego S/ ${p.valor.toFixed(2)} cada 3 meses` : '30 días gratis, luego S/ 29.90/mes'}
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {pro.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={15} className="mt-0.5 shrink-0 text-tori-500" />
                      <span className="font-semibold text-slate-800">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-tori-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-tori-600/25 transition hover:bg-tori-700"
                >
                  Comenzar prueba gratis
                  <ArrowRight size={16} />
                </Link>
              </Spotlight>
            </div>
          </Reveal>

          {/* Business Plus */}
          <Reveal delay={0.16}>
            <div className="relative h-full">
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-violet-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                Negocios que escalan
              </div>
              <Spotlight className="flex h-full flex-col rounded-3xl border border-violet-200 bg-white p-7 shadow-sm sm:p-8" glow="rgba(124,58,237,0.10)">
                <h3 className="mt-2 text-lg font-bold text-tori-900">Business Plus</h3>
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
                <ul className="mt-6 flex-1 space-y-2.5">
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
                  Comenzar prueba gratis
                  <ArrowRight size={16} />
                </Link>
              </Spotlight>
            </div>
          </Reveal>
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          Sin permanencia. Puedes cambiar o cancelar tu plan cuando quieras.
        </p>
      </div>
    </section>
  )
}
