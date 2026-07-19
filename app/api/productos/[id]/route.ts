import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('productos')
    .update({
      nombre: body.nombre,
      sku: body.sku ?? null,
      descripcion: body.descripcion ?? null,
      precio_venta: body.precio_venta ?? 0,
      precio_compra: body.precio_compra ?? 0,
      stock_actual: body.stock_actual ?? 0,
      stock_minimo: body.stock_minimo ?? 0,
      unidad: body.unidad || 'unidad',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabaseAdmin
    .from('productos')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
