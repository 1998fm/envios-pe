import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { mensajeDb } from '@/lib/erroresEs'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlus('ver_productos')
  if (!auth.ok) return auth.response
  const userId = auth.ownerId

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

  const { data: producto, error: productoError } = await supabaseAdmin
    .from('productos')
    .select('id, nombre')
    .eq('id', id)
    .eq('profile_id', userId)
    .maybeSingle()

  if (productoError) {
    return NextResponse.json({ error: mensajeDb(productoError) }, { status: 500 })
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
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  return NextResponse.json({ data: movimientos, producto })
}