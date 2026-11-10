import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { mensajeDb } from '@/lib/erroresEs'

/** ¿La venta pertenece al negocio del que llama? */
async function ventaEsDelNegocio(ventaId: string, ownerId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('ventas')
    .select('id')
    .eq('id', ventaId)
    .eq('profile_id', ownerId)
    .maybeSingle()
  return !!data
}

export type Abono = {
  id: string
  venta_id: string
  monto: number
  metodo_pago: string
  notas?: string | null
  created_at: string
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlus('ver_ventas')
  if (!auth.ok) return auth.response
  const { id } = await params

  if (!(await ventaEsDelNegocio(id, auth.ownerId))) {
    return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  }

  const { data: abonos, error } = await supabaseAdmin
    .from('venta_abonos')
    .select('*')
    .eq('venta_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  return NextResponse.json({ data: abonos })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlus('ver_ventas')
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await request.json()
  const { monto, metodo_pago, notas } = body

  const montoNum = Number(monto)
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    return NextResponse.json({ error: 'El monto debe ser mayor a 0.' }, { status: 400 })
  }

  const { data: venta, error: fetchError } = await supabaseAdmin
    .from('ventas')
    .select('id, total, estado, monto_pagado')
    .eq('id', id)
    .eq('profile_id', auth.ownerId)
    .single()

  if (fetchError || !venta) {
    return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  }

  if (venta.estado === 'ANULADA') {
    return NextResponse.json({ error: 'No se pueden registrar abonos en una venta anulada.' }, { status: 400 })
  }

  if (venta.estado === 'COMPLETADA') {
    return NextResponse.json({ error: 'Esta venta ya está pagada en su totalidad.' }, { status: 400 })
  }

  const yaPagado = Number(venta.monto_pagado ?? 0)
  const pendiente = Number(venta.total) - yaPagado
  if (montoNum > pendiente + 0.001) {
    return NextResponse.json({ error: `El abono excede el saldo pendiente. Faltan S/ ${pendiente.toFixed(2)}` }, { status: 400 })
  }

  const { data: abono, error: insertError } = await supabaseAdmin
    .from('venta_abonos')
    .insert({
      venta_id: id,
      monto: montoNum,
      metodo_pago:
        metodo_pago === 'EFECTIVO' ||
        metodo_pago === 'YAPE_PLIN' ||
        metodo_pago === 'TARJETA'
          ? metodo_pago
          : 'EFECTIVO',
      notas: notas || null,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: mensajeDb(insertError) }, { status: 500 })
  }

  const nuevoPagado = Math.round((yaPagado + montoNum) * 100) / 100
  const seCompleta = nuevoPagado >= Number(venta.total) - 0.001

  const updates: Record<string, any> = {
    monto_pagado: nuevoPagado,
    updated_at: new Date().toISOString(),
  }
  if (seCompleta) updates.estado = 'COMPLETADA'

  const { data: ventaActualizada } = await supabaseAdmin
    .from('ventas')
    .update(updates)
    .eq('id', id)
    .eq('profile_id', auth.ownerId)
    .select('id, estado, total, monto_pagado')
    .single()

  return NextResponse.json({
    data: abono,
    venta: ventaActualizada,
    completada: seCompleta,
  })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlus('ver_ventas')
  if (!auth.ok) return auth.response
  const { id } = await params

  if (!(await ventaEsDelNegocio(id, auth.ownerId))) {
    return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  }
  const abonoId = new URL(request.url).searchParams.get('abono_id')

  if (!abonoId) {
    return NextResponse.json({ error: 'abono_id requerido' }, { status: 400 })
  }

  const { data: abono, error: fetchError } = await supabaseAdmin
    .from('venta_abonos')
    .select('venta_id, monto')
    .eq('id', abonoId)
    .single()

  if (fetchError || !abono) {
    return NextResponse.json({ error: 'Abono no encontrado' }, { status: 404 })
  }

  if (abono.venta_id !== id) {
    return NextResponse.json({ error: 'El abono no pertenece a esta venta.' }, { status: 400 })
  }

  const { data: venta } = await supabaseAdmin
    .from('ventas')
    .select('total, estado, monto_pagado')
    .eq('id', id)
    .eq('profile_id', auth.ownerId)
    .single()

  const nuevoPagado = Math.max(0, Number(venta?.monto_pagado ?? 0) - Number(abono.monto))
  const fueCompletadaPorEsteAbono = venta?.estado === 'COMPLETADA' && nuevoPagado < Number(venta.total)

  const { error: deleteError } = await supabaseAdmin
    .from('venta_abonos')
    .delete()
    .eq('id', abonoId)

  if (deleteError) {
    return NextResponse.json({ error: mensajeDb(deleteError) }, { status: 500 })
  }

  const updates: Record<string, any> = {
    monto_pagado: Math.round(nuevoPagado * 100) / 100,
    updated_at: new Date().toISOString(),
  }
  if (fueCompletadaPorEsteAbono) updates.estado = 'PENDIENTE'

  const { data: ventaActualizada } = await supabaseAdmin
    .from('ventas')
    .update(updates)
    .eq('id', id)
    .eq('profile_id', auth.ownerId)
    .select('id, estado, total, monto_pagado')
    .single()

  return NextResponse.json({ success: true, venta: ventaActualizada })
}