import { timingSafeEqual } from 'crypto'

function iguales(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

/**
 * Autoriza una llamada de cron. Vercel envía `Authorization: Bearer
 * $CRON_SECRET` cuando la variable CRON_SECRET existe en el proyecto. La
 * cabecera `x-vercel-cron` NO sirve: cualquiera puede mandarla.
 * Sin CRON_SECRET configurado se rechaza todo (falla cerrado).
 */
export function cronAutorizado(request: Request): boolean {
  const secreto = process.env.CRON_SECRET
  if (!secreto) return false
  const recibido = request.headers.get('authorization') ?? ''
  return iguales(recibido, `Bearer ${secreto}`)
}

/** Compara una clave compartida (x-sync-key) en tiempo constante. */
export function claveValida(recibida: string | null, esperada: string | undefined): boolean {
  if (!esperada || !recibida) return false
  return iguales(recibida, esperada)
}
