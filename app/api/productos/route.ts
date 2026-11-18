import { controlarCambios } from '@/lib/lecturaCondicionalServidor'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { conImagenesProxy, desdeProxy } from '@/lib/mediaUrl'
import { checkRecordLimit } from '@/lib/planLimits'
import { ajustarStock } from '@/lib/stock'
import { normalizar, palabrasClave } from '@/lib/buscar'
import { mensajeDb } from '@/lib/erroresEs'

/** Sin permiso de ganancias por producto, el costo de compra no sale del servidor. */
function sinCosto<T extends Record<string, unknown>>(p: T, puedeVer: boolean): T {
  if (puedeVer) return p
  const { precio_compra: _omitido, ...resto } = p
  return resto as T
}

/** Lo que sale hacia el navegador: sin costo si no puede verlo y con imágenes por /media. */
function salida<T extends Record<string, unknown>>(p: T, puedeVerCosto: boolean): T {
  return conImagenesProxy(sinCosto(p, puedeVerCosto), ['imagen_url'])
}

export async function GET(request: Request) {
  // El catálogo también alimenta los selectores de ventas y compras.
  const auth = await requirePlus('ver_productos', 'ver_ventas', 'ver_compras', 'ver_envios')
  if (!auth.ok) return auth.response
  const userId = auth.ownerId
  const { revision, response } = await controlarCambios(request, userId, 'productos', auth.permisos)
  if (response) return response
  const verCosto = auth.permisos.ver_ganancia_producto

  const { searchParams } = new URL(request.url)
  const busqueda = searchParams.get('busqueda') || ''
  // Por defecto solo se listan los activos (no archivados). Con archivado=true
  // se listan los archivados, para la vista correspondiente.
  const archivado = searchParams.get('archivado')
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)
  const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '50') || 50, 1000))

  const selector = searchParams.get('selector')
  const columnas = selector === 'venta'
    ? 'id,nombre,sku,descripcion,precio_venta,stock_actual,unidad'
    : selector === 'compra' ? 'id,nombre,sku,descripcion,precio_compra,stock_actual,unidad' : '*'
  let query = supabaseAdmin
    .from('productos')
    .select(searchParams.get('catalogo') === '1' ? `${columnas},producto_variantes!left()` : columnas, { count: 'exact' })
    .eq('profile_id', userId)
    .eq('archivado', archivado === 'true')

  if (searchParams.get('catalogo') === '1') query = query.is('producto_variantes', null)

  if (busqueda.trim()) {
    const { data: resultado, error: errorBusqueda } = await supabaseAdmin.rpc('tori_buscar_productos', {
      p_owner: userId, p_palabras: palabrasClave(busqueda), p_frase: normalizar(busqueda),
      p_archivado: archivado === 'true', p_catalogo: searchParams.get('catalogo') === '1',
      p_offset: offset, p_limit: limit,
    })
    if (errorBusqueda) return NextResponse.json({ error: mensajeDb(errorBusqueda) }, { status: 500 })
    const { ids, total } = resultado as { ids: string[]; total: number }
    const { data: detalles, error: errorDetalles } = ids.length
      ? await supabaseAdmin.from('productos').select(columnas).eq('profile_id', userId).in('id', ids)
      : { data: [], error: null }
    if (errorDetalles) return NextResponse.json({ error: mensajeDb(errorDetalles) }, { status: 500 })
    const porId = new Map(((detalles || []) as unknown as Record<string, unknown>[]).map((p) => [String(p.id), p]))
    const page = ids.flatMap((id) => {
      const p = porId.get(id)
      return p ? [salida(p, verCosto)] : []
    })
    return NextResponse.json({ data: page, total, offset, limit, revision })
  }

  const { data, count, error } = await query
    .order('nombre', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  return NextResponse.json({
    data: (data ?? []).map((p) => salida(p as unknown as Record<string, unknown>, verCosto)),
    revision,
    total: count ?? 0,
    offset,
    limit,
  })
}

export async function POST(request: Request) {
  const auth = await requirePlus('ver_productos')
  if (!auth.ok) return auth.response
  const user_id = auth.ownerId

  const body = await request.json()
  const { nombre, sku, descripcion, precio_venta, precio_compra, stock_actual, stock_minimo, unidad, imagen_url } = body

  if (!nombre) {
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })
  }

  // La URL de la imagen solo se acepta si apunta al bucket público de productos
  let imagenUrl: string | null = null
  const imagenCanonica = typeof imagen_url === 'string' ? desdeProxy(imagen_url) : ''
  if (imagenCanonica.length <= 500 && imagenCanonica.includes('/object/public/productos/')) {
    imagenUrl = imagenCanonica
  }

  const { allowed, reason } = await checkRecordLimit(user_id, 'productos')
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('productos')
    .insert({
      profile_id: user_id,
      nombre,
      sku: sku || null,
      descripcion: descripcion || null,
      precio_venta: precio_venta ?? 0,
      precio_compra: auth.permisos.ver_ganancia_producto ? (precio_compra ?? 0) : 0,
      stock_actual: 0, // el stock inicial se registra vía ajustarStock (kardex)
      stock_minimo: stock_minimo ?? 0,
      unidad: unidad || 'unidad',
      imagen_url: imagenUrl,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  // Stock inicial se registra en el kardex como AJUSTE (0 → inicial).
  const stockInicial = Number(stock_actual ?? 0)
  if (Number.isInteger(stockInicial) && stockInicial > 0) {
    const res = await ajustarStock(data.id, stockInicial, 'Stock inicial')
    if (!res.ok) {
      await supabaseAdmin.from('productos').delete().eq('id', data.id)
      return NextResponse.json({ error: res.error }, { status: 500 })
    }
  }

  return NextResponse.json({
    data: salida({ ...data, stock_actual: stockInicial }, auth.permisos.ver_ganancia_producto),
  })
}
