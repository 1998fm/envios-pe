import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin, registrarAuditoria } from '@/lib/adminAuth'

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

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  // Resolver la URL de la app de forma robusta:
  // 1. Variable de entorno explícita
  // 2. Host header del request (funciona tanto en Vercel como en local)
  const host = request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (host ? `${proto}://${host}` : '') ||
    new URL(request.url).origin

  const redirectTo = new URL('/dashboard', appUrl).toString()

  // Genera un magic link para iniciar sesión como la empresa objetivo.
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.user.email,
    options: { redirectTo },
  })

  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json(
      { error: error?.message ?? 'No se pudo generar el enlace de acceso.' },
      { status: 500 }
    )
  }

  const token = data.properties.hashed_token
  const link = `${baseUrl}/auth/v1/verify?token=${token}&type=magiclink&redirect_to=${encodeURIComponent(redirectTo)}`

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