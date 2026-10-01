import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { checkRecordLimit } from '@/lib/planLimits'
import { ajustarStock } from '@/lib/stock'
import { buscar } from '@/lib/buscar'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const busqueda = searchParams.get('busqueda') || ''
  // Por defecto solo se listan los activos (no archivados). Con archivado=true
  // se listan los archivados, para la vista correspondiente.
  const archivado = searchParams.get('archivado')
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000)

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('productos')
    .select('*', { count: 'exact' })
    .eq('profile_id', userId)
    .eq('archivado', archivado === 'true')

  if (busqueda.trim()) {
    // PostgREST no puede hacer un Y de "ilike" sobre la misma columna, así que
    // el filtrado por palabras se hace en memoria. Se trae todo el catálogo del
    // usuario (son cientos, no millones) y se pagina DESPUÉS de ordenar por
    // relevancia: si se paginara antes, los cortes caerían sobre el orden
    // alfabético y los resultados más importantes podrían quedar fuera de la
    // primera página.
    const { data: todos, error: errTodos } = await query
      .order('nombre', { ascending: true })
      .range(0, 9999)

    if (errTodos) {
      return NextResponse.json({ error: errTodos.message }, { status: 500 })
    }

    const campos = (p: Record<string, unknown>) => [
      p.nombre as string,
      p.sku as string,
      p.descripcion as string,
    ]

    const ordenados = buscar(
      (todos || []) as unknown as Record<string, unknown>[],
      busqueda,
      campos,
      (p) => String(p.nombre || '')
    )

    const total = ordenados.length
    const page = ordenados.slice(offset, offset + limit)
    return NextResponse.json({ data: page, total, offset, limit })
  }

  const { data, count, error } = await query
    .order('nombre', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, total: count ?? 0, offset, limit })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, nombre, sku, descripcion, precio_venta, precio_compra, stock_actual, stock_minimo, unidad, imagen_url } = body

  if (!user_id || !nombre) {
    return NextResponse.json({ error: 'user_id y nombre son requeridos' }, { status: 400 })
  }

  // La URL de la imagen solo se acepta si apunta al bucket público de productos
  let imagenUrl: string | null = null
  if (
    typeof imagen_url === 'string' &&
    imagen_url.length <= 500 &&
    imagen_url.includes('/object/public/productos/')
  ) {
    imagenUrl = imagen_url
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
      precio_compra: precio_compra ?? 0,
      stock_actual: 0, // el stock inicial se registra vía ajustarStock (kardex)
      stock_minimo: stock_minimo ?? 0,
      unidad: unidad || 'unidad',
      imagen_url: imagenUrl,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

  return NextResponse.json({ data: { ...data, stock_actual: stockInicial } })
}
