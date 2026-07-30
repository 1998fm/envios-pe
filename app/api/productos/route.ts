import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const busqueda = searchParams.get('busqueda') || ''

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('productos')
    .select('*')
    .eq('profile_id', userId)

  if (busqueda) {
    query = query.ilike('nombre', `%${busqueda}%`)
  }

  const { data, error } = await query
    .order('nombre', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, nombre, sku, descripcion, precio_venta, precio_compra, stock_actual, stock_minimo, unidad } = body

  if (!user_id || !nombre) {
    return NextResponse.json({ error: 'user_id y nombre son requeridos' }, { status: 400 })
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
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
