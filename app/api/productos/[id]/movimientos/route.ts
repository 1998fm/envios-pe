import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const { data: producto, error: productoError } = await supabaseAdmin
    .from('productos')
    .select('id, nombre')
    .eq('id', id)
    .eq('profile_id', userId)
    .maybeSingle()

  if (productoError) {
    return NextResponse.json({ error: productoError.message }, { status: 500 })
  }
  if (!producto) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  const { data: movimientos, error } = await supabaseAdmin
    .from('movimientos_inventario')
    .select('*')
    .eq('producto_id', id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: movimientos, producto })
}