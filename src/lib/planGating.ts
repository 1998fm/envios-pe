export type PlanName = 'basic' | 'pro' | 'business_plus'

export type FeatureValue = boolean | string

export type FeatureDef = {
  key: string
  label: string
  basic: FeatureValue
  pro: FeatureValue
  business_plus: FeatureValue
  min: PlanName
}

export const FEATURES: FeatureDef[] = [
  { key: 'envios', label: 'Envíos mensuales', basic: '50', pro: '500', business_plus: 'Ilimitados', min: 'basic' },
  { key: 'metodos', label: 'Métodos de envío', basic: 'Hasta 2', pro: 'Ilimitados', business_plus: 'Ilimitados', min: 'basic' },
  { key: 'productos', label: 'Productos', basic: '50', pro: '200', business_plus: 'Ilimitados', min: 'basic' },
  { key: 'ventas', label: 'Ventas registradas', basic: '100', pro: '2000', business_plus: 'Ilimitadas', min: 'basic' },
  { key: 'shalom', label: 'Exportar a Shalom', basic: '8 al mes', pro: 'Ilimitado', business_plus: 'Ilimitado', min: 'basic' },
  { key: 'copiar', label: 'Copiar datos', basic: 'Hasta 50 pedidos', pro: 'Ilimitado', business_plus: 'Ilimitado', min: 'basic' },
  { key: 'etiquetas', label: 'Generar etiquetas', basic: true, pro: true, business_plus: true, min: 'basic' },
  { key: 'etiquetas_producto', label: 'Etiquetas de producto (nombre + SKU + QR)', basic: false, pro: true, business_plus: true, min: 'pro' },
  { key: 'ganancia', label: 'Ganancia por venta', basic: false, pro: true, business_plus: true, min: 'pro' },
  { key: 'compras', label: 'Compras', basic: true, pro: true, business_plus: true, min: 'basic' },
  { key: 'gastos', label: 'Gastos', basic: true, pro: true, business_plus: true, min: 'basic' },
  { key: 'logo', label: 'Logo personalizado', basic: false, pro: true, business_plus: true, min: 'pro' },
  { key: 'redes', label: 'Redes sociales en formulario', basic: false, pro: false, business_plus: true, min: 'business_plus' },
  { key: 'redirect', label: 'URL de redirección', basic: false, pro: true, business_plus: true, min: 'pro' },
  { key: 'logistica', label: 'Hora de corte y cupo diario', basic: false, pro: true, business_plus: true, min: 'pro' },
  { key: 'tarifas', label: 'Tarifas por distrito', basic: false, pro: true, business_plus: true, min: 'pro' },
  { key: 'cambio_masivo', label: 'Cambio masivo de estados', basic: false, pro: true, business_plus: true, min: 'pro' },
  { key: 'marca_blanca', label: 'Marca blanca en formulario', basic: false, pro: true, business_plus: true, min: 'pro' },
  { key: 'lector_qr', label: 'Lector de QR en ventas', basic: false, pro: false, business_plus: true, min: 'business_plus' },
]

export const UPGRADE_EVENT = 'open-upgrade'

export function planNivel(plan?: string | null): number {
  if (plan === 'business_plus') return 2
  if (plan === 'pro') return 1
  return 0
}

export function isPro(plan?: string | null): boolean {
  return plan === 'pro' || plan === 'business_plus'
}

export function isBusinessPlus(plan?: string | null): boolean {
  return plan === 'business_plus'
}

export function isBasic(plan?: string | null): boolean {
  return plan !== 'pro' && plan !== 'business_plus'
}

export type PlanEfectivo = {
  plan: PlanName
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
    const plan = profile.plan === 'business_plus' ? 'business_plus' : 'pro'
    return { plan, isTrial: false, diasRestantes: null }
  }

  const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null
  const isTrialActive =
    trialEnd != null &&
    trialEnd > now &&
    (profile.plan === 'pro' || profile.plan === 'business_plus')

  if (isTrialActive) {
    const plan: PlanName = profile.plan === 'business_plus' ? 'business_plus' : 'pro'
    const diasRestantes = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { plan, isTrial: true, diasRestantes }
  }

  return { plan: 'basic', isTrial: false, diasRestantes: null }
}

export function featureLocked(key: string, plan?: string | null): boolean {
  const feature = FEATURES.find((f) => f.key === key)
  if (!feature) return false
  return planNivel(plan) < planNivel(feature.min)
}

export function openUpgrade() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UPGRADE_EVENT))
  }
}