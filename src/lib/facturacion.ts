import { registrarPago } from '@/lib/pagos'
import { planDesdeMonto } from '@/lib/mercadopago'

// Reconciliación con MercadoPago: recorre las suscripciones y actualiza pro_until
// para toda suscripción autorizada que el webhook haya podido perder.
// Fuente de verdad externa que mantiene facturación al día.
export async function sincronizarPagosMP(): Promise<{ revisadas: number; sincronizadas: number; errores: number }> {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN no configurado')

  const res = await fetch('https://api.mercadopago.com/preapproval/search?limit=100', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`MP search error ${res.status}`)

  const data = (await res.json()) as { results?: any[] }
  const items = data.results ?? []

  let sincronizadas = 0
  let errores = 0

  for (const p of items) {
    if (p.status !== 'authorized') continue
    const [userId, planRef] = String(p.external_reference ?? '').split('__')
    if (!userId || (planRef !== 'pro' && planRef !== 'business_plus')) continue

    const monto = Number(p.auto_recurring?.transaction_amount ?? 0)
    const { meses } = planDesdeMonto(monto)
    const ahora = new Date()
    const proUntil = p.next_payment_date ? new Date(p.next_payment_date) : new Date(new Date(p.date_created ?? ahora).getTime() + meses * 30 * 864e5)

    try {
      await registrarPago({
        userId,
        preapprovalId: p.id,
        plan: planRef,
        monto,
        meses,
        proUntil,
        origen: 'reconciliacion',
      })
      sincronizadas++
    } catch {
      errores++
    }
  }

  return { revisadas: items.length, sincronizadas, errores }
}