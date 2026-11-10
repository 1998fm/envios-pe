import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { sincronizarArchivoPorStock } from '@/lib/sincronizarArchivoStock'
import { sumarStock, restarStock } from '@/lib/stock'
import { mensajeDb } from '@/lib/erroresEs'

export async function GET(request: Request) {
  const auth = await requirePlus('ver_compras')
  if (!auth.ok) return auth.response
  const userId = auth.ownerId

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado') || ''
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

  let query = supabaseAdmin
    .from('compras')
    .select('*, items:compra_items(*)', { count: 'exact' })
    .eq('profile_id', userId)

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  return NextResponse.json({ data, total: count ?? 0, offset, limit })
}

export async function POST(request: Request) {
  const auth = await requirePlus('ver_compras')
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { proveedor, items } = body

  if (!proveedor || !Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Los productos deben ser del propio negocio: si no, se podría sumar stock
  // (y leer nombres) de productos de otro.
  const idsProductos = [...new Set(items.map((it: any) => it.producto_id).filter(Boolean))] as string[]
  if (idsProductos.length > 0) {
    const { data: propios } = await supabaseAdmin
      .from('productos')
      .select('id')
      .eq('profile_id', auth.ownerId)
      .in('id', idsProductos)
    if ((propios?.length ?? 0) !== idsProductos.length) {
      return NextResponse.json({ error: 'Producto no válido' }, { status: 403 })
    }
  }

  let total = 0
  const itemsData = items.map((it: any) => {
    const subtotal = (it.precio_unitario ?? 0) * (it.cantidad ?? 0)
    total += subtotal
    return {
      producto_id: it.producto_id || null,
      producto_nombre: it.producto_nombre,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      subtotal,
    }
  })

  const { data: compra, error } = await supabaseAdmin
    .from('compras')
    .insert({
      profile_id: auth.ownerId,
      proveedor,
      total,
      estado: 'COMPLETADA',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  const { error: itemsError } = await supabaseAdmin
    .from('compra_items')
    .insert(itemsData.map((it: any) => ({ ...it, compra_id: compra.id })))

  if (itemsError) {
    return NextResponse.json({ error: mensajeDb(itemsError) }, { status: 500 })
  }

  // Incrementar stock de cada producto (atómico). Si algún producto falla,
  // revertir el stock ya sumado para no dejar el inventario desincronizado.
  const conStockAumentado: Array<{ id: string; cantidad: number }> = []
  for (const item of itemsData) {
    if (!item.producto_id) continue
    const resultado = await sumarStock(item.producto_id, item.cantidad, compra.id, 'COMPRA', 'Compra')
    if (!resultado.ok) {
      for (const prev of conStockAumentado) {
        await restarStock(prev.id, prev.cantidad)
      }
      await supabaseAdmin.from('compra_items').delete().eq('compra_id', compra.id)
      await supabaseAdmin.from('compras').delete().eq('id', compra.id)
      return NextResponse.json({ error: resultado.error }, { status: 500 })
    }
    conStockAumentado.push({ id: item.producto_id, cantidad: item.cantidad })
  }

  await sincronizarArchivoPorStock(itemsData.map((it: any) => it.producto_id).filter(Boolean))

  return NextResponse.json({ data: compra })
}
