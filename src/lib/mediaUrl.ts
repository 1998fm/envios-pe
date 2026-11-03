import { supabaseUrl } from '@/lib/supabaseEnv'

// Las imágenes (logos, fotos de producto) viven en el almacenamiento público de
// la base, cuya URL contiene la dirección del proyecto. Para que el navegador
// no la vea, al enviar datos al frontend se reescribe a /media/<bucket>/<ruta>
// (next.config.ts la reenvía al almacenamiento desde el servidor) y al recibir
// URLs del frontend se vuelve a la forma canónica.

const BUCKETS = new Set(['logos', 'productos'])
const PUBLICA = /^https?:\/\/[^/]+\/storage\/v1\/object\/public\//

/** URL canónica de almacenamiento -> /media/... (para mandar al navegador). */
export function aProxy<T extends string | null | undefined>(url: T): T | string {
  if (!url) return url
  return PUBLICA.test(url) ? url.replace(PUBLICA, '/media/') : url
}

/** /media/... -> URL canónica (para guardar en la base). Otros valores pasan igual. */
export function desdeProxy(url: string): string {
  if (!url.startsWith('/media/')) return url
  const resto = url.slice('/media/'.length)
  const bucket = resto.split('/')[0]
  if (!BUCKETS.has(bucket)) return url
  return `${supabaseUrl()}/storage/v1/object/public/${resto}`
}

/** Aplica aProxy a las columnas de imagen de una fila de perfil/producto. */
export function conImagenesProxy<T extends Record<string, unknown>>(fila: T, columnas: string[]): T {
  const copia: Record<string, unknown> = { ...fila }
  for (const c of columnas) {
    if (typeof copia[c] === 'string') copia[c] = aProxy(copia[c] as string)
  }
  return copia as T
}
