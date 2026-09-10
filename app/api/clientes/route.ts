import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

// Union-find para agrupar personas que comparten dni o teléfono (misma persona).
function agruparPersonas(personas: any[]) {
  const parent = personas.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const union = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }

  const porDni = new Map<string, number>()
  const porTelefono = new Map<string, number>()

  personas.forEach((p, i) => {
    if (p.dni) {
      if (porDni.has(p.dni)) union(porDni.get(p.dni)!, i)
      else porDni.set(p.dni, i)
    }
    if (p.telefono) {
      if (porTelefono.has(p.telefono)) union(porTelefono.get(p.telefono)!, i)
      else porTelefono.set(p.telefono, i)
    }
  })

  const grupos: number[][] = []
  const indexPorRaiz = new Map<number, number>()
  personas.forEach((_, i) => {
    const raiz = find(i)
    if (!indexPorRaiz.has(raiz)) {
      indexPorRaiz.set(raiz, grupos.length)
      grupos.push([])
    }
    grupos[indexPorRaiz.get(raiz)!].push(i)
  })
  return grupos
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const busqueda = (searchParams.get('busqueda') || '').trim().toLowerCase()

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const [{ data: vinculos }, { data: ventas }, { data: envios }] = await Promise.all([
    supabaseAdmin
      .from('cliente_de')
      .select('personas(*)')
      .eq('profile_id', userId),
    supabaseAdmin
      .from('ventas')
      .select('persona_id, total, estado, created_at')
      .eq('profile_id', userId),
    supabaseAdmin
      .from('envios')
      .select('id, dni, telefono, fecha_registro')
      .eq('user_id', userId),
  ])

  const personas = (vinculos ?? [])
    .map((v: any) => v.personas)
    .filter(Boolean)

  const grupos = agruparPersonas(personas)

  const clientes: any[] = []

  for (const inds of grupos) {
    const miembros = inds.map((i) => personas[i])

    // El "principal" es la persona más completa: con dni y teléfono > con dni > con teléfono > más reciente
    const principal = [...miembros].sort((a, b) => {
      const score = (p: any) =>
        (p.dni ? 2 : 0) + (p.telefono ? 1 : 0) + (p.nombre ? 0.5 : 0)
      return score(b) - score(a)
    })[0]

    const idPersonas = miembros.map((p) => p.id)
    const misVentas = (ventas ?? []).filter(
      (v: any) => idPersonas.includes(v.persona_id) && (v.estado === 'COMPLETADA' || v.estado === 'PENDIENTE')
    )
    const totalVentas = misVentas.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0)

    const dniPreferido = miembros.find((p) => p.dni)?.dni || null
    const telPreferido = miembros.find((p) => p.telefono)?.telefono || null

    const idsEnvios = new Set<string>()
    for (const e of envios ?? []) {
      const coincide =
        (dniPreferido && e.dni === dniPreferido) ||
        (telPreferido && e.telefono === telPreferido)
      if (coincide) idsEnvios.add(e.id)
    }

    const fechas = [
      ...misVentas.map((v: any) => v.created_at),
      ...(envios ?? []).filter((e: any) => idsEnvios.has(e.id)).map((e: any) => e.fecha_registro),
    ]
    const ultima = fechas.length ? fechas.reduce((a: string, b: string) => (a > b ? a : b)) : null

    // Validar que no haya personas sin dni ni teléfono (no se pueden detectar duplicados)
    if (!principal) continue

    if (
      busqueda &&
      !(
        (principal.nombre || '').toLowerCase().includes(busqueda) ||
        (dniPreferido || '').toLowerCase().includes(busqueda) ||
        (telPreferido || '').toLowerCase().includes(busqueda)
      )
    ) {
      continue
    }

    // El cliente usuario "principal" para mostrar
    const idCliente = principal.id

    clientes.push({
      id: idCliente,
      clave: idPersonas.slice().sort().join('|'),
      ids: idPersonas,
      nombre: principal.nombre,
      dni: dniPreferido,
      telefono: telPreferido,
      ventas: misVentas.length,
      totalVentas,
      envios: idsEnvios.size,
      ultimaActividad: ultima,
      created_at: principal.created_at,
    })
  }

  clientes.sort((a: any, b: any) => {
    const fa = a.ultimaActividad || ''
    const fb = b.ultimaActividad || ''
    return fa > fb ? -1 : fa < fb ? 1 : 0
  })

  return NextResponse.json({ data: clientes })
}