import { NextResponse } from 'next/server'
import { clienteAuth } from '@/lib/authServidor'
import { getSessionUser } from '@/lib/ownerAuth'
import { permitir } from '@/lib/rateLimit'
import { mensajeAuth } from '@/lib/erroresEs'

// Cambia la contraseña del usuario con sesión (tras abrir el enlace del correo).
export async function POST(request: Request) {
  if (!permitir(request, 'password', 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
  }
  const sesion = await getSessionUser()
  if (!sesion) {
    return NextResponse.json({ error: 'El enlace venció. Pide uno nuevo.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const password = typeof body.password === 'string' ? body.password : ''
  if (password.length < 8 || password.length > 72) {
    return NextResponse.json({ error: 'La contraseña debe tener entre 8 y 72 caracteres' }, { status: 400 })
  }

  const supabase = await clienteAuth()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return NextResponse.json({ error: mensajeAuth(error) }, { status: 400 })
  return NextResponse.json({ ok: true })
}
