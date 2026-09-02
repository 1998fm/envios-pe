import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

// Resultado de la autenticación de super admin.
export type AdminAuthResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; status: number; error: string }

// Lee el usuario autenticado desde las cookies (sesión del navegador).
async function getSessionUser(): Promise<{
  id: string
  email?: string | null
} | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Solo lectura de sesión en API routes; no se modifican cookies.
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? { id: user.id, email: user.email } : null
}

// Valida que la petición provenga de un usuario super_admin activo.
// Devuelve { ok: true, userId, email } si es admin; si no, la respuesta de error.
export async function requireSuperAdmin(): Promise<AdminAuthResult> {
  const user = await getSessionUser()
  if (!user) {
    return { ok: false, status: 401, error: 'No autenticado' }
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, disabled')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'super_admin') {
    return { ok: false, status: 403, error: 'Acceso restringido: no eres super admin' }
  }

  if (profile.disabled) {
    return { ok: false, status: 403, error: 'Cuenta desactivada' }
  }

  return { ok: true, userId: user.id, email: user.email ?? null }
}

// Registra una acción en el log de auditoría (best-effort).
export async function registrarAuditoria(auth: AdminAuthResult & { ok: true }, accion: string, detalle?: unknown) {
  try {
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: auth.userId,
      admin_email: auth.email,
      accion,
      detalle: detalle ?? {},
    })
  } catch (e) {
    console.error('[admin] error registrando auditoría:', e)
  }
}
