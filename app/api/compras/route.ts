import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const estado = searchParams.get('estado') || ''

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('compras')
    .select('*, items:compra_items(*)')
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
  const { user_id, proveedor, items } = body

  if (!user_id || !proveedor || !items?.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
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
      profile_id: user_id,
      proveedor,
      total,
      estado: 'COMPLETADA',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { error: itemsError } = await supabaseAdmin
    .from('compra_items')
    .insert(itemsData.map((it: any) => ({ ...it, compra_id: compra.id })))

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Incrementar stock de cada producto
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
        .update({ stock_actual: prod.stock_actual + item.cantidad, updated_at: new Date().toISOString() })
        .eq('id', item.producto_id)
    }
  }

  return NextResponse.json({ data: compra })
}
