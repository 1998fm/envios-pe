import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { checkRecordLimit } from '@/lib/planLimits'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const estado = searchParams.get('estado') || ''

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('ventas')
    .select('*, items:venta_items(*)')
    .eq('profile_id', userId)

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, persona_id, persona_nombre, persona_dni, items, metodo_pago } = body

  if (!user_id || !persona_id || !items?.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { allowed, reason } = await checkRecordLimit(user_id, 'ventas')
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 403 })
  }

  const pago = metodo_pago === 'YAPE_PLIN' || metodo_pago === 'TARJETA' ? metodo_pago : 'EFECTIVO'
  const estado = pago === 'TARJETA' ? 'PENDIENTE' : 'COMPLETADA'

  let total = 0
  const itemsData = items.map((it: any) => {
    const subtotal = (it.precio_unitario ?? 0) * (it.cantidad ?? 0)
    total += subtotal
    return {
      producto_id: it.producto_id || null,
      producto_nombre: it.producto_nombre,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      costo_unitario: 0,
      subtotal,
    }
  })

  // Foto del costo de cada producto al momento de la venta
  const productoIds = itemsData.map((it: any) => it.producto_id).filter(Boolean)
  if (productoIds.length > 0) {
    const { data: productos } = await supabaseAdmin
      .from('productos')
      .select('id, precio_compra')
      .in('id', productoIds)
    const costoPorId = new Map((productos || []).map((p: any) => [p.id, p.precio_compra ?? 0]))
    for (const it of itemsData) {
      if (it.producto_id) it.costo_unitario = costoPorId.get(it.producto_id) ?? 0
    }
  }

  // Vincular cliente con este negocio si no existe
  const { data: vinculo } = await supabaseAdmin
    .from('cliente_de')
    .select('id')
    .eq('persona_id', persona_id)
    .eq('profile_id', user_id)
    .maybeSingle()

  if (!vinculo) {
    await supabaseAdmin
      .from('cliente_de')
      .insert({ persona_id, profile_id: user_id })
  }

  const { data: venta, error } = await supabaseAdmin
    .from('ventas')
    .insert({
      profile_id: user_id,
      persona_id,
      persona_nombre,
      persona_dni,
      total,
      estado,
      metodo_pago: pago,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { error: itemsError } = await supabaseAdmin
    .from('venta_items')
    .insert(itemsData.map((it: any) => ({ ...it, venta_id: venta.id })))

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Descontar stock de cada producto
  for (const item of itemsData) {
    if (!item.producto_id) continue
    const { data: prod } = await supabaseAdmin
      .from('productos')
      .select('stock_actual')
      .eq('id', item.producto_id)
      .single()
    if (prod) {
      await supabaseAdmin
        .from('productos')
        .update({ stock_actual: prod.stock_actual - item.cantidad, updated_at: new Date().toISOString() })
        .eq('id', item.producto_id)
    }
  }

  return NextResponse.json({ data: venta })
}

