import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/adminAuth'
import { clienteAuth, origenPublico } from '@/lib/authServidor'

// "Entrar como" una empresa (solo super admin). El enlace que genera
// /api/admin/empresas/[id]/impersonate apunta aquí: el token se canjea en el
// servidor por una sesión (cookies httpOnly) y además exige que quien abre el
// enlace sea un super admin con sesión, así un enlace filtrado no sirve.
export async function GET(request: Request) {
  const origen = await origenPublico()
  const admin = await requireSuperAdmin()
  if (!admin.ok) return NextResponse.redirect(`${origen}/login`)

  const tokenHash = new URL(request.url).searchParams.get('token_hash')
  if (!tokenHash) return NextResponse.redirect(`${origen}/admin`)

  const supabase = await clienteAuth()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  if (error) return NextResponse.redirect(`${origen}/admin?impersonar=error`)
  return NextResponse.redirect(`${origen}/dashboard`)
}
