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
  const { user_id, persona_id, persona_nombre, persona_dni, items } = body

  if (!user_id || !persona_id || !items?.length) {
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
      estado: 'COMPLETADA',
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

