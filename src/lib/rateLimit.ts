// Límite de intentos por IP, en memoria (ventana fija).
//
// Limitación conocida: en serverless cada instancia tiene su propio contador,
// así que es una barrera contra abuso casual, no un límite global. Para uno
// estricto hay que respaldarlo con Redis/Upstash o una tabla en Supabase.
const cubetas = new Map<string, { n: number; reinicia: number }>()

export function ipDe(request: Request): string {
  const reenviada = request.headers.get('x-forwarded-for')
  if (reenviada) return reenviada.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'desconocida'
}

/** true si el intento está permitido; false si superó `max` en `ventanaMs`. */
export function permitir(
  request: Request,
  nombre: string,
  max: number,
  ventanaMs: number
): boolean {
  const ahora = Date.now()
  if (cubetas.size > 5000) {
    for (const [k, v] of cubetas) if (v.reinicia <= ahora) cubetas.delete(k)
  }
  const clave = `${nombre}:${ipDe(request)}`
  const actual = cubetas.get(clave)
  if (!actual || actual.reinicia <= ahora) {
    cubetas.set(clave, { n: 1, reinicia: ahora + ventanaMs })
    return true
  }
  actual.n += 1
  return actual.n <= max
}
