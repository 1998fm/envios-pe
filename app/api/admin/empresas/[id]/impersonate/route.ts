import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin, registrarAuditoria } from '@/lib/adminAuth'
import { origenPublico } from '@/lib/authServidor'
import { mensajeDb } from '@/lib/erroresEs'
import { mensajeAuth } from '@/lib/erroresEs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  const { data: user } = await supabaseAdmin.auth.admin.getUserById(id)
  if (!user?.user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }
  if (!user.user.email) {
    return NextResponse.json({ error: 'El usuario no tiene email vinculado.' }, { status: 400 })
  }

  // No permitir impersonar al propio admin.
  if (id === auth.userId) {
    return NextResponse.json({ error: 'No puedes entrar como tu mismo.' }, { status: 400 })
  }

  // El enlace apunta a NUESTRO servidor (/auth/impersonar), no al de la base:
  // el navegador nunca ve la dirección del servicio de autenticación.
  const appUrl = await origenPublico()
  const redirectTo = new URL('/dashboard', appUrl).toString()

  // Genera un magic link para iniciar sesión como la empresa objetivo.
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.user.email,
    options: { redirectTo },
  })

  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json(
      { error: (error ? mensajeAuth(error) : 'No se pudo generar el enlace de acceso.') },
      { status: 500 }
    )
  }

  const token = data.properties.hashed_token
  const link = `${appUrl}/auth/impersonar?token_hash=${encodeURIComponent(token)}`

  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa, slug')
    .eq('id', id)
    .maybeSingle()

  await registrarAuditoria(auth, 'impersonar', {
    empresaId: id,
    empresa: perfil?.empresa,
    slug: perfil?.slug,
  })

  return NextResponse.json({ ok: true, link, slug: perfil?.slug ?? null })
}