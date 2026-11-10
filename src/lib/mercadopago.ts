import { PRECIOS_PLUS } from '@/lib/planGating'
import MercadoPagoConfig, { PreApproval } from 'mercadopago'

function getClient() {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN no configurado')
  return new MercadoPagoConfig({ accessToken: token })
}

function getPreApproval() {
  return new PreApproval(getClient())
}

export type Periodo = 'mensual' | 'trimestral'
export type PlanPago = 'pro' | 'business_plus'

export type Precio = { label: string; precio: string; valor: number; detalle: string; meses: number }

export const PRECIOS_PLAN: Record<PlanPago, Record<Periodo, Precio>> = {
  pro: {
    mensual: { label: 'Mensual', precio: 'S/ 29.90', valor: 29.90, detalle: '/mes', meses: 1 },
    trimestral: { label: 'Trimestral', precio: 'S/ 79.90', valor: 79.90, detalle: 'cada 3 meses', meses: 3 },
  },
  business_plus: {
    mensual: { label: 'Mensual', precio: 'S/ 49.90', valor: 49.90, detalle: '/mes', meses: 1 },
    trimestral: { label: 'Trimestral', precio: 'S/ 129.90', valor: 129.90, detalle: 'cada 3 meses', meses: 3 },
  },
}

export const PRECIOS = PRECIOS_PLAN.business_plus

export async function crearSuscripcion(params: {
  email: string
  userId: string
  plan: PlanPago
  periodo: Periodo
  backUrl: string
}) {
  if (params.plan !== 'business_plus') throw new Error('El plan Pro ya no está disponible para contratar.')
  const precio = PRECIOS_PLAN.business_plus[params.periodo]
  const preApproval = getPreApproval()

  const result = await preApproval.create({
    body: {
      payer_email: params.email,
      reason: `Tori Plus - ${precio.label}`,
      external_reference: `${params.userId}__${params.plan}`,
      auto_recurring: {
        frequency: PRECIOS_PLUS[params.periodo].meses,
        frequency_type: 'months',
        transaction_amount: precio.valor,
        currency_id: 'PEN',
      },
      back_url: params.backUrl,
    },
  })

  return result
}

export async function obtenerSuscripcion(id: string) {
  const preApproval = getPreApproval()
  const result = await preApproval.get({ id })
  return result
}

export function planDesdeMonto(monto: number): { plan: PlanPago; meses: number } {
  const v = Number(monto) || 0
  if (v >= 129.9) return { plan: 'business_plus', meses: 3 }
  if (v >= 79.9) return { plan: 'pro', meses: 3 }
  if (v >= 49.9) return { plan: 'business_plus', meses: 1 }
  return { plan: 'pro', meses: 1 }
}