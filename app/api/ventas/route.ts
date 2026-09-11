import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { sincronizarArchivoPorStock } from '@/lib/sincronizarArchivoStock'
import { checkRecordLimit } from '@/lib/planLimits'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const estado = searchParams.get('estado') || ''
  const busqueda = (searchParams.get('busqueda') || '').trim()
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('ventas')
    .select('*, items:venta_items(*)', { count: 'exact' })
    .eq('profile_id', userId)

  if (estado) {
    query = query.eq('estado', estado)
  }

  if (busqueda) {
    // Saneamos el término para que postgREST no falle con caracteres especiales
    const term = busqueda
      .replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ@.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (term) {
      // Ventas cuyos productos coinciden con el término
      const { data: itemsMatch } = await supabaseAdmin
        .from('venta_items')
        .select('venta_id')
        .ilike('producto_nombre', `%${term}%`)
        .limit(3000)
      const idsPorProducto = [...new Set((itemsMatch || []).map((r) => r.venta_id))]

      const condiciones = [
        `persona_nombre.ilike.%${term}%`,
        `persona_dni.ilike.%${term}%`,
        `persona_telefono.ilike.%${term}%`,
        `metodo_pago.ilike.%${term}%`,
        `estado.ilike.%${term}%`,
        `estado_envio.ilike.%${term}%`,
      ]
      if (idsPorProducto.length > 0) {
        condiciones.push(`id.in.(${idsPorProducto.join(',')})`)
      }
      query = query.or(condiciones.join(','))
    }
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, total: count ?? 0, offset, limit })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, persona_id, persona_nombre, persona_dni, persona_telefono, items, metodo_pago, estado: estadoSolicitado } = body

  if (!user_id || !persona_id || !items?.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { allowed, reason } = await checkRecordLimit(user_id, 'ventas')
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 403 })
  }

  const pago = metodo_pago === 'YAPE_PLIN' || metodo_pago === 'TARJETA' ? metodo_pago : 'EFECTIVO'
  // TARJETA siempre queda pendiente hasta confirmar; EFECTIVO y YAPE_PLIN respetan si el cliente ya pagó
  const estado = pago === 'TARJETA' ? 'PENDIENTE' : (estadoSolicitado === 'PENDIENTE' ? 'PENDIENTE' : 'COMPLETADA')

  let total = 0
  const itemsData = items.map((it: any) => {
    const subtotal = (it.precio_unitario ?? 0) * (it.cantidad ?? 0)
    total += subtotal
    return {
      producto_id: it.producto_id || null,
      producto_nombre: it.producto_nombre,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      costo_unitario: 0,
      subtotal,
    }
  })

  // Foto del costo de cada producto al momento de la venta
  const productoIds = itemsData.map((it: any) => it.producto_id).filter(Boolean)
  if (productoIds.length > 0) {
    const { data: productos } = await supabaseAdmin
      .from('productos')
      .select('id, precio_compra')
      .in('id', productoIds)
    const costoPorId = new Map((productos || []).map((p: any) => [p.id, p.precio_compra ?? 0]))
    for (const it of itemsData) {
      if (it.producto_id) it.costo_unitario = costoPorId.get(it.producto_id) ?? 0
    }
  }

  // Vincular cliente con este negocio si no existe
  const { data: vinculo } = await supabaseAdmin
    .from('cliente_de')
    .select('id')
    .eq('persona_id', persona_id)
    .eq('profile_id', user_id)
    .maybeSingle()

  if (!vinculo) {
    await supabaseAdmin
      .from('cliente_de')
      .insert({ persona_id, profile_id: user_id })
  }

  const { data: venta, error } = await supabaseAdmin
    .from('ventas')
    .insert({
      profile_id: user_id,
      persona_id,
      persona_nombre,
      persona_dni: persona_dni || null,
      persona_telefono: persona_telefono || null,
      total,
      estado,
      metodo_pago: pago,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { error: itemsError } = await supabaseAdmin
    .from('venta_items')
    .insert(itemsData.map((it: any) => ({ ...it, venta_id: venta.id })))

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Vincular la venta al envío pendiente más reciente del cliente. Mientras el
  // pedido no se marque como enviado, TODAS las ventas del cliente se acumulan
  // en ese mismo envío (aunque ya tenga ventas vinculadas). Si el envío ya fue
  // enviado o el cliente aún no tiene pedido, la venta queda libre (envio_id null)
  // y se adjudicará a su próxima solicitud de envío.
  const envioId = await buscarEnvioPendiente(user_id, persona_dni, persona_telefono)
  if (envioId) {
    await supabaseAdmin
      .from('ventas')
      .update({ envio_id: envioId })
      .eq('id', venta.id)
  }

  // Descontar stock de cada producto
  for (const item of itemsData) {
    if (!item.producto_id) continue
    const { data: prod } = await supabaseAdmin
      .from('productos')
      .select('stock_actual')
      .eq('id', item.producto_id)
      .single()
    if (prod) {
      await supabaseAdmin
        .from('productos')
        .update({ stock_actual: prod.stock_actual - item.cantidad, updated_at: new Date().toISOString() })
        .eq('id', item.producto_id)
    }
  }

  await sincronizarArchivoPorStock(itemsData.map((it: any) => it.producto_id).filter(Boolean))

  return NextResponse.json({ data: venta })
}

async function normalizar(valor: string | null | undefined) {
  return String(valor || '').replace(/\s+/g, '')
}

async function matchEnvioCliente(envio: any, dni: string | null | undefined, telefono: string | null | undefined) {
  const dniN = await normalizar(dni)
  const telN = await normalizar(telefono)
  if (!dniN && !telN) return false
  const matchDni = dniN && (await normalizar(envio.dni)) === dniN
  const matchTel = telN && (await normalizar(envio.telefono)) === telN
  return matchDni || matchTel
}

async function buscarEnvioPendiente(userId: string, dni: string | null | undefined, telefono: string | null | undefined) {
  const dniN = await normalizar(dni)
  const telN = await normalizar(telefono)
  if (!dniN && !telN) return null

  // Envío pendiente (NO enviado) más reciente del cliente. Se toma aunque ya
  // tenga ventas vinculadas: todas las compras se acumulan hasta que el pedido
  // se marque como enviado.
  const { data: envios } = await supabaseAdmin
    .from('envios')
    .select('id, dni, telefono, estado')
    .eq('user_id', userId)
    .in('estado', ['NO_EMPACADO', 'EMPACADO', 'EN_OBSERVACION'])
    .order('fecha_registro', { ascending: false })
    .limit(50)

  for (const envio of envios || []) {
    if (await matchEnvioCliente(envio, dni, telefono)) return envio.id
  }

  return null
}

