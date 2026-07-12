import { crearSuscripcion, type Periodo } from '@/lib/mercadopago'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { userId, periodo } = await request.json()

  if (!userId || !periodo) {
    return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  if (periodo !== 'mensual' && periodo !== 'trimestral') {
    return Response.json({ error: 'Periodo inválido' }, { status: 400 })
  }

  // Obtener email del usuario
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (userError || !userData?.user?.email) {
    return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const backUrl = siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')
    ? 'https://tori-efd4b.web.app/dashboard'
    : `${siteUrl}/dashboard`

  try {
    const result = await crearSuscripcion({
      email: userData.user.email,
      userId,
      periodo: periodo as Periodo,
      backUrl,
    })

    return Response.json({
      init_point: result.init_point,
      preapproval_id: result.id,
    })
  } catch (err: any) {
    console.error('Error creating MercadoPago subscription:', err)
    return Response.json({ error: err.message || 'Error al crear suscripción' }, { status: 500 })
  }
}
