import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { estado } = body

  if (estado !== 'ANULADA') {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const { data: compra, error: fetchError } = await supabaseAdmin
    .from('compras')
    .select('*, items:compra_items(*)')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (compra.estado !== 'COMPLETADA') {
    return NextResponse.json({ error: 'Solo se puede anular una compra completada' }, { status: 400 })
  }

  // Restaurar stock (devolver lo que se incrementó)
  for (const item of compra.items) {
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

  const { data, error } = await supabaseAdmin
    .from('compras')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, items:compra_items(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: compra } = await supabaseAdmin
    .from('compras')
    .select('estado, items:compra_items(producto_id, cantidad)')
    .eq('id', id)
    .single()

  if (compra?.estado === 'COMPLETADA') {
    for (const item of compra.items) {
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
  }

  const { error } = await supabaseAdmin
    .from('compras')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
