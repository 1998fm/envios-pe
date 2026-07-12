'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { createClient } from 'app/f/[slug]/lib/supabase/client'

type Props = {
  abierto: boolean
  onCerrar: () => void
  planActual: string
  nombreEmpresa?: string
  userId?: string | null
}

const features = [
  { label: 'Envíos mensuales', basic: '50', pro: 'Ilimitados' },
  { label: 'Métodos de envío', basic: 'Hasta 2', pro: 'Ilimitados' },
  { label: 'Logo personalizado', basic: false, pro: true },
  { label: 'Redes sociales en formulario', basic: false, pro: true },
  { label: 'URL de redirección', basic: false, pro: true },
  { label: 'Control logístico', basic: false, pro: true },
  { label: 'Tarifas por distrito', basic: false, pro: true },
  { label: 'Cambio masivo de estados', basic: false, pro: true },
  { label: 'Marca blanca en formulario', basic: false, pro: true },
]

export default function ModalUpgrade({ abierto, onCerrar, planActual, nombreEmpresa, userId }: Props) {
  const [periodo, setPeriodo] = useState<'mensual' | 'trimestral'>('mensual')
  const [loading, setLoading] = useState(false)
  const isTrial = planActual === 'pro'
  const supabase = createClient()

  const precios = {
    mensual: { label: 'Mensual', precio: 'S/ 29.90', detalle: '/mes', valor: 29.90 },
    trimestral: { label: 'Trimestral', precio: 'S/ 79.90', detalle: 'cada 3 meses', valor: 79.90 },
  }

  async function handlePagar() {
    if (!userId) {
      toast.error('Debes iniciar sesión para continuar')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, periodo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear suscripción')
      if (data.init_point) {
        window.location.href = data.init_point
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al conectar con MercadoPago')
      setLoading(false)
    }
  }

  return (
    <Modal open={abierto} maxWidth="max-w-3xl">
      <div className="flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Planes
            </h2>
            {nombreEmpresa && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {nombreEmpresa}
              </p>
            )}
          </div>
          <button onClick={onCerrar} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
          {isTrial && (
            <div className="mb-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Actualmente estás en periodo de prueba gratuita. Al adquirir Pro no perderás los días de prueba restantes.
              </p>
            </div>
          )}

          {planActual === 'basic' && (
            <div className="mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Estás en el plan <strong>Básico</strong>. Actualiza a Pro y obtén todas las funcionalidades.
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-8 bg-slate-200 dark:bg-slate-700 p-1.5 rounded-2xl w-fit mx-auto">
            {(['mensual', 'trimestral'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  periodo === p
                    ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {precios[p].label}
                <span className="block text-[10px] font-normal">{precios[p].precio}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-2xl border-2 p-5 bg-white dark:bg-slate-800 ${
              planActual === 'basic'
                ? 'border-sky-500 dark:border-sky-400 shadow-lg shadow-sky-500/10'
                : 'border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Básico</h3>
                {planActual === 'basic' && (
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-full">Actual</span>
                )}
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Gratis</p>
              <div className="mt-5 space-y-3">
                {features.map((f) => (
                  <div key={f.label} className="flex items-center gap-2 text-sm">
                    {f.basic === true ? (
                      <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    ) : f.basic === false ? (
                      <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                      <span className="w-4 text-right text-xs font-semibold text-slate-500 shrink-0">{f.basic}</span>
                    )}
                    <span className={`${f.basic === false ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-transparent p-5 bg-gradient-to-b from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 shadow-lg shadow-sky-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0">
                <span className="block text-[10px] font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-1 rounded-bl-2xl">RECOMENDADO</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pro</h3>
                {planActual === 'pro' && (
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-full">Actual</span>
                )}
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {periodo === 'mensual' ? 'S/ 29.90' : 'S/ 79.90'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {periodo === 'mensual' ? 'por mes' : 'cada 3 meses'}
                </p>
                {periodo === 'trimestral' && (
                  <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold mt-1">Ahorras S/ 9.80</p>
                )}
              </div>
              <div className="mt-5 space-y-3">
                {features.map((f) => (
                  <div key={f.label} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    {f.pro === true ? (
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{f.label}</span>
                    ) : (
                      <>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{f.pro}</span>
                        <span className="text-slate-500 dark:text-slate-400"> {f.label.toLowerCase()}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handlePagar}
                disabled={loading}
                className="mt-6 w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Redirigiendo a MercadoPago...' : `Pagar ${periodo === 'mensual' ? 'S/ 29.90' : 'S/ 79.90'}`}
              </button>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shrink-0 flex justify-center">
          <button
            onClick={onCerrar}
            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200"
          >
            Seguir en el plan actual
          </button>
        </div>
      </div>
    </Modal>
  )
}
