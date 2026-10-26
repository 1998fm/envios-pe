import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { getSessionUser } from '@/lib/ownerAuth'
import { resolverNegocioActual } from '@/lib/rolesClient'
import { PERMISOS_TODOS, type PermisoKey, type PermisosRol } from '@/lib/roles'

// ============================================================
// Autorización de las rutas de negocio.
//
// Las rutas usan el service role (saltan RLS), así que el control de acceso
// vive aquí: el dueño de los datos SIEMPRE sale de la sesión, nunca de un
// parámetro (?user_id=, body.user_id) que controla quien llama.
//
//  · Dueño            -> ve y modifica los datos de su propio negocio.
//  · Miembro con rol  -> datos del dueño, limitado por los permisos del rol.
//  · Cualquier otro   -> 401 / 403.
// ============================================================

export type NegocioAuth = {
  userId: string
  /** Dueño de los datos: usar este id en todas las consultas. */
  ownerId: string
  esOwner: boolean
  permisos: PermisosRol
}

export type NegocioAuthResult =
  | ({ ok: true } & NegocioAuth)
  | { ok: false; response: NextResponse }

function fallo(status: number, error: string): NegocioAuthResult {
  return { ok: false, response: NextResponse.json({ error }, { status }) }
}

/**
 * @param requeridos permisos del rol; basta con tener UNO (las pestañas se
 *   pueden alcanzar por varias vistas). El dueño siempre pasa.
 */
export async function requireNegocio(
  ...requeridos: PermisoKey[]
): Promise<NegocioAuthResult> {
  const sesion = await getSessionUser()
  if (!sesion) return fallo(401, 'No autenticado')

  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('disabled')
    .eq('id', sesion.id)
    .maybeSingle()
  if (perfil?.disabled) return fallo(403, 'Cuenta desactivada')

  const negocio = await resolverNegocioActual(supabaseAdmin, sesion.id)

  if (negocio.esOwner) {
    return {
      ok: true,
      userId: sesion.id,
      ownerId: sesion.id,
      esOwner: true,
      permisos: PERMISOS_TODOS,
    }
  }

  // Miembro: sin rol (o con el plan del dueño vencido) no hay acceso.
  if (!negocio.rol || negocio.sinTablasRoles) {
    return fallo(403, 'Sin acceso a este negocio')
  }

  const permisos = negocio.rol.permisos
  if (requeridos.length > 0 && !requeridos.some((k) => permisos[k] === true)) {
    return fallo(403, 'Tu rol no tiene permiso para esta acción')
  }

  return {
    ok: true,
    userId: sesion.id,
    ownerId: negocio.ownerId,
    esOwner: false,
    permisos,
  }
}

/**
 * Para rutas por id ([id]): comprueba que la fila pertenezca al negocio del
 * que llama. Devuelve la respuesta de error o null si todo está bien.
 */
export function esDelNegocio(
  fila: Record<string, unknown> | null | undefined,
  ownerId: string,
  columna = 'profile_id'
): boolean {
  return !!fila && fila[columna] === ownerId
}
