export type PlanName = 'basic' | 'business_plus'

export type FeatureValue = boolean | string

export type FeatureDef = {
  key: string
  label: string
  basic: FeatureValue
  business_plus: FeatureValue
  min: PlanName
}

export const FEATURES: FeatureDef[] = [
  { key: 'envios', label: 'Envíos mensuales', basic: 'Ilimitados', business_plus: 'Ilimitados', min: 'basic' },
  { key: 'metodos', label: 'Métodos de envío', basic: 'Hasta 2', business_plus: 'Ilimitados', min: 'basic' },
  { key: 'productos', label: 'Productos', basic: false, business_plus: 'Ilimitados', min: 'business_plus' },
  { key: 'ventas', label: 'Ventas registradas', basic: false, business_plus: 'Ilimitadas', min: 'business_plus' },
  { key: 'shalom', label: 'Exportar a Shalom', basic: false, business_plus: 'Ilimitado', min: 'business_plus' },
  { key: 'copiar', label: 'Copiar datos', basic: false, business_plus: 'Ilimitado', min: 'business_plus' },
  { key: 'etiquetas', label: 'Generar etiquetas', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'etiquetas_producto', label: 'Etiquetas de producto (nombre + SKU + QR)', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'resumen', label: 'Resumen y reportes', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'clientes', label: 'Gestión de clientes', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'exportar', label: 'Exportar Excel/CSV', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'ganancia', label: 'Ganancia por venta', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'compras', label: 'Compras', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'gastos', label: 'Gastos', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'logo', label: 'Logo personalizado', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'redes', label: 'Redes sociales en formulario', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'redirect', label: 'URL de redirección', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'logistica', label: 'Hora de corte y cupo diario', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'tarifas', label: 'Tarifas por distrito', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'cambio_masivo', label: 'Cambio masivo de estados', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'marca_blanca', label: 'Marca blanca en formulario', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'lector_qr', label: 'Lector de QR en ventas', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'roles', label: 'Roles y permisos', basic: false, business_plus: true, min: 'business_plus' },
  { key: 'max_miembros', label: 'Miembros del equipo', basic: '0', business_plus: '4', min: 'business_plus' },
]

export const UPGRADE_EVENT = 'open-upgrade'

export function planNivel(plan?: string | null): number {
  if (plan === 'business_plus') return 2
  if (plan === 'pro') return 2 // Compatibilidad con suscripciones anteriores.
  return 0
}

export function isPro(plan?: string | null): boolean {
  return plan === 'pro' || plan === 'business_plus'
}

export function isBusinessPlus(plan?: string | null): boolean {
  return isPro(plan)
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

  if (isPaidActive && isPro(profile.plan)) {
    const plan: PlanName = 'business_plus'
    return { plan, isTrial: false, diasRestantes: null }
  }

  const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null
  const isTrialActive =
    trialEnd != null &&
    trialEnd > now &&
    (profile.plan === 'pro' || profile.plan === 'business_plus')

  if (isTrialActive) {
    const plan: PlanName = 'business_plus'
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

export function canUseRoles(plan?: string | null): boolean {
  return isPro(plan)
}
/** El formulario y la gestión individual de pedidos están disponibles en ambos planes. */
export function puedeUsarSeccion(plan: string | null | undefined, seccion: string): boolean {
  return isPro(plan) || seccion === 'envios' || seccion === 'formulario'
}

export const DIAS_PRUEBA_PLUS = 14
export const PRECIOS_PLUS = {
  mensual: { valor: 49.90, meses: 1 },
  trimestral: { valor: 129.90, meses: 3 },
} as const
