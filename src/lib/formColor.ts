import type { CSSProperties } from 'react'

export const COLOR_PRIMARIO_DEFECTO = '#0284c7'
export const COLOR_SECUNDARIO_DEFECTO = '#4f46e5'

export function normalizarHex(input: string | null | undefined): string | null {
  if (!input) return null
  let v = String(input).trim().replace('#', '')
  if (/^[0-9a-fA-F]{3}$/.test(v)) {
    v = v
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return null
  return '#' + v.toLowerCase()
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = normalizarHex(hex) ?? COLOR_PRIMARIO_DEFECTO
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function formCssVars(
  primario?: string,
  secundario?: string
): CSSProperties {
  const p = normalizarHex(primario) ?? COLOR_PRIMARIO_DEFECTO
  const s = normalizarHex(secundario) ?? COLOR_SECUNDARIO_DEFECTO
  const vars: Record<string, string> = {
    '--tori-c': p,
    '--tori-a': s,
    '--tori-c-soft': hexToRgba(p, 0.1),
    '--tori-c-border': hexToRgba(p, 0.35),
    '--tori-c-ring': hexToRgba(p, 0.5),
    '--tori-glow': hexToRgba(p, 0.2),
    '--tori-grad': `linear-gradient(90deg, ${p} 0%, ${s} 100%)`,
    '--tori-grad-br': `linear-gradient(135deg, ${p} 0%, ${s} 100%)`,
  }
  return vars as CSSProperties
}

export const TEMA_AZUL_VARS: CSSProperties = formCssVars(
  COLOR_PRIMARIO_DEFECTO,
  COLOR_SECUNDARIO_DEFECTO
)