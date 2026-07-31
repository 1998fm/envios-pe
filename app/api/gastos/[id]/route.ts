import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const fields: Record<string, any> = {}
  if ('categoria' in body) fields.categoria = body.categoria
  if ('concepto' in body) fields.concepto = body.concepto
  if ('monto' in body) fields.monto = Math.max(0, Number(body.monto) || 0)
  if ('fecha' in body) fields.fecha = body.fecha
  if ('notas' in body) fields.notas = body.notas || null
  fields.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('gastos')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabaseAdmin
    .from('gastos')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
