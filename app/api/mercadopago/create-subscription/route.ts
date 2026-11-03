import { crearSuscripcion, type Periodo, type PlanPago } from '@/lib/mercadopago'
import { getSessionUser } from '@/lib/ownerAuth'

export async function POST(request: Request) {
  // El usuario sale de la sesión, nunca del body: nadie puede crear una
  // suscripción (y por tanto activar un plan) a nombre de otra cuenta.
  const sesion = await getSessionUser()
  if (!sesion) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }
  if (!sesion.email) {
    return Response.json({ error: 'Tu cuenta no tiene correo' }, { status: 400 })
  }

  const { periodo, plan } = await request.json().catch(() => ({}))

  if (periodo !== 'mensual' && periodo !== 'trimestral') {
    return Response.json({ error: 'Periodo inválido' }, { status: 400 })
  }

  if (plan !== 'pro' && plan !== 'business_plus') {
    return Response.json({ error: 'Plan inválido' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const backUrl = siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')
    ? 'https://tori-efd4b.web.app/dashboard'
    : `${siteUrl}/dashboard`

  try {
    const result = await crearSuscripcion({
      email: sesion.email,
      userId: sesion.id,
      plan: plan as PlanPago,
      periodo: periodo as Periodo,
      backUrl,
    })

    return Response.json({
      init_point: result.init_point,
      preapproval_id: result.id,
    })
  } catch (err) {
    console.error('Error creating MercadoPago subscription:', err)
    return Response.json({ error: 'Error al crear suscripción' }, { status: 500 })
  }
}
