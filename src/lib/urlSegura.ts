// Solo se aceptan enlaces http(s). Cualquier otro esquema (javascript:, data:,
// vbscript:…) se descarta: estas URLs las escribe el dueño del negocio y las
// abre un tercero (el cliente del formulario público).
export function urlHttpSegura(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined
  const limpio = valor.trim()
  if (!limpio || limpio.length > 2048) return undefined
  // Sin esquema ("instagram.com/x") se asume https; con esquema, solo http(s).
  const conEsquema = /^[a-z][a-z0-9+.-]*:/i.test(limpio) && !/^[^/]+:\d+(\/|$)/.test(limpio)
  try {
    const u = new URL(conEsquema ? limpio : `https://${limpio}`)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return undefined
    return u.toString()
  } catch {
    return undefined
  }
}
