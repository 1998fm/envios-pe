export type FeatureValue = boolean | string

export type FeatureDef = {
  key: string
  label: string
  basic: FeatureValue
  pro: FeatureValue
}

export const FEATURES: FeatureDef[] = [
  { key: 'envios', label: 'Envíos mensuales', basic: '50', pro: 'Ilimitados' },
  { key: 'metodos', label: 'Métodos de envío', basic: 'Hasta 2', pro: 'Ilimitados' },
  { key: 'productos', label: 'Productos', basic: '50', pro: 'Ilimitados' },
  { key: 'ventas', label: 'Ventas registradas', basic: '100', pro: 'Ilimitados' },
  { key: 'shalom', label: 'Exportar a Shalom', basic: '10 al mes', pro: 'Ilimitado' },
  { key: 'copiar', label: 'Copiar datos', basic: 'Hasta 50 pedidos', pro: 'Ilimitado' },
  { key: 'etiquetas', label: 'Generar etiquetas', basic: true, pro: true },
  { key: 'compras', label: 'Compras', basic: true, pro: true },
  { key: 'gastos', label: 'Gastos', basic: true, pro: true },
  { key: 'logo', label: 'Logo personalizado', basic: false, pro: true },
  { key: 'redes', label: 'Redes sociales en formulario', basic: false, pro: true },
  { key: 'redirect', label: 'URL de redirección', basic: false, pro: true },
  { key: 'logistica', label: 'Control logístico', basic: false, pro: true },
  { key: 'tarifas', label: 'Tarifas por distrito', basic: false, pro: true },
  { key: 'cambio_masivo', label: 'Cambio masivo de estados', basic: false, pro: true },
  { key: 'marca_blanca', label: 'Marca blanca en formulario', basic: false, pro: true },
]

export const UPGRADE_EVENT = 'open-upgrade'

export function isPro(plan?: string | null): boolean {
  return plan === 'pro'
}

export function isBasic(plan?: string | null): boolean {
  return plan !== 'pro'
}

export type PlanEfectivo = {
  plan: 'basic' | 'pro'
  isTrial: boolean
  diasRestantes: number | null
}

export function computeEffectivePlan(profile: {
  plan?: string | null
  trial_end?: string | null
  pro_until?: string | null
}): PlanEfectivo {
  const now = new Date()
  const proUntil = profile.pro_until ? new Date(profile.pro_until) : null
  const isPaidActive = proUntil != null && proUntil > now

  if (isPaidActive) {
    return { plan: 'pro', isTrial: false, diasRestantes: null }
  }

  const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null
  const isTrialActive = trialEnd != null && trialEnd > now && profile.plan === 'pro'

  if (isTrialActive) {
    const diasRestantes = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { plan: 'pro', isTrial: true, diasRestantes }
  }

  return { plan: 'basic', isTrial: false, diasRestantes: null }
}

export function featureLocked(key: string, plan?: string | null): boolean {
  const feature = FEATURES.find((f) => f.key === key)
  if (!feature) return false
  if (isPro(plan)) return false
  return feature.basic === false
}

export function openUpgrade() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UPGRADE_EVENT))
  }
}
