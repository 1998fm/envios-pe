import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { sincronizarArchivoPorStock } from '@/lib/sincronizarArchivoStock'
import { descontarStock, sumarStock } from '@/lib/stock'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { estado, metodo_pago, persona_nombre, persona_dni, items, monto_pagado } = body

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
    // Validar cantidades y precios positivos antes de tocar stock/items
    for (const it of items as any[]) {
      const cantidad = Number(it.cantidad)
      const precio = Number(it.precio_unitario)
      if (!Number.isFinite(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
        return NextResponse.json(
          { error: 'Cada ítem debe tener una cantidad entera mayor a 0.' },
          { status: 400 }
        )
      }
      if (!Number.isFinite(precio) || precio < 0) {
        return NextResponse.json(
          { error: 'Cada ítem debe tener un precio_unitario mayor o igual a 0.' },
          { status: 400 }
        )
      }
    }

    const itemsData = items.map((it: any) => ({
      venta_id: id,
      producto_id: it.producto_id || null,
      producto_nombre: it.producto_nombre,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      costo_unitario: it.costo_unitario ?? 0,
      subtotal: (it.precio_unitario ?? 0) * (it.cantidad ?? 0),
    }))

    // Validar stock disponible (se restaura lo vendido antes, así que se suma
    // lo de los items viejos del mismo producto) para evitar stock negativo.
    const stockViejoPorProducto = new Map<string, number>()
    for (const item of venta.items) {
      if (!item.producto_id) continue
      stockViejoPorProducto.set(
        item.producto_id,
        (stockViejoPorProducto.get(item.producto_id) || 0) + item.cantidad
      )
    }
    const idsViejos = [...stockViejoPorProducto.keys()]
    const idsNuevos = [...new Set(itemsData.map((it: any) => it.producto_id).filter(Boolean))]
    const idsAConsultar = [...new Set([...idsViejos, ...idsNuevos])]
    const stockActual = new Map<string, number>()
    if (idsAConsultar.length > 0) {
      const { data: prods } = await supabaseAdmin
        .from('productos')
        .select('id, stock_actual')
        .in('id', idsAConsultar)
      for (const p of prods || []) stockActual.set(p.id, p.stock_actual ?? 0)
    }
    const faltantesVerificados: string[] = []
    const cantidadesPorProducto = new Map<string, number>()
    for (const it of itemsData) {
      if (!it.producto_id) continue
      cantidadesPorProducto.set(
        it.producto_id,
        (cantidadesPorProducto.get(it.producto_id) || 0) + it.cantidad
      )
    }
    for (const [pid, cant] of cantidadesPorProducto) {
      const disp =
        (stockViejoPorProducto.get(pid) || 0) +
        (stockActual.get(pid) ?? 0)
      if (disp < cant) {
        const nombre = itemsData.find((it: any) => it.producto_id === pid)?.producto_nombre || pid
        faltantesVerificados.push(`"${nombre}" (disponible: ${disp}, requerido: ${cant})`)
      }
    }
    if (faltantesVerificados.length > 0) {
      return NextResponse.json(
        {
          error: `Stock insuficiente para ${faltantesVerificados.join(', ')}. Actualiza el stock o reduce la cantidad.`,
          faltantes: faltantesVerificados,
        },
        { status: 409 }
      )
    }

    const itemsViejos = venta.items

    // Restaurar stock de los ítems anteriores (atómico)
    for (const item of itemsViejos) {
      if (!item.producto_id) continue
      const res = await sumarStock(item.producto_id, item.cantidad)
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 409 })
      }
    }

    await supabaseAdmin.from('venta_items').delete().eq('venta_id', id)

    const { error: itemsError } = await supabaseAdmin.from('venta_items').insert(itemsData)
    if (itemsError) {
      // Reinsertar los ítems anteriores para no dejar la venta sin detalle
      await supabaseAdmin.from('venta_items').insert(itemsViejos)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    const descontados: { producto_id: string; cantidad: number }[] = []

    // Descontar stock de los ítems nuevos (atómico, con rollback si algo falla)
    for (const item of itemsData) {
      if (!item.producto_id) continue
      const res = await descontarStock(item.producto_id, item.cantidad)
      if (!res.ok) {
        // Revertir descuentos ya hechos para no perder stock
        for (const d of descontados) {
          await sumarStock(d.producto_id, d.cantidad)
        }
        await supabaseAdmin.from('venta_items').delete().eq('venta_id', id)
        await supabaseAdmin.from('venta_items').insert(itemsViejos)
        return NextResponse.json({ error: res.error }, { status: 409 })
      }
      descontados.push({ producto_id: item.producto_id, cantidad: item.cantidad })
    }

    await sincronizarArchivoPorStock([
      ...itemsViejos.map((it: any) => it.producto_id),
      ...itemsData.map((it: any) => it.producto_id),
    ].filter(Boolean))

    let total = 0
    for (const it of itemsData) total += it.subtotal

    // Al editar los ítems hay que reconciliar el monto cobrado: si la venta ya
    // estaba cobrada (COMPLETADA), el nuevo total queda pagado en su totalidad
    // (si el usuario agrega un producto, ese importe entra a caja). Si está
    // PENDIENTE se conserva el abono ya hecho, sin exceder el nuevo total.
    let montoPagadoRecalculado: number | undefined
    if (venta.estado === 'COMPLETADA') {
      montoPagadoRecalculado = Math.round(total * 100) / 100
    } else {
      montoPagadoRecalculado = Math.min(
        Math.round(Number(venta.monto_pagado ?? 0) * 100) / 100,
        Math.round(total * 100) / 100
      )
    }

    const updates: Record<string, any> = {
      total,
      updated_at: new Date().toISOString(),
    }
    if (metodo_pago) updates.metodo_pago = metodo_pago
    if (persona_nombre !== undefined) updates.persona_nombre = persona_nombre
    if (persona_dni !== undefined) updates.persona_dni = persona_dni || null
    if (monto_pagado !== undefined) {
      const monto = Number(monto_pagado)
      if (Number.isFinite(monto) && monto >= 0) {
        updates.monto_pagado = Math.round(monto * 100) / 100
      }
    } else if (montoPagadoRecalculado !== undefined) {
      updates.monto_pagado = montoPagadoRecalculado
    }

    const { data, error: updError } = await supabaseAdmin
      .from('ventas')
      .update(updates)
      .eq('id', id)
      .select('*, items:venta_items(*)')
      .single()

    if (updError) {
      return NextResponse.json({ error: updError.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  }

  if (estado !== 'ANULADA' && estado !== 'COMPLETADA') {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  if (estado === 'ANULADA') {
    if (venta.estado !== 'COMPLETADA' && venta.estado !== 'PENDIENTE') {
      return NextResponse.json({ error: 'Solo se puede anular una venta completada o pendiente' }, { status: 400 })
    }
    // Restaurar stock al anular (atómico)
    for (const item of venta.items) {
      if (!item.producto_id) continue
      const res = await sumarStock(item.producto_id, item.cantidad)
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 409 })
      }
    }

    await sincronizarArchivoPorStock(venta.items.map((it: any) => it.producto_id).filter(Boolean))
  } else if (estado === 'COMPLETADA') {
    if (venta.estado !== 'PENDIENTE') {
      return NextResponse.json({ error: 'Solo se puede completar una venta pendiente' }, { status: 400 })
    }
    // Si se completa por pago directo, el monto pagado queda al total (no hay abonos)
  }

  const updates = {
    estado,
    updated_at: new Date().toISOString(),
  } as Record<string, any>
  if (estado === 'COMPLETADA') {
    updates.monto_pagado = Number(venta.total)
  }

  const { data, error } = await supabaseAdmin
    .from('ventas')
    .update(updates)
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

  // Bug 1: restaurar stock al borrar, tanto COMPLETADA como PENDIENTE.
  // El POST descuenta stock siempre (incluso en ventas PENDIENTE), así que
  // borrar una pendiente también debe devolverlo. Se excluye ANULADA porque
  // al anularse ya se restauró el stock.
  if (venta?.estado === 'COMPLETADA' || venta?.estado === 'PENDIENTE') {
    for (const item of venta.items) {
      if (!item.producto_id) continue
      const res = await sumarStock(item.producto_id, item.cantidad)
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 409 })
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
