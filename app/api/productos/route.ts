import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { checkRecordLimit } from '@/lib/planLimits'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const busqueda = searchParams.get('busqueda') || ''
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000)

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('productos')
    .select('*', { count: 'exact' })
    .eq('profile_id', userId)

  if (busqueda) {
    query = query.ilike('nombre', `%${busqueda}%`)
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
      stock_actual: stock_actual ?? 0,
      stock_minimo: stock_minimo ?? 0,
      unidad: unidad || 'unidad',
      imagen_url: imagenUrl,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
