import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const busqueda = searchParams.get('busqueda') || ''

  if (!userId || !busqueda) {
    return NextResponse.json({ data: null })
  }

  // Buscar por DNI exacto (lo más común)
  const { data: porDni } = await supabaseAdmin
    .from('personas')
    .select('*')
    .eq('dni', busqueda)
    .maybeSingle()

  if (porDni) return NextResponse.json({ data: porDni })

  // Buscar por teléfono exacto
  const { data: porTel } = await supabaseAdmin
    .from('personas')
    .select('*')
    .eq('telefono', busqueda)
    .maybeSingle()

  if (porTel) return NextResponse.json({ data: porTel })

  // Búsqueda parcial
  const { data: resultados } = await supabaseAdmin
    .from('personas')
    .select('*')
    .or(`nombre.ilike.%${busqueda}%,dni.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)
    .limit(5)

  if (resultados && resultados.length > 0) {
    return NextResponse.json({ data: resultados[0] })
  }

  return NextResponse.json({ data: null })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, dni, nombre, telefono } = body

  if (!user_id || !nombre) {
    return NextResponse.json({ error: 'user_id y nombre son requeridos' }, { status: 400 })
  }

  // Buscar por DNI primero
  if (dni) {
    const { data: existing } = await supabaseAdmin
      .from('personas')
      .select('id, telefono, nombre')
      .eq('dni', dni)
      .maybeSingle()

    if (existing) {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (telefono && existing.telefono !== telefono) updates.telefono = telefono
      if (nombre && existing.nombre !== nombre) updates.nombre = nombre
      if (Object.keys(updates).length > 1) {
        await supabaseAdmin.from('personas').update(updates).eq('id', existing.id)
      }
      const { data: vinculo } = await supabaseAdmin
        .from('cliente_de')
        .select('id')
        .eq('persona_id', existing.id)
        .eq('profile_id', user_id)
        .maybeSingle()
      if (!vinculo) {
        await supabaseAdmin.from('cliente_de').insert({ persona_id: existing.id, profile_id: user_id })
      }
      return NextResponse.json({ data: { id: existing.id } })
    }
  }

  // Buscar por teléfono si no se encontró por DNI
  if (telefono) {
    const { data: existing } = await supabaseAdmin
      .from('personas')
      .select('id, dni, nombre')
      .eq('telefono', telefono)
      .maybeSingle()

    if (existing) {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (dni && existing.dni !== dni) updates.dni = dni
      if (nombre && existing.nombre !== nombre) updates.nombre = nombre
      if (Object.keys(updates).length > 1) {
        await supabaseAdmin.from('personas').update(updates).eq('id', existing.id)
      }
      const { data: vinculo } = await supabaseAdmin
        .from('cliente_de')
        .select('id')
        .eq('persona_id', existing.id)
        .eq('profile_id', user_id)
        .maybeSingle()
      if (!vinculo) {
        await supabaseAdmin.from('cliente_de').insert({ persona_id: existing.id, profile_id: user_id })
      }
      return NextResponse.json({ data: { id: existing.id } })
    }
  }

  // No existe: crear nueva persona
  const { data, error } = await supabaseAdmin
    .from('personas')
    .insert({ dni: dni || null, nombre, telefono: telefono || null })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAdmin
    .from('cliente_de')
    .insert({ persona_id: data.id, profile_id: user_id })

  return NextResponse.json({ data })
}
