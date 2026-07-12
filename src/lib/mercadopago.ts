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

export const PRECIOS: Record<Periodo, { label: string; precio: string; valor: number; detalle: string; meses: number }> = {
  mensual: { label: 'Mensual', precio: 'S/ 29.90', valor: 29.90, detalle: '/mes', meses: 1 },
  trimestral: { label: 'Trimestral', precio: 'S/ 79.90', valor: 79.90, detalle: 'cada 3 meses', meses: 3 },
}

export async function crearSuscripcion(params: {
  email: string
  userId: string
  periodo: Periodo
  backUrl: string
}) {
  const precio = PRECIOS[params.periodo]
  const preApproval = getPreApproval()

  const result = await preApproval.create({
    body: {
      payer_email: params.email,
      reason: `Tori Pro - ${precio.label}`,
      external_reference: params.userId,
      auto_recurring: {
        frequency: 1,
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
