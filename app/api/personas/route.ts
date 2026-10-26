import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireNegocio } from '@/lib/negocioAuth'
import { mensajeDb } from '@/lib/erroresEs'

function norm(v: string | null | undefined): string {
  return (v || '').replace(/\s+/g, '').toUpperCase()
}

// La búsqueda se hace en el servidor (filtrando por DNI o teléfono),
// NO trayendo todas las personas: la tabla puede superar las 1000 filas y un
// select sin límite se trunca, dejando a los clientes recién registrados fuera.
export async function GET(request: Request) {
  // Antes era público y buscaba en TODA la plataforma: cualquiera podía sacar
  // nombre y teléfono de una persona probando DNIs. Ahora exige sesión y solo
  // encuentra a los clientes ya vinculados al negocio de quien llama.
  const auth = await requireNegocio('ver_ventas', 'ver_clientes', 'ver_envios')
  if (!auth.ok) return auth.response
  const userId = auth.ownerId

  const { searchParams } = new URL(request.url)
  const busqueda = (searchParams.get('busqueda') || '').trim()

  if (!busqueda) {
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

  const candidatas = (personas.data || []).filter(
    (p: any) => norm(p.dni) === qNorm || norm(p.telefono) === qNorm
  )

  let data: any = null
  if (candidatas.length > 0) {
    const { data: vinculos } = await supabaseAdmin
      .from('cliente_de')
      .select('persona_id')
      .eq('profile_id', userId)
      .in('persona_id', candidatas.map((p: any) => p.id))
    const propias = new Set((vinculos ?? []).map((v: any) => v.persona_id))
    data = candidatas.find((p: any) => propias.has(p.id)) ?? null
  }

  if (data) return NextResponse.json({ data })

  // Solo se busca por DNI o teléfono exactos. No se busca por nombre:
  // un nombre repetido (p. ej. "Juana") podría tomar un cliente equivocado.
  return NextResponse.json({ data: null })
}

export async function POST(request: Request) {
  const auth = await requireNegocio('ver_ventas', 'ver_clientes', 'ver_envios')
  if (!auth.ok) return auth.response
  const user_id = auth.ownerId

  const body = await request.json()
  const { nombre } = body
  const dni = body.dni ? String(body.dni).replace(/\s+/g, '') : null
  const telefono = body.telefono ? String(body.telefono).replace(/\s+/g, '') : null

  if (!nombre) {
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })
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
    // `personas` es compartida entre negocios: solo se edita la ficha (y las
    // ventas) si ya es cliente de este negocio. Si no, solo se vincula.
    const { data: yaVinculada } = await supabaseAdmin
      .from('cliente_de')
      .select('id')
      .eq('persona_id', existing.id)
      .eq('profile_id', user_id)
      .maybeSingle()

    if (!yaVinculada) {
      await supabaseAdmin.from('cliente_de').insert({ persona_id: existing.id, profile_id: user_id })
      return NextResponse.json({ data: { id: existing.id } })
    }

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
    await supabaseAdmin
      .from('ventas')
      .update(ventaBackfill)
      .eq('persona_id', existing.id)
      .eq('profile_id', user_id)
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
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  await supabaseAdmin
    .from('cliente_de')
    .insert({ persona_id: data.id, profile_id: user_id })

  return NextResponse.json({ data })
}
