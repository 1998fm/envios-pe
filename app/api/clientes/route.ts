import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

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
      .select('dni, telefono, fecha_registro')
      .eq('user_id', userId),
  ])

  const personas = (vinculos ?? [])
    .map((v: any) => v.personas)
    .filter(Boolean)
    .filter((p: any) => {
      if (!busqueda) return true
      return (
        (p.nombre || '').toLowerCase().includes(busqueda) ||
        (p.dni || '').toLowerCase().includes(busqueda) ||
        (p.telefono || '').toLowerCase().includes(busqueda)
      )
    })

  const clientes = personas.map((p: any) => {
    const misVentas = (ventas ?? []).filter(
      (v: any) => v.persona_id === p.id && (v.estado === 'COMPLETADA' || v.estado === 'PENDIENTE')
    )
    const totalVentas = misVentas.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0)
    const misEnvios = (envios ?? []).filter(
      (e: any) => (e.dni && e.dni === p.dni) || (e.telefono && e.telefono === p.telefono)
    )
    const fechas = [
      ...misVentas.map((v: any) => v.created_at),
      ...misEnvios.map((e: any) => e.fecha_registro),
    ]
    const ultima = fechas.length ? fechas.reduce((a: string, b: string) => (a > b ? a : b)) : null

    return {
      id: p.id,
      nombre: p.nombre,
      dni: p.dni,
      telefono: p.telefono,
      ventas: misVentas.length,
      totalVentas,
      envios: misEnvios.length,
      ultimaActividad: ultima,
      created_at: p.created_at,
    }
  })

  clientes.sort((a: any, b: any) => {
    const fa = a.ultimaActividad || ''
    const fb = b.ultimaActividad || ''
    return fa > fb ? -1 : fa < fb ? 1 : 0
  })

  return NextResponse.json({ data: clientes })
}