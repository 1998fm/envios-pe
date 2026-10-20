import { createClient } from '@supabase/supabase-js'

// Crear cliente de Supabase con el service role key para operaciones de admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { planType, userId } = await request.json()

    if (!userId || !planType) {
      return Response.json({ error: 'Faltan parámetros: userId y planType' }, { status: 400 })
    }

    // Validar que el plan sea válido
    const planesValidos: ('pro' | 'basic')[] = ['pro', 'basic']
    if (!planesValidos.includes(planType)) {
      return Response.json({ error: 'Plan no válido' }, { status: 400 })
    }

    // Fecha de expiración: 30 días desde ahora
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 30)
    const proUntilISO = expirationDate.toISOString()

    // 1. Actualizar el perfil del usuario en la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: planType,
        pro_until: proUntilISO,
        // También podríamos actualizar otros campos según sea necesario
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return Response.json({ error: 'Error al actualizar perfil del usuario' }, { status: 500 })
    }

    // 2. Opcional: También podríamos actualizar en auth.users si es necesario
    // const { error: authError } = await supabase.auth.admin.updateUser(userId, {
    //   // ... actualizaciones de auth
    // })

    return Response.json({
      ok: true,
      message: 'Tu plan ha sido actualizado correctamente. Ya puedes comenzar a usar todas las funciones.',
      plan: planType,
      // proUntil se incluye en la respuesta para el frontend
      proUntil: proUntilISO
    })
  } catch (error: any) {
    console.error('Error en webhook de pago:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}