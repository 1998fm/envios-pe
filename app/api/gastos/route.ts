import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { mensajeDb } from '@/lib/erroresEs'

const CATEGORIAS_GASTO = ['MATERIALES', 'PASAJES', 'DELIVERY', 'PUBLICIDAD', 'SERVICIOS', 'OTROS']

export async function GET(request: Request) {
  const auth = await requirePlus('ver_gastos')
  if (!auth.ok) return auth.response
  const userId = auth.ownerId

  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria') || ''
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

  let query = supabaseAdmin
    .from('gastos')
    .select('*', { count: 'exact' })
    .eq('profile_id', userId)

  if (categoria) {
    query = query.eq('categoria', categoria)
  }

  const { data, count, error } = await query
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  return NextResponse.json({ data, total: count ?? 0, offset, limit })
}

export async function POST(request: Request) {
  const auth = await requirePlus('ver_gastos')
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { categoria, concepto, monto, fecha, notas } = body

  if (!concepto) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  if (categoria && !CATEGORIAS_GASTO.includes(categoria)) {
    return NextResponse.json({ error: 'Categoría no válida' }, { status: 400 })
  }

  const { data: gasto, error } = await supabaseAdmin
    .from('gastos')
    .insert({
      profile_id: auth.ownerId,
      categoria: categoria || 'OTROS',
      concepto,
      monto: Math.max(0, Number(monto) || 0),
      fecha: fecha || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }),
      notas: notas || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  return NextResponse.json({ data: gasto })
}
