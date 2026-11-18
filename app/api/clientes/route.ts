import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { coincide } from '@/lib/buscar'

// Normaliza dni/teléfono para comparaciones: quita espacios y caracteres invisibles
function norm(v: string | null | undefined): string {
  return (v || '').replace(/\s+/g, '').toUpperCase()
}

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
    const dni = norm(p.dni)
    const telefono = norm(p.telefono)
    if (dni) {
      if (porDni.has(dni)) union(porDni.get(dni)!, i)
      else porDni.set(dni, i)
    }
    if (telefono) {
      if (porTelefono.has(telefono)) union(porTelefono.get(telefono)!, i)
      else porTelefono.set(telefono, i)
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
  const auth = await requirePlus('ver_clientes')
  if (!auth.ok) return auth.response
  const userId = auth.ownerId

  const { searchParams } = new URL(request.url)
  const busqueda = (searchParams.get('busqueda') || '').trim().toLowerCase()

  const { data: agrupados, error } = await supabaseAdmin.rpc('tori_datos_clientes', { p_owner: userId })
  if (error) return NextResponse.json({ error: 'No se pudo calcular la lista de clientes.' }, { status: 503 })
  const { personas, ventas, envios } = agrupados

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

    const dniPreferido = miembros.find((p) => norm(p.dni))?.dni || null
    const telPreferido = miembros.find((p) => norm(p.telefono))?.telefono || null

    const misEnvios = (envios ?? []).filter((e: { dni?: string; telefono?: string }) =>
      (dniPreferido && norm(e.dni) === norm(dniPreferido)) ||
      (telPreferido && norm(e.telefono) === norm(telPreferido))
    )
    const cantidadEnvios = misEnvios.reduce((s: number, e: { cantidad: number }) => s + Number(e.cantidad), 0)
    const fechas = [
      ...misVentas.map((v: { created_at: string }) => v.created_at),
      ...misEnvios.map((e: { fecha_registro: string }) => e.fecha_registro),
    ]
    const ultima = fechas.length ? fechas.reduce((a: string, b: string) => (a > b ? a : b)) : null

    // Validar que no haya personas sin dni ni teléfono (no se pueden detectar duplicados)
    if (!principal) continue

    // El motor de búsqueda trata el espacio como un Y: "juan perez" trae solo
    // los clientes que tienen las dos palabras, en cualquier campo y en
    // cualquier orden. Antes se comparaba la frase completa, así que ese
    // cliente no aparecía nunca.
    if (
      busqueda &&
      !coincide(
        { dni: dniPreferido, tel: telPreferido },
        [principal.nombre, dniPreferido, telPreferido],
        busqueda
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
      nombre: (principal.nombre || '').trim(),
      dni: dniPreferido ? dniPreferido.trim() : null,
      telefono: telPreferido ? telPreferido.trim() : null,
      ventas: misVentas.reduce((s: number, v: { cantidad: number }) => s + Number(v.cantidad), 0),
      totalVentas,
      envios: cantidadEnvios,
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