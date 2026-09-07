import { obtenerSuscripcion, planDesdeMonto } from '@/lib/mercadopago'
import { registrarPago } from '@/lib/pagos'
import { WebhookSignatureValidator } from 'mercadopago'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const url = new URL(request.url)

    // Validar firma si está presente.
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const dataId = url.searchParams.get('data.id') || body.data?.id

    if (xSignature && process.env.MP_WEBHOOK_SECRET) {
      try {
        WebhookSignatureValidator.validate({
          xSignature,
          xRequestId,
          dataId: dataId || '',
          secret: process.env.MP_WEBHOOK_SECRET,
          toleranceSeconds: 600,
        })
      } catch {
        return new Response('Invalid signature', { status: 401 })
      }
    }

    // Determinar tópico e ID (soporta formato ?topic=… y body.type/action).
    const action = body.action || body.type || ''
    const topic = (url.searchParams.get('topic') || action || '').toLowerCase()
    const id = url.searchParams.get('id') || body.data?.id || body.id

    if (!id) {
      return new Response('Missing id', { status: 400 })
    }

    // Solo las notificaciones de suscripción (preapproval) modifican planes.
    if (topic.includes('preapproval')) {
      const preapproval = await obtenerSuscripcion(id)
      const [userId, planRef] = String(preapproval.external_reference ?? '').split('__')
      const status = preapproval.status

      if (!userId || (planRef !== 'pro' && planRef !== 'business_plus')) {
        return new Response('Missing external_reference', { status: 400 })
      }

      if (status === 'authorized') {
        const monto = Number(preapproval.auto_recurring?.transaction_amount ?? 0)
        const { meses } = planDesdeMonto(monto)

        // Preferimos next_payment_date (fin del período pagado) como vencimiento.
        const ahora = new Date()
        const proUntil = preapproval.next_payment_date
          ? new Date(preapproval.next_payment_date)
          : new Date(ahora.getTime() + meses * 30 * 864e5)

        await registrarPago({
          userId,
          preapprovalId: id,
          plan: planRef,
          monto,
          meses,
          proUntil,
          origen: 'webhook',
        })
      }

      // En 'cancelled' NO se toca pro_until: el usuario conserva el período
      // ya pagado y checkTrialStatus/cron lo degradan a 'basic' al expirar.
      return new Response('OK', { status: 200 })
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[mp-webhook] error procesando notificación:', err)
    // No tragar el error: devolvemos 500 para que MercadoPago reintente.
    return new Response('Error', { status: 500 })
  }
}

export async function GET() {
  return new Response('OK', { status: 200 })
}