import { cookies, headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

// ============================================================
// Autenticación de "dueño de negocio".
// El dueño de un negocio es el usuario autenticado: sus roles y sus
// miembros cuelgan de su propio id (profiles.id).
// ============================================================

export type OwnerAuthResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; status: number; error: string }

export async function getSessionUser(): Promise<{ id: string; email?: string | null } | null> {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Solo lectura de sesión en API routes.
        },
      },
    }
  )

  // Token en el header Authorization (clientes externos / pruebas). El
  // navegador normal manda la sesión por cookie.
  const authHeader = headerStore.get('authorization')
  const token = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  // Verificar el JWT en local (getClaims usa las claves públicas y su cache,
  // sin viajar al servidor de auth). Es lo que hace que cada llamada a la API
  // no pague un viaje extra de ~150 ms solo por saber quién pregunta.
  try {
    const { data, error } = token
      ? await supabase.auth.getClaims(token)
      : await supabase.auth.getClaims()
    if (!error && data?.claims?.sub) {
      return { id: data.claims.sub, email: (data.claims.email as string) ?? null }
    }
  } catch {
    // se cae al getUser() de abajo
  }

  // Fallback: el servidor de auth (más lento, pero refresca el token si venció).
  const {
    data: { user: userFromCookie },
  } = await supabase.auth.getUser()
  if (userFromCookie) return { id: userFromCookie.id, email: userFromCookie.email }

  if (token) {
    const {
      data: { user: userFromToken },
    } = await supabase.auth.getUser(token)
    if (userFromToken) return { id: userFromToken.id, email: userFromToken.email }
  }

  return null
}

export async function requireOwner(): Promise<OwnerAuthResult> {
  const user = await getSessionUser()
  if (!user) {
    return { ok: false, status: 401, error: 'No autenticado' }
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, disabled')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return { ok: false, status: 403, error: 'Perfil no encontrado' }
  }

  if (profile.disabled) {
    return { ok: false, status: 403, error: 'Cuenta desactivada' }
  }

  return { ok: true, userId: user.id, email: user.email ?? null }
}

// Busca un usuario de Supabase Auth por email (página por página).
export async function buscarUsuarioPorEmail(
  email: string
): Promise<{ id: string; email: string } | null> {
  const objetivo = email.trim().toLowerCase()
  if (!objetivo) return null

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error) break

    const lista = data?.users ?? []
    if (lista.length === 0) break

    const encontrado = lista.find(
      (u) => (u.email ?? '').toLowerCase() === objetivo
    )
    if (encontrado) {
      return { id: encontrado.id, email: encontrado.email ?? objetivo }
    }

    if (lista.length < 200) break
  }

  return null
}
