import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

/** Al pasar pedidos a ENVIADO, las ventas ligadas a ellos quedan como COMPLETADO. */
export async function sincronizarVentasEnviadas(ownerId: string, envioIds: string[]) {
  if (envioIds.length === 0) return
  await supabaseAdmin
    .from('ventas')
    .update({ estado_envio: 'COMPLETADO' })
    .in('envio_id', envioIds)
    .eq('profile_id', ownerId)
}

export const ESTADOS_ENVIO = ['NO_EMPACADO', 'EMPACADO', 'EN_OBSERVACION', 'ENVIADO']

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Normaliza una lista de ids venida del cliente: solo UUID válidos, sin repetir, con tope. */
export function idsValidos(valor: unknown, max = 1000): string[] {
  const lista = Array.isArray(valor) ? valor : typeof valor === 'string' ? valor.split(',') : []
  return [...new Set(lista.map((x) => String(x).trim()).filter((x) => UUID.test(x)))].slice(0, max)
}
