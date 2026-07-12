import { obtenerSuscripcion } from '@/lib/mercadopago'
import { WebhookSignatureValidator } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const url = new URL(request.url)

    // Validar firma si está presente
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

    // Determinar tópico e ID
    const action = body.action || body.type || ''
    const topic = url.searchParams.get('topic') || action.split('.')[0]
    const id = url.searchParams.get('id') || body.data?.id || body.id

    if (!id) {
      return new Response('Missing id', { status: 400 })
    }

    // Procesar notificaciones de suscripción
    if (topic === 'preapproval') {
      const preapproval = await obtenerSuscripcion(id)

      const userId = preapproval.external_reference
      const status = preapproval.status

      if (!userId) {
        return new Response('Missing external_reference', { status: 400 })
      }

      if (status === 'authorized') {
        const monto = preapproval.auto_recurring?.transaction_amount ?? 29.90
        const meses = monto >= 70 ? 3 : 1
        const proUntil = new Date()
        proUntil.setMonth(proUntil.getMonth() + meses)

        await supabaseAdmin
          .from('profiles')
          .update({
            plan: 'pro',
            pro_until: proUntil.toISOString(),
          })
          .eq('id', userId)
      }

      if (status === 'cancelled') {
        await supabaseAdmin
          .from('profiles')
          .update({ pro_until: null })
          .eq('id', userId)
      }
    }

    return new Response('OK', { status: 200 })
  } catch {
    return new Response('OK', { status: 200 })
  }
}

export async function GET(request: Request) {
  return new Response('OK', { status: 200 })
}
