import { cookies, headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabaseEnv'

// Sesión de usuario manejada 100% en el servidor.
//
// El navegador ya no tiene cliente de Supabase: ni la URL ni las llaves de la
// base llegan al frontend. La sesión viaja en cookies httpOnly que solo leen y
// escriben las rutas del servidor (JavaScript de la página no puede leerlas,
// así que un XSS tampoco puede robar el token).

export const OPCIONES_COOKIE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

/** Cliente de Supabase atado a las cookies de la petición (solo en rutas API). */
export async function clienteAuth() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(lista) {
        for (const { name, value, options } of lista) {
          cookieStore.set(name, value, { ...options, ...OPCIONES_COOKIE })
        }
      },
    },
  })
}

/** Origen público de la app (para armar enlaces que se mandan por correo). */
export async function origenPublico(): Promise<string> {
  const fijo = process.env.NEXT_PUBLIC_SITE_URL
  if (fijo && !/localhost|127\.0\.0\.1/.test(fijo)) return fijo.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || (host?.startsWith('localhost') || host?.startsWith('127.') ? 'http' : 'https')
  return host ? `${proto}://${host}` : fijo || 'http://localhost:3000'
}

/** Solo rutas internas: evita que ?next= se use para redirigir a otro sitio. */
export function rutaInterna(next: string | null | undefined, porDefecto = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return porDefecto
  return next
}
