import { NextResponse } from 'next/server'
import { clienteAuth } from '@/lib/authServidor'
import { permitir } from '@/lib/rateLimit'
import { mensajeAuth } from '@/lib/erroresEs'

// Inicio de sesión. La sesión queda en cookies httpOnly; el navegador nunca ve
// los tokens ni habla directo con el servicio de autenticación.
export async function POST(request: Request) {
  // Contra fuerza bruta: 10 intentos cada 10 minutos por IP.
  if (!permitir(request, 'login', 10, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password || email.length > 254 || password.length > 200) {
    return NextResponse.json({ error: 'Ingresa tu correo y contraseña' }, { status: 400 })
  }

  const supabase = await clienteAuth()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return NextResponse.json({ error: mensajeAuth(error) }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
