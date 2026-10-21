import type { SupabaseClient } from '@supabase/supabase-js'
import {
  esTablaFaltante,
  esVistaValida,
  normalizarPermisos,
  type ResolucionNegocio,
  type RolConfig,
  type VistaDashboard,
} from '@/lib/roles'
import { computeEffectivePlan } from '@/lib/planGating'

// ============================================================
// Resuelve el "negocio" al que pertenece el usuario autenticado.
//
// · Si el usuario es dueño de su cuenta  -> ownerId = su id, esOwner = true.
// · Si el usuario fue agregado como      -> ownerId = id del dueño,
//   miembro de otro negocio                 rol = configuración asignada.
//
// Si las tablas business_roles / business_members todavía no existen
// (falta ejecutar supabase/roles-negocio.sql) se degrada sin romper:
// el usuario se trata como dueño de su propio negocio.
//
// TODO se resuelve en UNA consulta: business_members trae embebidos el rol
// (business_roles) y el perfil (profiles), que es lo que hace que cada
// llamada a la API no pague 3 viajes a la base. Antes: consulta a profiles,
// consulta a business_members y consulta a business_roles.
// ============================================================

type MiembroConRelaciones = {
  owner_id: string
  role_id: string
  business_roles: {
    nombre: string
    vista_default: string
    permisos: unknown
  } | null
  profiles: { role: string | null; disabled: boolean | null } | null
}

export async function resolverNegocioActual(
  supabase: SupabaseClient,
  userId: string
): Promise<ResolucionNegocio> {
  const base: ResolucionNegocio = {
    ownerId: userId,
    userId,
    esOwner: true,
    esSuperAdmin: false,
    rol: null,
    sinTablasRoles: false,
  }

  // ---- Consulta única: membresía + rol + perfil ----------------------
  let miembro: MiembroConRelaciones | null = null
  let errorMiembro: { code?: string; message?: string } | null = null

  try {
    const res = await supabase
      .from('business_members')
      .select(
        'owner_id, role_id, business_roles(nombre, vista_default, permisos), profiles!business_members_user_id_fkey(role, disabled)'
      )
      .eq('user_id', userId)
      .maybeSingle()
    miembro = (res.data as MiembroConRelaciones | null) ?? null
    errorMiembro = res.error ?? null
  } catch (e) {
    errorMiembro = { message: e instanceof Error ? e.message : 'error desconocido' }
  }

  if (errorMiembro) {
    if (esTablaFaltante(errorMiembro)) base.sinTablasRoles = true
    return base
  }

  // ---- Sin membresía: es dueño de su propio negocio ------------------
  if (!miembro) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, disabled')
        .eq('id', userId)
        .maybeSingle()

      if (profile?.role === 'super_admin') base.esSuperAdmin = true
      if (profile?.disabled) return base
    } catch {
      // sin perfil seguimos con el comportamiento por defecto
    }
    return base
  }

  // ---- Es miembro: el negocio es del dueño ------------------------
  // PRIMERO: verificar que el dueño tenga Business Plus activo.
  // Si el trial venció o bajó a Basic/Pro, el miembro pierde acceso.
  let ownerPlan: 'basic' | 'pro' | 'business_plus' = 'basic'
  try {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('plan, trial_end, pro_until')
      .eq('id', miembro.owner_id)
      .maybeSingle()
    if (ownerProfile) {
      ownerPlan = computeEffectivePlan(ownerProfile).plan
    }
  } catch {
    // si falla la consulta, asumimos basic (sin acceso a roles)
  }

  if (ownerPlan !== 'business_plus') {
    return {
      ...base,
      ownerId: miembro.owner_id,
      esOwner: false,
      sinTablasRoles: true, // el miembro no ve nada del negocio
    }
  }

  base.ownerId = miembro.owner_id
  base.esOwner = false

  if (miembro.profiles?.role === 'super_admin') base.esSuperAdmin = true
  if (miembro.profiles?.disabled) return base

  const rolRow = miembro.business_roles
  if (rolRow) {
    const vista = esVistaValida(rolRow.vista_default) ? rolRow.vista_default : 'resumen'
    base.rol = {
      id: miembro.role_id,
      nombre: rolRow.nombre,
      vista_default: vista as VistaDashboard,
      permisos: normalizarPermisos(rolRow.permisos),
    } satisfies RolConfig
  }

  return base
}
