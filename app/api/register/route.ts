import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { email, password, empresa } = await request.json()

  if (!email || !password || !empresa) {
    return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Generar slug base
  const baseSlug = empresa
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

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

  // Crear usuario en Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return Response.json({ error: authError.message }, { status: 400 })
  }

  const userId = authData.user.id

  // Crear perfil
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      empresa,
      slug,
      plan: 'pro',
      trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

  if (profileError) {
    // Rollback: eliminar usuario auth si falla el perfil
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return Response.json({ error: profileError.message }, { status: 500 })
  }

  return Response.json({ ok: true, slug })
}
