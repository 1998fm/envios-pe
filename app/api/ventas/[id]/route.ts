import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { sincronizarArchivoPorStock } from '@/lib/sincronizarArchivoStock'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { estado, metodo_pago, persona_nombre, persona_dni, items } = body

  const { data: venta, error: fetchError } = await supabaseAdmin
    .from('ventas')
    .select('*, items:venta_items(*)')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const esEdicion = Array.isArray(items)

  if (esEdicion) {
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

    await supabaseAdmin.from('venta_items').delete().eq('venta_id', id)

    const itemsData = items.map((it: any) => ({
      venta_id: id,
      producto_id: it.producto_id || null,
      producto_nombre: it.producto_nombre,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      costo_unitario: it.costo_unitario ?? 0,
      subtotal: (it.precio_unitario ?? 0) * (it.cantidad ?? 0),
    }))

    const { error: itemsError } = await supabaseAdmin.from('venta_items').insert(itemsData)
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    let total = 0
    for (const it of itemsData) total += it.subtotal

    const updates: Record<string, any> = {
      total,
      updated_at: new Date().toISOString(),
    }
    if (metodo_pago) updates.metodo_pago = metodo_pago
    if (persona_nombre !== undefined) updates.persona_nombre = persona_nombre
    if (persona_dni !== undefined) updates.persona_dni = persona_dni || null

    const { data, error: updError } = await supabaseAdmin
      .from('ventas')
      .update(updates)
      .eq('id', id)
      .select('*, items:venta_items(*)')
      .single()

    if (updError) {
      return NextResponse.json({ error: updError.message }, { status: 500 })
    }

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

    await sincronizarArchivoPorStock([
      ...venta.items.map((it: any) => it.producto_id),
      ...itemsData.map((it: any) => it.producto_id),
    ].filter(Boolean))

    return NextResponse.json({ data })
  }

  if (estado !== 'ANULADA' && estado !== 'COMPLETADA') {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  if (estado === 'ANULADA') {
    if (venta.estado !== 'COMPLETADA' && venta.estado !== 'PENDIENTE') {
      return NextResponse.json({ error: 'Solo se puede anular una venta completada o pendiente' }, { status: 400 })
    }
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

    await sincronizarArchivoPorStock(venta.items.map((it: any) => it.producto_id).filter(Boolean))
  } else if (estado === 'COMPLETADA') {
    if (venta.estado !== 'PENDIENTE') {
      return NextResponse.json({ error: 'Solo se puede completar una venta pendiente' }, { status: 400 })
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
    await sincronizarArchivoPorStock(venta.items.map((it: any) => it.producto_id).filter(Boolean))
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
