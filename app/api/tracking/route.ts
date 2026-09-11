import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

function norm(v: string | null | undefined): string {
  return (v || '').replace(/\s+/g, '').toUpperCase()
}

// Tracking público del cliente: dado el slug (user_id del local) + DNI +
// teléfono, devuelve SOLO los envíos que ese cliente generó en ESE local.
// Un mismo DNI en varios negocios de la plataforma vive en filas con user_id
// distintos, así que filtrar por user_id garantiza que nunca se mezclen.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const dni = norm(searchParams.get('dni'))

  if (!userId || !dni) {
    return NextResponse.json({ data: null })
  }

  // Envíos del local (user_id) del último año, con sus ventas e items.
  // Se filtran por coincidencia normalizada de DNI en memoria: tolera
  // espacios/formatos distintos a como se guardaron.
  const haceUnAno = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const { data: envios, error } = await supabaseAdmin
    .from('envios')
    .select('*')
    .eq('user_id', userId)
    .gte('fecha_registro', haceUnAno)
    .order('fecha_registro', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const coinciden = (envios || []).filter((e: any) => norm(e.dni) === dni)

  if (coinciden.length === 0) {
    return NextResponse.json({ data: [] })
  }

  // Ventas vinculadas a esos envíos + sus items (prendas/montos)
  const envioIds = coinciden.map((e: any) => e.id)
  const [ventasRes, itemsRes] = await Promise.all([
    supabaseAdmin
      .from('ventas')
      .select('*')
      .in('envio_id', envioIds)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('venta_items')
      .select('venta_id, producto_nombre, cantidad, precio_unitario, subtotal'),
  ])

  const itemsPorVenta = new Map<string, any[]>()
  for (const item of itemsRes.data || []) {
    const lista = itemsPorVenta.get(item.venta_id) || []
    lista.push(item)
    itemsPorVenta.set(item.venta_id, lista)
  }

  const ventasPorEnvio = new Map<string, any[]>()
  for (const v of ventasRes.data || []) {
    if (!v.envio_id) continue
    const lista = ventasPorEnvio.get(v.envio_id) || []
    lista.push({
      id: v.id,
      codigo: v.codigo,
      estado: v.estado,
      total: v.total,
      created_at: v.created_at,
      items: itemsPorVenta.get(v.id) || [],
    })
    ventasPorEnvio.set(v.envio_id, lista)
  }

  const data = coinciden.map((e: any) => ({
    id: e.id,
    codigo: e.codigo,
    nombre: e.nombre,
    estado: e.estado,
    metodo: e.metodo,
    nombre_metodo: e.nombre_metodo,
    destino: e.destino,
    direccion: e.direccion,
    detalle: e.detalle,
    fecha_registro: e.fecha_registro,
    fecha_programada: e.fecha_programada,
    ventas: ventasPorEnvio.get(e.id) || [],
  }))

  return NextResponse.json({ data })
}