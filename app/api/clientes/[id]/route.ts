import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

function norm(v: string | null | undefined): string {
  return (v || '').replace(/\s+/g, '').toUpperCase()
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { user_id, nombre, dni, telefono } = body

  if (!user_id) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  // Limpiar datos: sin espacios ni caracteres invisibles
  const dniLimpio = dni !== undefined && dni !== null ? String(dni).replace(/\s+/g, '') : undefined
  const telLimpio = telefono !== undefined && telefono !== null ? String(telefono).replace(/\s+/g, '') : undefined

  // Un cliente puede ser un grupo de personas duplicadas (mismo dni o teléfono)
  const idsPersona = Array.isArray(body.ids) && body.ids.length ? body.ids : [id]

  const { data: personas, error: fetchError } = await supabaseAdmin
    .from('personas')
    .select('id, nombre, dni, telefono')
    .in('id', idsPersona)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  if (!personas || personas.length === 0) {
    return NextResponse.json({ error: 'No se encontró el cliente' }, { status: 404 })
  }

  // Chequear que el nuevo DNI no le pertenezca a otra persona (dni único)
  if (dniLimpio) {
    const { data: personasTodas } = await supabaseAdmin
      .from('personas')
      .select('id, dni')
      .neq('dni', null)
    const duplicado = (personasTodas || []).find(
      (p: any) => norm(p.dni) === norm(dniLimpio) && !idsPersona.includes(p.id)
    )
    if (duplicado) {
      return NextResponse.json({ error: 'Ese DNI ya está registrado en otro cliente' }, { status: 400 })
    }
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (nombre) updates.nombre = (nombre as string).trim()
  if (dni !== undefined) updates.dni = dniLimpio || null
  if (telefono !== undefined) updates.telefono = telLimpio || null

  const { error: updateError } = await supabaseAdmin
    .from('personas')
    .update(updates)
    .in('id', idsPersona)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Backfill a ventas (datos snapshot del momento de la venta)
  const ventaBackfill: Record<string, any> = { updated_at: new Date().toISOString() }
  if (nombre) ventaBackfill.persona_nombre = (nombre as string).trim()
  if (dni !== undefined) ventaBackfill.persona_dni = dniLimpio || null
  if (telefono !== undefined) ventaBackfill.persona_telefono = telLimpio || null
  await supabaseAdmin
    .from('ventas')
    .update(ventaBackfill)
    .in('persona_id', idsPersona)
    .eq('profile_id', user_id)

  // Backfill a envíos que coincidan con el dni o teléfono anterior del grupo
  const envioBackfill: Record<string, any> = {}
  if (nombre) envioBackfill.nombre = nombre
  if (dni !== undefined) envioBackfill.dni = dni || null
  if (telefono !== undefined) envioBackfill.telefono = telefono || null
  if (Object.keys(envioBackfill).length > 0) {
    // Buscar envíos que coincidan con los dni/teléfonos anteriores del grupo (normalizados)
    const { data: envios } = await supabaseAdmin
      .from('envios')
      .select('id, dni, telefono')
      .eq('user_id', user_id)

    const vistos = new Set<string>()
    for (const p of personas) {
      const pdni = norm(p.dni)
      const ptel = norm(p.telefono)
      if (pdni && !vistos.has(`d:${pdni}`)) {
        for (const e of envios ?? []) {
          if (norm(e.dni) === pdni) {
            await supabaseAdmin.from('envios').update(envioBackfill).eq('id', e.id)
          }
        }
        vistos.add(`d:${pdni}`)
      }
      if (ptel && !vistos.has(`t:${ptel}`)) {
        for (const e of envios ?? []) {
          if (norm(e.telefono) === ptel) {
            await supabaseAdmin.from('envios').update(envioBackfill).eq('id', e.id)
          }
        }
        vistos.add(`t:${ptel}`)
      }
    }
  }

  return NextResponse.json({ data: { id, ...updates } })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { user_id } = body

  if (!user_id) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const idsPersona = Array.isArray(body.ids) && body.ids.length ? body.ids : [id]

  // Quitar el cliente de la lista de este negocio
  await supabaseAdmin
    .from('cliente_de')
    .delete()
    .in('persona_id', idsPersona)
    .eq('profile_id', user_id)

  // Si la persona no tiene ventas, eliminarla por completo
  for (const pid of idsPersona) {
    const { count } = await supabaseAdmin
      .from('ventas')
      .select('id', { count: 'exact', head: true })
      .eq('persona_id', pid)
    if (count === 0) {
      await supabaseAdmin.from('personas').delete().eq('id', pid)
    }
  }

  return NextResponse.json({ success: true })
}