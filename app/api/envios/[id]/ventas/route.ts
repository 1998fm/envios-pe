import { normalizarIdentificador, patronIdentificador } from '@/lib/identidadCliente'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { idsValidos } from '@/lib/enviosServidor'
import { mensajeDb } from '@/lib/erroresEs'

type VentaFila = {
  id: string
  codigo?: string | null
  estado: string
  estado_envio?: string | null
  total: number
  persona_nombre: string
  persona_dni?: string | null
  persona_telefono?: string | null
  envio_id?: string | null
}

// Ventas del cliente de este pedido, con sus ítems (detalle del pedido).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlus('ver_envios')
  if (!auth.ok) return auth.response
  const { id } = await params

  const { data: envio } = await supabaseAdmin
    .from('envios')
    .select('id, dni, telefono, estado')
    .eq('id', id)
    .eq('user_id', auth.ownerId)
    .maybeSingle()
  if (!envio) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  // 1) Ventas ya ligadas directamente a este pedido (relación confiable). No se
  //    filtran por estado_envio: al pasar el pedido a ENVIADO deben seguir viéndose.
  const { data: porEnvio } = await supabaseAdmin
    .from('ventas')
    .select('*')
    .eq('envio_id', id)
    .eq('profile_id', auth.ownerId)
    .in('estado', ['COMPLETADA', 'PENDIENTE'])
    .order('created_at', { ascending: false })

  let ventas: VentaFila[] = (porEnvio ?? []) as VentaFila[]

  // 2) Completar con ventas pendientes sin ligar, incluso si ya hay otras vinculadas.
  //    Coinciden por DNI o teléfono normalizado y
  //    aún no pertenezcan a otro pedido.
  if (envio.estado !== 'ENVIADO') {
    const dni = normalizarIdentificador(envio.dni)
    const tel = normalizarIdentificador(envio.telefono)
    const condiciones: string[] = []
    if (dni) condiciones.push(`persona_dni.ilike.${patronIdentificador(dni)}`)
    if (tel) condiciones.push(`persona_telefono.ilike.${patronIdentificador(tel)}`)
    if (condiciones.length > 0) {
      const { data } = await supabaseAdmin
        .from('ventas')
        .select('*')
        .eq('profile_id', auth.ownerId)
        .or(condiciones.join(','))
        .in('estado', ['COMPLETADA', 'PENDIENTE'])
        .not('estado_envio', 'eq', 'COMPLETADO')
        .order('created_at', { ascending: false })
        .limit(100)
      const pendientes = ((data ?? []) as VentaFila[]).filter((v) =>
        (!v.envio_id || v.envio_id === id) &&
        ((dni && normalizarIdentificador(v.persona_dni) === dni) ||
          (tel && normalizarIdentificador(v.persona_telefono) === tel))
      )
      ventas = [...new Map([...ventas, ...pendientes].map(v => [v.id, v])).values()]
    }
  }

  const idsVentas = [...new Set(ventas.map((v) => v.id))]
  if (idsVentas.length === 0) return NextResponse.json({ data: [] })

  const { data: items } = await supabaseAdmin.from('venta_items').select('*').in('venta_id', idsVentas)
  const porVenta = new Map<string, unknown[]>()
  for (const it of items ?? []) {
    const lista = porVenta.get(it.venta_id) ?? []
    lista.push({
      id: it.id,
      venta_id: it.venta_id,
      producto_nombre: it.producto_nombre,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      subtotal: it.subtotal,
    })
    porVenta.set(it.venta_id, lista)
  }

  return NextResponse.json({
    data: ventas.map((v) => ({
      id: v.id,
      codigo: v.codigo,
      estado: v.estado,
      estado_envio: v.estado_envio || 'PENDIENTE',
      total: v.total,
      persona_nombre: v.persona_nombre,
      items: porVenta.get(v.id) ?? [],
    })),
  })
}

// "Validar contenido": marca como empacadas las ventas del pedido.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlus('ver_envios')
  if (!auth.ok) return auth.response
  const { id } = await params

  const body = await request.json().catch(() => ({}))
  const ventaIds = idsValidos(body.venta_ids)
  if (ventaIds.length === 0) return NextResponse.json({ error: 'Sin ventas' }, { status: 400 })

  const { data: envio } = await supabaseAdmin
    .from('envios')
    .select('id')
    .eq('id', id)
    .eq('user_id', auth.ownerId)
    .maybeSingle()
  if (!envio) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  // Solo ventas del negocio que estén libres o ya ligadas a este pedido.
  const { data: propias } = await supabaseAdmin
    .from('ventas')
    .select('id, envio_id')
    .in('id', ventaIds)
    .eq('profile_id', auth.ownerId)
  const validas = (propias ?? []).filter((v) => !v.envio_id || v.envio_id === id).map((v) => v.id as string)
  if (validas.length === 0) return NextResponse.json({ error: 'Sin ventas válidas' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('ventas')
    .update({ estado_envio: 'EMPACADO', envio_id: id })
    .in('id', validas)
    .eq('profile_id', auth.ownerId)
  if (error) return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  return NextResponse.json({ ok: true, count: validas.length })
}
