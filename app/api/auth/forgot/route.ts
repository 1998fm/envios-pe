import { NextResponse } from 'next/server'
import { clienteAuth, origenPublico } from '@/lib/authServidor'
import { permitir } from '@/lib/rateLimit'

// Pide el correo de recuperación. Responde igual exista o no la cuenta (no se
// usa para averiguar qué correos están registrados).
export async function POST(request: Request) {
  if (!permitir(request, 'forgot', 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Correo no válido' }, { status: 400 })
  }

  const supabase = await clienteAuth()
  const origen = await origenPublico()
  // El enlace del correo vuelve a /auth/callback, que canjea el código por la
  // sesión en el servidor y deja al usuario en /reset-password.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origen}/auth/callback?next=/reset-password`,
  })
  if (error && error.status && error.status >= 500) {
    return NextResponse.json({ error: 'No se pudo enviar el correo. Intenta más tarde.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
