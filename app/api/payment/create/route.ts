import { createClient } from '@supabase/supabase-js'

// Crear cliente de Supabase con el service role key para operaciones de admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId, planType } = await request.json()

    if (!userId || !planType) {
      return Response.json({ error: 'Faltan parámetros: userId y planType' }, { status: 400 })
    }

    // Validar que el plan sea válido
    const planesValidos: ('pro' | 'basic')[] = ['pro', 'basic']
    if (!planesValidos.includes(planType)) {
      return Response.json({ error: 'Plan no válido' }, { status: 400 })
    }

    // Obtener email del usuario desde la tabla profiles
    const { data: userData } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (!userData || !userData.email) {
      return Response.json({ error: 'No se pudo obtener el email del usuario' }, { status: 400 })
    }

    // Configurar MercadoPago
    // Nota: En producción, configurar con las credenciales reales
    const mercadopago = require('mercadopago')
    mercadopago.configure({
      access_token: process.env.MP_ACCESS_TOKEN
    })

    // Determinar precio según el plan
    const precio = planType === 'pro' ? 2990 : 990 // Precios en pesos mexicanos
    const nombrePlan = planType === 'pro' ? 'Plan Pro' : 'Plan Basic'

    // Crear preferencia de pago
    const preference = {
      items: [
        {
          id: `plan_${planType}`,
          title: nombrePlan,
          quantity: 1,
          unit_price: precio,
          description: planType === 'pro'
            ? 'Plan Pro - 30 días ilimitados'
            : 'Plan Basic - 50 envíos mensuales'
        }
      ],
      payer: {
        email: userData.user.email || '',
        first_name: userData.user.user_metadata?.first_name || '',
        last_name: userData.user.user_metadata?.last_name || ''
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?plan=${planType}`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/pending`
      },
      auto_return: 'all',
      metadata: {
        userId: userId,
        planType: planType
      }
    }

    const preferenceResponse = await mercadopago.preferences.create({
      body: preference
    })

    return Response.json({
      ok: true,
      initPoint: preferenceResponse.body.init_point,
      preferenceId: preferenceResponse.body.id
    })
  } catch (error: any) {
    console.error('Error creating payment:', error)
    return Response.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}