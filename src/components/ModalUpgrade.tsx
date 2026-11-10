'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import { FEATURES, PRECIOS_PLUS } from '@/lib/planGating'

type Props = {
  abierto: boolean
  onCerrar: () => void
  planActual: string
  nombreEmpresa?: string
  userId?: string | null
}

export default function ModalUpgrade({ abierto, onCerrar, planActual, nombreEmpresa, userId }: Props) {
  const [periodo, setPeriodo] = useState<'mensual' | 'trimestral'>('mensual')
  const [loading, setLoading] = useState(false)

  async function pagar() {
    if (!userId) return toast.error('Debes iniciar sesión para continuar')
    setLoading(true)
    try {
      const res = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo, plan: 'business_plus' }),
      })
      const data = await res.json()
      if (!res.ok || !data.init_point) throw new Error(data.error || 'No se pudo crear la suscripción')
      window.location.href = data.init_point
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo conectar con MercadoPago')
      setLoading(false)
    }
  }

  return (
    <Modal open={abierto} maxWidth="max-w-4xl">
      <div data-tour="modal-upgrade" className="max-h-[90vh] overflow-y-auto bg-white p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-2xl font-bold text-slate-900">Planes</h2><p className="text-sm text-slate-500">{nombreEmpresa}</p></div>
          <button onClick={onCerrar} aria-label="Cerrar planes" className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div data-tour="upgrade-periodo" className="my-5 flex gap-2" aria-label="Periodo de pago">
          {(['mensual', 'trimestral'] as const).map((p) => (
            <button key={p} onClick={() => setPeriodo(p)} aria-pressed={periodo === p} className={`rounded-xl px-4 py-2 text-sm font-semibold ${periodo === p ? 'bg-tori-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {p === 'mensual' ? 'Mensual' : 'Trimestral · ahorra S/ 19.80'}
            </button>
          ))}
        </div>
        <p className="mb-5 text-sm text-slate-600">Las cuentas nuevas incluyen 14 días de Plus gratis. Al terminar, puedes seguir recibiendo pedidos en Básico y renovar Plus cuando lo necesites.</p>
        <div data-tour="upgrade-planes" className="grid gap-5 md:grid-cols-2">
          {(['basic', 'business_plus'] as const).map((plan) => (
            <div key={plan} className="flex flex-col rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xl font-bold">{plan === 'basic' ? 'Básico' : 'Plus'}{planActual === plan ? ' · Plan actual' : ''}</h3>
              <p className="my-3 text-3xl font-extrabold">{plan === 'basic' ? 'Gratis' : `S/ ${PRECIOS_PLUS[periodo].valor.toFixed(2)}`}</p>
              <p className="mb-4 text-sm text-slate-500">{plan === 'basic' ? 'Recibe y gestiona pedidos individualmente, sin límite mensual.' : periodo === 'mensual' ? 'Pago mensual. Todas las herramientas incluidas.' : 'Pago cada 3 meses. Todas las herramientas incluidas.'}</p>
              <ul className="flex-1 space-y-2">
                {FEATURES.map((f) => (
                  <li key={f.key} className={`flex items-start gap-2 text-sm ${f[plan] === false ? 'text-slate-400' : 'text-slate-700'}`}>
                    {f[plan] === false ? <X size={15} className="mt-0.5 shrink-0" /> : <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />}
                    <span>{f.label}{typeof f[plan] === 'string' ? `: ${f[plan]}` : ''}</span>
                  </li>
                ))}
              </ul>
              {plan === 'business_plus' && <button data-tour="upgrade-pagar" onClick={pagar} disabled={loading} className="mt-5 rounded-xl bg-tori-600 px-4 py-3 font-bold text-white disabled:opacity-50">{loading ? 'Redirigiendo a MercadoPago...' : `Contratar Plus · S/ ${PRECIOS_PLUS[periodo].valor.toFixed(2)}`}</button>}
            </div>
          ))}
        </div>
        <button onClick={onCerrar} className="mt-5 w-full py-2 text-sm font-semibold text-slate-600">Seguir en el plan actual</button>
      </div>
    </Modal>
  )
}
