import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireNegocio } from '@/lib/negocioAuth'
import { idsValidos } from '@/lib/enviosServidor'
import { mensajeDb } from '@/lib/erroresEs'

// Qué productos lleva cada pedido (para las etiquetas): por pedido, la suma de
// los ítems de las ventas ligadas a él.
export async function GET(request: Request) {
  const auth = await requireNegocio('ver_envios')
  if (!auth.ok) return auth.response

  const ids = idsValidos(new URL(request.url).searchParams.get('ids'))
  if (ids.length === 0) return NextResponse.json({ data: {} })

  const { data: ventas, error } = await supabaseAdmin
    .from('ventas')
    .select('envio_id, items:venta_items(producto_nombre, cantidad)')
    .in('envio_id', ids)
    .eq('profile_id', auth.ownerId)

  if (error) return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })

  const porEnvio: Record<string, { nombre: string; cantidad: number }[]> = {}
  for (const venta of ventas ?? []) {
    const envioId = venta.envio_id as string
    for (const item of (venta.items ?? []) as { producto_nombre: string; cantidad: number }[]) {
      const lista = (porEnvio[envioId] ??= [])
      const existente = lista.find((p) => p.nombre === item.producto_nombre)
      if (existente) existente.cantidad += item.cantidad
      else lista.push({ nombre: item.producto_nombre, cantidad: item.cantidad })
    }
  }
  return NextResponse.json({ data: porEnvio })
}
