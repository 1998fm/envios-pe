import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type PlanFeature = {
  plan: string
  max_envios: number | null
  max_metodos: number | null
  form_branding: boolean
  dashboard_completo: boolean
  envios_masivos: boolean
  control_logistico: boolean
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
  return data
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
  const isPaidActive = proUntil && proUntil > now

  // 1. Pro pagado activo
  if (isPaidActive) {
    const daysRemaining = Math.ceil((proUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return {
      plan: 'pro',
      isTrial: false,
      isPaid: true,
      trialEnd: profile.trial_end,
      proUntil: profile.pro_until,
      daysRemaining,
    }
  }

  // 2. Trial activo (solo si no tiene pro_until activo)
  const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null
  const isTrialActive = trialEnd && trialEnd > now && profile.plan === 'pro'

  if (isTrialActive) {
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return {
      plan: 'pro',
      isTrial: true,
      isPaid: false,
      trialEnd: profile.trial_end,
      proUntil: null,
      daysRemaining,
    }
  }

  // 3. Sin Pro activo — auto-downgrade a basic
  if (profile.plan === 'pro') {
    await supabaseAdmin
      .from('profiles')
      .update({ plan: 'basic', trial_end: null })
      .eq('id', userId)
  }

  return { plan: 'basic', isTrial: false, isPaid: false, trialEnd: null, proUntil: null, daysRemaining: null }
}

export async function checkEnvioLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { plan } = await checkTrialStatus(userId)
  const features = await getPlanFeatures(plan)

  if (!features) {
    return { allowed: false, reason: 'Plan no encontrado' }
  }

  if (features.max_envios === null) {
    return { allowed: true }
  }

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const { count, error } = await supabaseAdmin
    .from('envios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('fecha_registro', inicioMes.toISOString())

  if (error) {
    return { allowed: false, reason: 'Error al verificar límite' }
  }

  if ((count ?? 0) >= features.max_envios) {
    return {
      allowed: false,
      reason: `Límite de ${features.max_envios} envíos mensuales alcanzado. Actualiza a Pro para envíos ilimitados.`,
    }
  }

  return { allowed: true }
}
