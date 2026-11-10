import { DIAS_PRUEBA_PLUS } from '@/lib/planGating'
import { createClient } from '@supabase/supabase-js'
import { permitir } from '@/lib/rateLimit'
import { supabaseServiceKey, supabaseUrl } from '@/lib/supabaseEnv'
import { mensajeAuth } from '@/lib/erroresEs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    supabaseUrl(),
    supabaseServiceKey()
  )
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const empresa = typeof body.empresa === 'string' ? body.empresa.trim() : ''

  if (!email || !password || !empresa) {
    return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: 'Correo no válido' }, { status: 400 })
  }
  if (password.length < 8 || password.length > 72) {
    return Response.json(
      { error: 'La contraseña debe tener entre 8 y 72 caracteres' },
      { status: 400 }
    )
  }
  if (empresa.length > 80) {
    return Response.json({ error: 'El nombre del negocio es demasiado largo' }, { status: 400 })
  }

  // Registro abierto al público: se limita por IP para frenar altas masivas. Va
  // DESPUÉS de las validaciones baratas: un dato mal escrito no gasta el cupo.
  if (!permitir(request, 'register', 5, 60 * 60 * 1000)) {
    return Response.json(
      { error: 'Demasiados registros desde esta conexión. Intenta más tarde.' },
      { status: 429 }
    )
  }

  // Generar slug base
  const baseSlug =
    empresa
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'negocio'

  // Buscar slug único
  let slug = baseSlug
  let intentos = 0
  while (intentos < 20) {
    const { data: existente } = await supabaseAdmin
      .from('profiles')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()
    if (!existente) break
    intentos++
    slug = `${baseSlug}-${intentos}`
  }
  if (intentos >= 20) {
    return Response.json({ error: 'No se pudo generar un slug único' }, { status: 409 })
  }

  // Crear usuario en Auth ya confirmado: la app no envía correos (el límite de la
  // cuenta gratuita de Supabase es de pocos por hora). El freno contra altas masivas
  // es el límite por IP de arriba.
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    const yaExiste = authError?.code === 'email_exists' || /already|registered/i.test(authError?.message ?? '')
    return Response.json(
      { error: yaExiste ? 'No se pudo crear la cuenta con ese correo' : authError ? mensajeAuth(authError) : 'No se pudo crear la cuenta' },
      { status: 400 }
    )
  }

  const userId = authData.user.id

  // Crear perfil
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      empresa,
      slug,
      plan: 'business_plus',
      trial_end: new Date(Date.now() + DIAS_PRUEBA_PLUS * 24 * 60 * 60 * 1000).toISOString(),
    })

  if (profileError) {
    // Rollback: eliminar usuario auth si falla el perfil
    await supabaseAdmin.auth.admin.deleteUser(userId)
    console.error('[register] error creando perfil:', profileError)
    return Response.json({ error: 'No se pudo crear la cuenta' }, { status: 500 })
  }

  return Response.json({ ok: true, slug })
}
