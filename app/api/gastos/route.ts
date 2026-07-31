import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const categoria = searchParams.get('categoria') || ''

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('gastos')
    .select('*')
    .eq('profile_id', userId)

  if (categoria) {
    query = query.eq('categoria', categoria)
  }

  const { data, error } = await query
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, categoria, concepto, monto, fecha, notas } = body

  if (!user_id || !concepto) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data: gasto, error } = await supabaseAdmin
    .from('gastos')
    .insert({
      profile_id: user_id,
      categoria: categoria || 'OTROS',
      concepto,
      monto: Math.max(0, Number(monto) || 0),
      fecha: fecha || new Date().toISOString().split('T')[0],
      notas: notas || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: gasto })
}
