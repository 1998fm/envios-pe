import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { user_id, nombre, dni, telefono } = body

  if (!user_id) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const { data: persona, error: fetchError } = await supabaseAdmin
    .from('personas')
    .select('id, nombre, dni, telefono')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (nombre) updates.nombre = nombre
  if (dni !== undefined) updates.dni = dni || null
  if (telefono !== undefined) updates.telefono = telefono || null

  const { error: updateError } = await supabaseAdmin
    .from('personas')
    .update(updates)
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Backfill a ventas (datos snapshot del momento de la venta)
  const ventaBackfill: Record<string, any> = { updated_at: new Date().toISOString() }
  if (nombre) ventaBackfill.persona_nombre = nombre
  if (dni !== undefined) ventaBackfill.persona_dni = dni || null
  if (telefono !== undefined) ventaBackfill.persona_telefono = telefono || null
  await supabaseAdmin
    .from('ventas')
    .update(ventaBackfill)
    .eq('persona_id', id)
    .eq('profile_id', user_id)

  // Backfill a envíos que coincidan con dni o teléfono anteriores
  const envioBackfill: Record<string, any> = {}
  if (nombre) envioBackfill.nombre = nombre
  if (dni !== undefined) envioBackfill.dni = dni || null
  if (telefono !== undefined) envioBackfill.telefono = telefono || null
  if (Object.keys(envioBackfill).length > 0) {
    const matchFiltros: any[] = []
    if (persona.dni) matchFiltros.push(`dni.eq.${persona.dni}`)
    if (persona.telefono) matchFiltros.push(`telefono.eq.${persona.telefono}`)
    if (matchFiltros.length > 0) {
      await supabaseAdmin
        .from('envios')
        .update(envioBackfill)
        .eq('user_id', user_id)
        .or(matchFiltros.join(','))
    }
  }

  return NextResponse.json({ data: { ...persona, ...updates } })
}