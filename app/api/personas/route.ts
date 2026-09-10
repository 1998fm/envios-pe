import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

function norm(v: string | null | undefined): string {
  return (v || '').replace(/\s+/g, '').toUpperCase()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const busqueda = (searchParams.get('busqueda') || '').trim()

  if (!userId || !busqueda) {
    return NextResponse.json({ data: null })
  }

  const qNorm = norm(busqueda)

  // Buscar por DNI exacto (lo más común)
  const { data: personasDni } = await supabaseAdmin
    .from('personas')
    .select('*')
    .neq('dni', null)
  const porDni = (personasDni || []).find((p: any) => norm(p.dni) === qNorm)

  if (porDni) return NextResponse.json({ data: porDni })

  // Buscar por teléfono exacto
  const { data: personasTel } = await supabaseAdmin
    .from('personas')
    .select('*')
    .neq('telefono', null)
  const porTel = (personasTel || []).find((p: any) => norm(p.telefono) === qNorm)

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
  const { user_id, nombre } = body
  const dni = body.dni ? String(body.dni).replace(/\s+/g, '') : null
  const telefono = body.telefono ? String(body.telefono).replace(/\s+/g, '') : null

  if (!user_id || !nombre) {
    return NextResponse.json({ error: 'user_id y nombre son requeridos' }, { status: 400 })
  }

  // Buscar por DNI primero (comparación normalizada: sin espacios)
  if (dni) {
    const { data: personasPorDni } = await supabaseAdmin
      .from('personas')
      .select('id, telefono, nombre')
      .neq('dni', null)
    const existing = (personasPorDni || []).find((p: any) => norm(p.dni) === norm(dni))

    if (existing) {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (telefono && existing.telefono !== telefono) updates.telefono = telefono
      if (nombre && existing.nombre !== nombre) updates.nombre = nombre
      if (Object.keys(updates).length > 1) {
        await supabaseAdmin.from('personas').update(updates).eq('id', existing.id)
      }
      const ventaBackfill: Record<string, any> = { updated_at: new Date().toISOString() }
      if (telefono) ventaBackfill.persona_telefono = telefono
      if (nombre) ventaBackfill.persona_nombre = nombre
      await supabaseAdmin.from('ventas').update(ventaBackfill).eq('persona_id', existing.id)
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

  // Buscar por teléfono si no se encontró por DNI (comparación normalizada)
  if (telefono) {
    const { data: personasTel } = await supabaseAdmin
      .from('personas')
      .select('id, dni, nombre, telefono')
      .neq('telefono', null)

    const coincidencias = (personasTel || []).filter((p: any) => norm(p.telefono) === norm(telefono))

    let existing = coincidencias.length > 0 ? coincidencias[0] : null
    if (coincidencias.length > 1) {
      for (const p of coincidencias) {
        const { data: vinculo } = await supabaseAdmin
          .from('cliente_de')
          .select('id')
          .eq('persona_id', p.id)
          .eq('profile_id', user_id)
          .maybeSingle()
        if (vinculo) {
          existing = p
          break
        }
      }
    }

    if (existing) {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (dni && existing.dni !== dni) updates.dni = dni
      if (nombre && existing.nombre !== nombre) updates.nombre = nombre
      if (Object.keys(updates).length > 1) {
        await supabaseAdmin.from('personas').update(updates).eq('id', existing.id)
      }
      const ventaBackfill: Record<string, any> = { updated_at: new Date().toISOString() }
      if (telefono) ventaBackfill.persona_telefono = telefono
      if (nombre) ventaBackfill.persona_nombre = nombre
      await supabaseAdmin.from('ventas').update(ventaBackfill).eq('persona_id', existing.id)
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
