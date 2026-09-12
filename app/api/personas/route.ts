import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

function norm(v: string | null | undefined): string {
  return (v || '').replace(/\s+/g, '').toUpperCase()
}

// La búsqueda se hace en el servidor (filtrando por DNI o teléfono),
// NO trayendo todas las personas: la tabla puede superar las 1000 filas y un
// select sin límite se trunca, dejando a los clientes recién registrados fuera.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const busqueda = (searchParams.get('busqueda') || '').trim()

  if (!userId || !busqueda) {
    return NextResponse.json({ data: null })
  }

  const qNorm = norm(busqueda)

  // Buscar por DNI o teléfono exacto (lo más común). La comparación se
  // normaliza: sin espacios, mayúsculas, y se hace en el servidor. Solo se
  // traen las filas candidatas (un select sin límite se trunca en 1000 y
  // dejaría afuera a los clientes recién registrados).
  const terminoSeguro = qNorm.replace(/[,;]/g, '')
  const personas = await supabaseAdmin
    .from('personas')
    .select('*')
    .or(`dni.ilike.${terminoSeguro},telefono.ilike.${terminoSeguro}`)
    .limit(50)

  const data = (personas.data || []).find(
    (p: any) => norm(p.dni) === qNorm || norm(p.telefono) === qNorm
  )

  if (data) return NextResponse.json({ data })

  // Solo se busca por DNI o teléfono exactos. No se busca por nombre:
  // un nombre repetido (p. ej. "Juana") podría tomar un cliente equivocado.
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

  // Buscar persona existente por DNI o teléfono (comparación normalizada,
  // con filtro en el servidor para no truncar la búsqueda en 1000 filas)
  let existing: { id: string; dni: string | null; nombre: string; telefono: string | null } | null = null

  // Buscar por DNI exacto (lo más común)
  if (dni) {
    const { data: personasDni } = await supabaseAdmin
      .from('personas')
      .select('id, dni, telefono, nombre')
      .ilike('dni', `%${dni.replace(/[;,]/g, '')}%`)
      .limit(50)
    existing = (personasDni || []).find((p: any) => norm(p.dni) === norm(dni)) || null
  }

  // Buscar por teléfono si no se encontró por DNI
  if (!existing && telefono) {
    const { data: personasTel } = await supabaseAdmin
      .from('personas')
      .select('id, dni, telefono, nombre')
      .ilike('telefono', `%${telefono.replace(/[;,]/g, '')}%`)
      .limit(50)

    const coincidencias = (personasTel || []).filter((p: any) => norm(p.telefono) === norm(telefono))

    if (coincidencias.length > 0) {
      existing = coincidencias[0]
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
    }
  }

  if (existing) {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (dni && existing.dni !== dni) updates.dni = dni
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
