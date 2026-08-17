'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import TourHelpButton from '@/components/TourHelpButton'
import { tourDone, trayectoDone } from '@/lib/tours'
import { useOnboarding } from '@/context/OnboardingContext'
import { FEATURES } from '@/lib/planGating'

type Props = {
  abierto: boolean
  onCerrar: () => void
  planActual: string
  nombreEmpresa?: string
  userId?: string | null
}

const features = FEATURES

const PRECIOS_PLUS = {
  mensual: { precio: 'S/ 49.90', detalle: '/mes' },
  trimestral: { precio: 'S/ 129.90', detalle: 'cada 3 meses' },
}

const PRECIOS_PRO = {
  mensual: { precio: 'S/ 29.90', detalle: '/mes' },
  trimestral: { precio: 'S/ 79.90', detalle: 'cada 3 meses' },
}

export default function ModalUpgrade({ abierto, onCerrar, planActual, nombreEmpresa, userId }: Props) {
  const [periodo, setPeriodo] = useState<'mensual' | 'trimestral'>('mensual')
  const [loading, setLoading] = useState<string | null>(null)
  const isTrial = planActual === 'pro' || planActual === 'business_plus'
  const supabase = createClient()
  const { startTour } = useOnboarding()

  useEffect(() => {
    if (trayectoDone() && !tourDone('modal-upgrade')) {
      const t = setTimeout(() => startTour('modal-upgrade'), 400)
      return () => clearTimeout(t)
    }
  }, [abierto, startTour])

  async function handlePagar(plan: 'pro' | 'business_plus') {
    if (!userId) {
      toast.error('Debes iniciar sesión para continuar')
      return
    }
    setLoading(plan)
    try {
      const res = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, periodo, plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear suscripción')
      if (data.init_point) {
        window.location.href = data.init_point
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al conectar con MercadoPago')
      setLoading(null)
    }
  }

  function RenderFeatureRow({ f, plan }: { f: (typeof features)[number]; plan: 'basic' | 'pro' | 'business_plus' }) {
    const value = f[plan]
    const disponible = value === true || typeof value === 'string'
    if (value === true) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          <span className="text-slate-700 ">{f.label}</span>
        </div>
      )
    }
    if (typeof value === 'string') {
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className="w-4 text-right text-xs font-semibold text-slate-500 shrink-0">{value}</span>
          <span className="text-slate-700 ">{f.label}</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 text-sm">
        <svg className="w-4 h-4 text-slate-300  shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        <span className="text-slate-400 ">{f.label}</span>
      </div>
    )
  }

  const precios = [
    { key: 'mensual' as const, label: 'Mensual' },
    { key: 'trimestral' as const, label: 'Trimestral' },
  ]

  return (
    <Modal open={abierto} maxWidth="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100  shrink-0 bg-white  flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 ">
              Planes
            </h2>
            {nombreEmpresa && (
              <p className="text-sm text-slate-500  mt-1">
                {nombreEmpresa}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TourHelpButton tourId="modal-upgrade" />
            <button onClick={onCerrar} className="p-2 rounded-xl hover:bg-slate-100 :bg-slate-700 text-slate-400 hover:text-slate-600 :text-slate-300 transition-all duration-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 ">
          {isTrial && (
            <div className="mb-6 rounded-2xl bg-amber-50  border border-amber-200  px-4 py-3">
              <p className="text-sm text-amber-800 ">
                Actualmente estás en periodo de prueba gratuita. Al adquirir un plan no perderás los días de prueba restantes.
              </p>
            </div>
          )}

          {planActual === 'basic' && (
            <div className="mb-6 rounded-2xl bg-slate-100  border border-slate-200  px-4 py-3">
              <p className="text-sm text-slate-600 ">
                Estás en el plan <strong>Básico</strong>. Actualiza a Pro o Business Plus y obtén todas las funcionalidades.
              </p>
            </div>
          )}

          <div data-tour="upgrade-periodo" className="flex gap-2 mb-8 bg-slate-200  p-1.5 rounded-2xl w-fit mx-auto">
            {precios.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriodo(p.key)}
                className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  periodo === p.key
                    ? 'bg-white  shadow text-slate-900 '
                    : 'text-slate-500  hover:text-slate-700 :text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div data-tour="upgrade-planes" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-2xl border-2 p-5 bg-white  ${
              planActual === 'basic'
                ? 'border-sky-500  shadow-lg shadow-sky-500/10'
                : 'border-slate-200 '
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 ">Básico</h3>
                {planActual === 'basic' && (
                  <span className="text-[10px] font-bold text-sky-600  bg-sky-50  px-2 py-0.5 rounded-full">Actual</span>
                )}
              </div>
              <p className="text-2xl font-extrabold text-slate-900 ">Gratis</p>
              <div className="mt-5 space-y-3">
                {features.map((f) => (
                  <RenderFeatureRow key={f.label} f={f} plan="basic" />
                ))}
              </div>
            </div>

            <div className={`rounded-2xl border-2 p-5 bg-white  ${
              planActual === 'pro'
                ? 'border-sky-500  shadow-lg shadow-sky-500/10'
                : 'border-slate-200 '
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 ">Pro</h3>
                {planActual === 'pro' && (
                  <span className="text-[10px] font-bold text-sky-600  bg-sky-50  px-2 py-0.5 rounded-full">Actual</span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-extrabold text-slate-900 ">
                  {PRECIOS_PRO[periodo].precio}
                </p>
                <p className="text-xs text-slate-500 ">{PRECIOS_PRO[periodo].detalle}</p>
              </div>
              {periodo === 'trimestral' && (
                <p className="text-[11px] text-green-600 font-semibold mt-1">Ahorras S/ 9.80</p>
              )}
              <div className="mt-5 space-y-3">
                {features.map((f) => (
                  <RenderFeatureRow key={f.label} f={f} plan="pro" />
                ))}
              </div>
              <button
                data-tour="upgrade-pagar"
                onClick={() => handlePagar('pro')}
                disabled={loading !== null}
                className="mt-6 w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'pro' ? 'Redirigiendo a MercadoPago...' : `Pagar ${PRECIOS_PRO[periodo].precio}`}
              </button>
            </div>

            <div className="rounded-2xl border-2 border-transparent p-5 bg-gradient-to-b from-violet-50 to-fuchsia-50   shadow-lg shadow-violet-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0">
                <span className="block text-[10px] font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 rounded-bl-2xl">MÁS COMPLETO</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 ">Business Plus</h3>
                {planActual === 'business_plus' && (
                  <span className="text-[10px] font-bold text-violet-600  bg-violet-50  px-2 py-0.5 rounded-full">Actual</span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-extrabold text-slate-900 ">
                  {PRECIOS_PLUS[periodo].precio}
                </p>
                <p className="text-xs text-slate-500 ">{PRECIOS_PLUS[periodo].detalle}</p>
              </div>
              {periodo === 'trimestral' && (
                <p className="text-[11px] text-green-600 font-semibold mt-1">Ahorras S/ 19.80</p>
              )}
              <div className="mt-5 space-y-3">
                {features.map((f) => (
                  <RenderFeatureRow key={f.label} f={f} plan="business_plus" />
                ))}
              </div>
              <button
                onClick={() => handlePagar('business_plus')}
                disabled={loading !== null}
                className="mt-6 w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-500/20 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'business_plus' ? 'Redirigiendo a MercadoPago...' : `Pagar ${PRECIOS_PLUS[periodo].precio}`}
              </button>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-100  bg-white  p-4 shrink-0 flex justify-center">
          <button
            onClick={onCerrar}
            className="text-sm font-semibold text-slate-500  hover:text-slate-700 :text-slate-300 transition-colors duration-200"
          >
            Seguir en el plan actual
          </button>
        </div>
      </div>
    </Modal>
  )
}