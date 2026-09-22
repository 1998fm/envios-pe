import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { sincronizarArchivoPorStock } from '@/lib/sincronizarArchivoStock'
import { editarVentaAtomico, anularVentaAtomico, eliminarVentaAtomico } from '@/lib/stock'

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

    // Validación de stock disponible (UX temprana): el RPC vuelve a validar de
    // forma atómica y con bloqueo, pero esto evita el request si no alcanza.
    const idsNuevos = [
      ...new Set(
        (items as any[])
          .map((it: any) => it.producto_id)
          .filter(Boolean)
      ),
    ]
    const idsAConsultar = [
      ...new Set([
        ...(venta.items || []).map((it: any) => it.producto_id).filter(Boolean),
        ...idsNuevos,
      ]),
    ]
    const stockActual = new Map<string, number>()
    if (idsAConsultar.length > 0) {
      const { data: prods } = await supabaseAdmin
        .from('productos')
        .select('id, stock_actual')
        .in('id', idsAConsultar)
      for (const p of prods || []) stockActual.set(p.id, p.stock_actual ?? 0)
    }
    // Al editar se devuelve el stock de los ítems viejos del mismo producto,
    // así que ese stock "vuelve a estar disponible" para el mismo producto.
    const stockViejoPorProducto = new Map<string, number>()
    for (const item of venta.items || []) {
      if (!item.producto_id) continue
      stockViejoPorProducto.set(
        item.producto_id,
        (stockViejoPorProducto.get(item.producto_id) || 0) + item.cantidad
      )
    }
    const cantidadesPorProducto = new Map<string, number>()
    for (const it of items as any[]) {
      if (!it.producto_id) continue
      cantidadesPorProducto.set(
        it.producto_id,
        (cantidadesPorProducto.get(it.producto_id) || 0) + Number(it.cantidad)
      )
    }
    const faltantesVerificados: string[] = []
    for (const [pid, cant] of cantidadesPorProducto) {
      const disp = (stockViejoPorProducto.get(pid) || 0) + (stockActual.get(pid) ?? 0)
      if (disp < cant) {
        const nombre = (items as any[]).find((it: any) => it.producto_id === pid)?.producto_nombre || pid
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

    // Operación ATÓMICA en la base: restaura stock viejo + borra + inserta
    // nuevos + descuenta + actualiza totales en UNA transacción.
    const { data, error: editarError } = await editarVentaAtomico(id, {
      items,
      metodo_pago,
      persona_nombre,
      persona_dni,
      monto_pagado: monto_pagado !== undefined ? Number(monto_pagado) : null,
    })

    if (editarError) {
      return NextResponse.json({ error: editarError }, { status: 500 })
    }

    await sincronizarArchivoPorStock([
      ...(venta.items || []).map((it: any) => it.producto_id),
      ...idsNuevos,
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
    // Anulación ATÓMICA: restaura stock + estado en UNA transacción
    const { data, error: anularError } = await anularVentaAtomico(id)
    if (anularError) {
      return NextResponse.json({ error: anularError }, { status: 500 })
    }
    await sincronizarArchivoPorStock((venta.items || []).map((it: any) => it.producto_id).filter(Boolean))
    return NextResponse.json({ data })
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

  // Lectura ANTES de borrar para poder sincronizar archivado de los productos
  const { data: venta } = await supabaseAdmin
    .from('ventas')
    .select('estado, items:venta_items(producto_id, cantidad)')
    .eq('id', id)
    .single()

  // Eliminación ATÓMICA: el RPC restaura el stock (COMPLETADA/PENDIENTE) y
  // borra venta + items en UNA transacción. ANULADA no restaura (ya devolvió).
  const { error } = await eliminarVentaAtomico(id)
  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  await sincronizarArchivoPorStock((venta?.items || []).map((it: any) => it.producto_id).filter(Boolean))

  return NextResponse.json({ success: true })
}
