import { createClient } from '@supabase/supabase-js'
import { computeEffectivePlan } from '@/lib/planGating'
import { supabaseServiceKey, supabaseUrl } from '@/lib/supabaseEnv'

const supabaseAdmin = createClient(
  supabaseUrl(),
  supabaseServiceKey()
)

export type PlanFeature = {
  plan: string
  max_envios: number | null
  max_metodos: number | null
  form_branding: boolean
  dashboard_completo: boolean
  envios_masivos: boolean
  control_logistico: boolean
  max_productos: number | null
  max_ventas: number | null
  max_exportaciones_shalom: number | null
  max_pedidos_copiar: number | null
  max_miembros: number | null
}

export type LimitCheck = {
  allowed: boolean
  used: number
  max: number | null
  reason?: string
}

export type TrialStatus = {
  plan: string
  isTrial: boolean
  isPaid: boolean
  trialEnd: string | null
  proUntil: string | null
  daysRemaining: number | null
}

export async function getPlanFeatures(plan: string): Promise<PlanFeature | null> {
  const { data } = await supabaseAdmin
    .from('plan_features')
    .select('*')
    .eq('plan', plan)
    .single()
  // Política comercial autoritativa: no depende de que una migración ya esté aplicada.
  const plus = plan === 'business_plus' || plan === 'pro'
  return {
    ...data,
    plan: plus ? 'business_plus' : 'basic',
    max_envios: null,
    max_metodos: plus ? null : (data?.max_metodos ?? 2),
    form_branding: plus,
    dashboard_completo: plus,
    envios_masivos: plus,
    control_logistico: plus,
    max_productos: plus ? null : 0,
    max_ventas: plus ? null : 0,
    max_exportaciones_shalom: plus ? null : 0,
    max_pedidos_copiar: plus ? null : 0,
    max_miembros: plus ? 4 : 0,
  }
}

export async function checkTrialStatus(userId: string): Promise<TrialStatus> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan, trial_end, pro_until')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { plan: 'basic', isTrial: false, isPaid: false, trialEnd: null, proUntil: null, daysRemaining: null }
  }

  const now = new Date()
  const proUntil = profile.pro_until ? new Date(profile.pro_until) : null
  const isPaidActive = proUntil != null && proUntil > now

  // Lógica única de plan efectivo (compartida con dashboard y APIs).
  const eff = computeEffectivePlan(profile)

  // Auto-downgrade (lazy): sin plan activo → basic. Se conserva trial_end
  // como historial; computeEffectivePlan ignora los trials ya vencidos.
  if (eff.plan === 'basic' && (profile.plan === 'pro' || profile.plan === 'business_plus')) {
    await supabaseAdmin
      .from('profiles')
      .update({ plan: 'basic' })
      .eq('id', userId)
  }

  return {
    plan: eff.plan,
    isTrial: eff.isTrial,
    isPaid: eff.plan !== 'basic' && !eff.isTrial,
    trialEnd: eff.isTrial ? profile.trial_end : null,
    proUntil: isPaidActive ? profile.pro_until : null,
    daysRemaining: eff.diasRestantes,
  }
}

// Ambos planes reciben solicitudes sin límite mensual.
export async function checkEnvioLimit(_userId: string): Promise<{ allowed: boolean; reason?: string }> {
  void _userId
  return { allowed: true }
}

type TablaConProfile = 'productos' | 'ventas'

export async function checkRecordLimit(
  userId: string,
  tabla: TablaConProfile
): Promise<LimitCheck> {
  const { plan } = await checkTrialStatus(userId)
  const features = await getPlanFeatures(plan)

  const limite =
    tabla === 'productos' ? features?.max_productos ?? null : features?.max_ventas ?? null

  if (limite === null) {
    return { allowed: true, used: 0, max: null }
  }

  let query = supabaseAdmin
    .from(tabla)
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)

  // En productos, los archivados no ocupan espacio del límite del plan:
  // se pueden archivar en lugar de eliminar.
  if (tabla === 'productos' && limite !== null) {
    query = query.eq('archivado', false)
  }

  const { count, error } = await query

  if (error) {
    return { allowed: false, used: 0, max: limite, reason: 'Error al verificar límite' }
  }

  const used = count ?? 0

  if (used >= limite) {
    const nombre = tabla === 'productos' ? 'productos' : 'ventas'
    return {
      allowed: false,
      used,
      max: limite,
      reason: `Límite de ${limite} ${nombre} alcanzado en el plan Básico. Actualiza a Plus para más ${nombre}.`,
    }
  }

  return { allowed: true, used, max: limite }
}

export async function checkShalomExportLimit(userId: string): Promise<LimitCheck> {
  const { plan } = await checkTrialStatus(userId)
  const features = await getPlanFeatures(plan)

  const max = features?.max_exportaciones_shalom ?? null

  if (max === null) {
    return { allowed: true, used: 0, max: null }
  }

  const hoyLima = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  const inicioMes = new Date(`${hoyLima.slice(0, 8)}01T00:00:00-05:00`)

  const { count, error } = await supabaseAdmin
    .from('shalom_exports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', inicioMes.toISOString())

  if (error) {
    return { allowed: false, used: 0, max, reason: 'Error al verificar límite' }
  }

  const used = count ?? 0

  if (used >= max) {
    return {
      allowed: false,
      used,
      max,
      reason: `Límite de ${max} exportaciones a Shalom por mes alcanzado. Actualiza a Plus para exportaciones ilimitadas.`,
    }
  }

  return { allowed: true, used, max }
}

export async function registrarExportacionShalom(userId: string, cantidad: number) {
  await supabaseAdmin
    .from('shalom_exports')
    .insert({ user_id: userId, cantidad })
}

export async function checkRolesLimit(ownerId: string): Promise<LimitCheck> {
  // Plus vigente: incluye la prueba gratuita (si venció, el plan efectivo es basic).
  const { plan } = await checkTrialStatus(ownerId)

  if (plan !== 'business_plus') {
    return {
      allowed: false,
      used: 0,
      max: 0,
      reason: 'Requiere plan Plus activo',
    }
  }

  const { count, error } = await supabaseAdmin
    .from('business_members')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId)

  if (error) {
    return { allowed: false, used: 0, max: 4, reason: 'Error al verificar límite de miembros' }
  }

  const used = count ?? 0
  const max = 4

  if (used >= max) {
    return {
      allowed: false,
      used,
      max,
      reason: `Límite de ${max} miembros alcanzado en Plus`,
    }
  }

  return { allowed: true, used, max }
}
