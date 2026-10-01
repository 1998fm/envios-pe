import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { sincronizarArchivoPorStock } from '@/lib/sincronizarArchivoStock'
import { checkRecordLimit } from '@/lib/planLimits'
import { descontarStock, sumarStock } from '@/lib/stock'
import { calcularResumenVentas, type ResumenVentas } from '@/lib/ventasUI'
import { buscar, palabrasClave } from '@/lib/buscar'

const r2 = (n: number) => Math.round(n * 100) / 100

/** Tope de filas para agregar el resumen. Si se supera, la UI lo avisa. */
const TOPE_RESUMEN = 5000
/** Tope de ventas candidatas que se revisan en memoria al buscar. */
const TOPE_BUSQUEDA = 2000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const estado = searchParams.get('estado') || ''
  const busqueda = (searchParams.get('busqueda') || '').trim()
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const conResumen = searchParams.get('resumen') === '1'

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  // Con palabras multiples el filtrado se hace en memoria (mas abajo), asi que
  // aqui solo se acota el universo con una coincidencia literal de cualquier
  // palabra, que es barato y reduce cuantas filas hay que traer.
  const palabrasDeBusqueda = palabrasClave(busqueda)
  let condiciones: string[] = []
  if (palabrasDeBusqueda.length > 0) {
    // Un .or() con una condicion por palabra, cada una acotada por el usuario.
    // Asi la base reduce el conjunto sin decidir el resultado: el "Y" real lo
    // aplica el motor, no este filtro.
    condiciones = []
    for (const palabra of palabrasDeBusqueda.slice(0, 6)) {
      // Se escapan los caracteres que rompen la sintaxis de postgREST (, . : *)
      const segura = palabra.replace(/[,.:*()]/g, ' ')
      if (!segura) continue
      const p = `%${segura}%`
      condiciones.push(
        `persona_nombre.ilike.${p}`,
        `persona_dni.ilike.${p}`,
        `persona_telefono.ilike.${p}`,
        `metodo_pago.ilike.${p}`,
        `estado.ilike.${p}`,
        `estado_envio.ilike.${p}`
      )
    }

    // Los items viven en otra tabla, asi que se buscan aparte por nombre de
    // producto y luego se cruzan por venta.
    if (condiciones.length > 0) {
      const porPalabra = await Promise.all(
        palabrasDeBusqueda.slice(0, 6).map(async (palabra) => {
          const segura = palabra.replace(/[,.:*()]/g, ' ')
          if (!segura) return [] as string[]
          const { data } = await supabaseAdmin
            .from('venta_items')
            .select('venta_id')
            .ilike('producto_nombre', `%${segura}%`)
            .limit(3000)
          return [...new Set((data || []).map((r) => r.venta_id as string))]
        })
      )
      const idsPorProducto = [...new Set(porPalabra.flat())]
      if (idsPorProducto.length > 0) {
        condiciones.push(`id.in.(${idsPorProducto.slice(0, 2000).join(',')})`)
      }
    }
  }

  const orBusqueda = condiciones.length > 0 ? condiciones.join(',') : null

  // La busqueda con varias palabras se resuelve en memoria, no con un .or() de
  // ilike. La razon: "polo verde" en un .or() devuelve todo lo que dice "polo"
  // MAS todo lo que dice "verde", porque cada condicion se evalua por separado.
  // Con el motor, todas las palabras tienen que estar presentes (un Y), aunque
  // cada una pueda estar en un campo distinto.
  if (palabrasDeBusqueda.length > 0) {
    // El .or() de arriba no decide el resultado: solo acota el universo a las
    // ventas que contienen AL MENOS una de las palabras, que es lo que hace
    // barata la segunda pasada en memoria.
    let qBase = supabaseAdmin
      .from('ventas')
      .select('*, items:venta_items(*)')
      .eq('profile_id', userId)
    if (orBusqueda) qBase = qBase.or(orBusqueda)
    if (estado) qBase = qBase.eq('estado', estado)

    const { data: candidatas, error: errBusqueda } = await qBase
      .order('created_at', { ascending: false })
      .range(0, TOPE_BUSQUEDA - 1)

    if (errBusqueda) {
      return NextResponse.json({ error: errBusqueda.message }, { status: 500 })
    }

    const ordenadas = buscar(
      (candidatas || []) as unknown as Record<string, unknown>[],
      busqueda,
      (v) => {
        const f = v as unknown as {
          persona_nombre?: string
          persona_dni?: string
          persona_telefono?: string | null
          metodo_pago?: string
          estado?: string
          estado_envio?: string
          items?: { producto_nombre?: string }[]
        }
        return [
          f.persona_nombre,
          f.persona_dni,
          f.persona_telefono,
          f.metodo_pago,
          f.estado,
          f.estado_envio,
          // El nombre de lo vendido: buscar "polo verde" debe encontrar la
          // venta aunque el producto se llame "Polo verde athletic" y el
          // cliente se llame de otra cosa.
          ...(f.items || []).map((it) => it.producto_nombre),
        ]
      },
      (v) => String((v as Record<string, unknown>).persona_nombre || '')
    )

    const total = ordenadas.length
    return NextResponse.json({
      data: ordenadas.slice(offset, offset + limit),
      total,
      offset,
      limit,
      // El resumen sale de lo que DE VERDAD coincide, no de lo que sobrevivo al
      // pre-filtro: si no, al buscar "polo verde" aparecerian en la franja de
      // arriba cifras de ventas que no se ven en la lista.
      resumen: conResumen ? calcularResumenVentas(ordenadas as never[], total) : undefined,
    })
  }

  let query = supabaseAdmin
    .from('ventas')
    .select('*, items:venta_items(*)', { count: 'exact' })
    .eq('profile_id', userId)
  if (estado) query = query.eq('estado', estado)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // El resumen alimenta la franja de números y los contadores de los filtros.
  // Sale SIN el filtro de estado a propósito: así los contadores siempre
  // muestran el panorama completo y el usuario ve de golpe, por ejemplo,
  // cuántas ventas tiene pendientes sin tener que ir probando filtros.
  let resumen: ResumenVentas | undefined
  if (conResumen) {
    let qResumen = supabaseAdmin
      .from('ventas')
      .select('total, monto_pagado, estado, items:venta_items(cantidad, costo_unitario)')
      .eq('profile_id', userId)
      .limit(TOPE_RESUMEN)
    if (orBusqueda) qResumen = qResumen.or(orBusqueda)

    const { data: todas } = await qResumen
    resumen = calcularResumenVentas(todas ?? [], TOPE_RESUMEN)
  }

  return NextResponse.json({ data, total: count ?? 0, offset, limit, resumen })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, persona_id, persona_nombre, persona_dni, persona_telefono, items, metodo_pago, estado: estadoSolicitado, monto_pagado: montoPagadoSolicitado } = body

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

  // Bug 2: validar cantidades y precios antes de tocar stock/items
  for (const it of items as any[]) {
    const cantidad = Number(it.cantidad)
    const precio = Number(it.precio_unitario)
    if (!Number.isFinite(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
      return NextResponse.json(
        { error: 'Cada ítem debe tener una cantidad entera mayor a 0.' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(precio) || precio < 0) {
      return NextResponse.json(
        { error: 'Cada ítem debe tener un precio_unitario mayor o igual a 0.' },
        { status: 400 }
      )
    }
  }

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
  const stockPorId = new Map<string, number>()
  if (productoIds.length > 0) {
    const { data: productos } = await supabaseAdmin
      .from('productos')
      .select('id, precio_compra, stock_actual')
      .in('id', productoIds)
    const costoPorId = new Map((productos || []).map((p: any) => [p.id, p.precio_compra ?? 0]))
    for (const p of productos || []) {
      stockPorId.set(p.id, p.stock_actual ?? 0)
    }
    for (const it of itemsData) {
      if (it.producto_id) it.costo_unitario = costoPorId.get(it.producto_id) ?? 0
    }
  }

  // Validar stock disponible antes de crear la venta (evita stock negativo).
  // Se acumula la cantidad por producto: si un mismo producto aparece varias
  // veces en la venta (filas duplicadas), se suma antes de comparar.
  const cantidadesPorProducto = new Map<string, number>()
  for (const it of itemsData) {
    if (!it.producto_id) continue
    cantidadesPorProducto.set(
      it.producto_id,
      (cantidadesPorProducto.get(it.producto_id) || 0) + it.cantidad
    )
  }
  const faltantes = [...cantidadesPorProducto]
    .filter(([pid, cant]) => {
      const disponible = stockPorId.get(pid) ?? 0
      return disponible < cant
    })
    .map(([pid, cant]) => {
      const nombre = itemsData.find((it: any) => it.producto_id === pid)?.producto_nombre || pid
      return `"${nombre}" (disponible: ${stockPorId.get(pid) ?? 0}, requerido: ${cant})`
    })

  if (faltantes.length > 0) {
    return NextResponse.json(
      {
        error: `Stock insuficiente para ${faltantes.join(', ')}. Actualiza el stock o reduce la cantidad.`,
        faltantes,
      },
      { status: 409 }
    )
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
      // Si nace completada, el monto ya fue cobrado. Si nace pendiente puede
      // incluir un abono inicial (pago parcial) indicado al crear la venta.
      monto_pagado: estado === 'COMPLETADA' ? total : Math.min(Math.max(Number(montoPagadoSolicitado) || 0, 0), total),
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
    // Bug 3: si fallan los items, borrar la venta recién creada para no dejar
    // una venta huérfana (el stock aún no se ha descontado).
    await supabaseAdmin.from('ventas').delete().eq('id', venta.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Vincular la venta al envío pendiente más reciente del cliente. Mientras el
  // pedido no se marque como enviado, TODAS las ventas del cliente se acumulan
  // en ese mismo envío (aunque ya tenga ventas vinculadas). Si el envío ya fue
  // enviado o el cliente aún no tiene pedido, la venta queda libre (envio_id null)
  // y se adjudicará a su próxima solicitud de envío.
  const envioPendiente = await buscarEnvioPendiente(user_id, persona_dni, persona_telefono)
  if (envioPendiente) {
    // La venta hereda el nombre/DNI/teléfono reales del cliente de su solicitud
    // de envío (el formulario que llenó la clienta es la fuente de la verdad).
    const heredar: Record<string, any> = { envio_id: envioPendiente.id }
    if (envioPendiente.nombre?.trim()) heredar.persona_nombre = envioPendiente.nombre.trim()
    if (envioPendiente.dni) heredar.persona_dni = String(envioPendiente.dni).replace(/\s+/g, '')
    if (envioPendiente.telefono) heredar.persona_telefono = String(envioPendiente.telefono).replace(/\s+/g, '')
    await supabaseAdmin
      .from('ventas')
      .update(heredar)
      .eq('id', venta.id)
  }

  // Bug 2: descontar stock de forma atómica, acumulando cantidades por
  // producto y con rollback si algún producto falla.
  const descontados: { producto_id: string; cantidad: number }[] = []
  for (const [productoId, cantidad] of cantidadesPorProducto) {
    const res = await descontarStock(productoId, cantidad, venta.id, 'VENTA', 'Venta')
    if (!res.ok) {
      for (const d of descontados) {
        await sumarStock(d.producto_id, d.cantidad, venta.id, 'ANULACION_VENTA', 'Rollback venta fallida')
      }
      return NextResponse.json({ error: res.error }, { status: 409 })
    }
    descontados.push({ producto_id: productoId, cantidad })
  }

  await sincronizarArchivoPorStock([...cantidadesPorProducto.keys()])

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
    .select('id, dni, telefono, nombre, estado')
    .eq('user_id', userId)
    .in('estado', ['NO_EMPACADO', 'EN_OBSERVACION'])
    .order('fecha_registro', { ascending: false })
    .limit(50)

  for (const envio of envios || []) {
    if (await matchEnvioCliente(envio, dni, telefono)) return envio
  }

  return null
}

