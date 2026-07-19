import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { estado } = body

  if (estado !== 'ANULADA') {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const { data: venta, error: fetchError } = await supabaseAdmin
    .from('ventas')
    .select('*, items:venta_items(*)')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (venta.estado !== 'COMPLETADA') {
    return NextResponse.json({ error: 'Solo se puede anular una venta completada' }, { status: 400 })
  }

  // Restaurar stock de cada producto
  for (const item of venta.items) {
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

  const { data, error } = await supabaseAdmin
    .from('ventas')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, items:venta_items(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: venta } = await supabaseAdmin
    .from('ventas')
    .select('estado, items:venta_items(producto_id, cantidad)')
    .eq('id', id)
    .single()

  if (venta?.estado === 'COMPLETADA') {
    for (const item of venta.items) {
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
  }

  const { error } = await supabaseAdmin
    .from('ventas')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
