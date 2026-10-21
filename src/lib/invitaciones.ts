import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

// ============================================================
// INVITACIONES AL NEGOCIO
//
// Cuando el dueño agrega a alguien que todavía no tiene cuenta en
// la app, se crea una invitación con un link único. El dueño comparte
// ese link (WhatsApp, Telegram, etc.) y quien lo abre crea su
// contraseña y queda dentro del negocio con el rol que el dueño le
// asignó (sin permisos extra).
//
// No se envían correos: el link se comparte a mano, así no dependen
// del SMTP ni de los límites de envío de Supabase.
// ============================================================

export type Invitacion = {
  id: string
  owner_id: string
  email: string
  role_id: string
  token: string
  estado: string
  creado_en: string
  expira_en: string
}

export type ResultadoInvitacion = {
  invitacion: Invitacion
  link: string
  aviso: string | null
}

const DIAS_VIGENCIA = 7

export function tokenAleatorio() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function linkDeInvitacion(token: string, origin: string) {
  // En local se usa el propio origin (localhost:3000); en producción,
  // el dominio público (por si la app corre detrás de un proxy).
  const esLocal = /localhost|127\.0\.0\.1/.test(origin)
  const base = esLocal ? origin : process.env.NEXT_PUBLIC_SITE_URL || origin
  return `${base.replace(/\/$/, '')}/invitacion/${token}`
}

/**
 * Crea (o reutiliza) la invitación de un email para un rol.
 * Devuelve el link para compartirlo a mano.
 */
export async function crearInvitacion(
  ownerId: string,
  email: string,
  roleId: string,
  origin: string
): Promise<ResultadoInvitacion> {
  const correo = email.trim().toLowerCase()

  // Si ya hay una invitación para ese email, se reutiliza la fila
  // (y se renueva el token para que el link viejo no sirva).
  const { data: existente } = await supabaseAdmin
    .from('business_invites')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('email', correo)
    .maybeSingle()

  const token = tokenAleatorio()
  const expira = new Date(Date.now() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitacion, error } = await supabaseAdmin
    .from('business_invites')
    .upsert(
      {
        ...(existente?.id ? { id: existente.id } : {}),
        owner_id: ownerId,
        email: correo,
        role_id: roleId,
        token,
        estado: 'pendiente',
        expira_en: expira,
      },
      { onConflict: 'owner_id,email' }
    )
    .select('*')
    .single()

  if (error) throw error

  return {
    invitacion,
    link: linkDeInvitacion(token, origin),
    aviso: 'Comparte el link con la persona para que cree su cuenta.',
  }
}

/**
 * Genera un link nuevo para la misma invitación (invalida el anterior).
 */
export async function renovarLink(
  invitacion: Invitacion,
  origin: string
): Promise<ResultadoInvitacion> {
  const token = tokenAleatorio()
  const expira = new Date(Date.now() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('business_invites')
    .update({ token, estado: 'pendiente', expira_en: expira })
    .eq('id', invitacion.id)
    .select('*')
    .single()

  if (error) throw error

  return {
    invitacion: data,
    link: linkDeInvitacion(token, origin),
    aviso: 'Se generó un link nuevo: el anterior ya no sirve.',
  }
}
