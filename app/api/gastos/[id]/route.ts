import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { mensajeDb } from '@/lib/erroresEs'

const CATEGORIAS_GASTO = ['MATERIALES', 'PASAJES', 'DELIVERY', 'PUBLICIDAD', 'SERVICIOS', 'OTROS']

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlus('ver_gastos')
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await request.json()

  if ('categoria' in body && !CATEGORIAS_GASTO.includes(body.categoria)) {
    return NextResponse.json({ error: 'Categoría no válida' }, { status: 400 })
  }

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
    .eq('profile_id', auth.ownerId)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlus('ver_gastos')
  if (!auth.ok) return auth.response
  const { id } = await params

  const { data: borrados, error } = await supabaseAdmin
    .from('gastos')
    .delete()
    .eq('id', id)
    .eq('profile_id', auth.ownerId)
    .select('id')

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }
  if (!borrados?.length) {
    return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
