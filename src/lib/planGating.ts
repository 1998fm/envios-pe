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
