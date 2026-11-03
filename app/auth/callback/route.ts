import { NextResponse } from 'next/server'
import { clienteAuth, origenPublico, rutaInterna } from '@/lib/authServidor'

// Destino de los enlaces de correo (recuperar contraseña). Canjea el código de
// un solo uso por una sesión (cookies httpOnly) y redirige a una ruta interna.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const origen = await origenPublico()
  const code = url.searchParams.get('code')
  const destino = rutaInterna(url.searchParams.get('next'), '/dashboard')

  if (code) {
    const supabase = await clienteAuth()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origen}${destino}`)
  }
  return NextResponse.redirect(`${origen}/login?enlace=invalido`)
}
