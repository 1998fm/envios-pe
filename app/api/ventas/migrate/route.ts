import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function POST(request: Request) {
  const { user_id } = await request.json()

  if (!user_id) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const { data: ventas, error: fetchError } = await supabaseAdmin
    .from('ventas')
    .select('id')
    .eq('profile_id', user_id)
    .eq('estado', 'PENDIENTE')

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!ventas?.length) {
    return NextResponse.json({ message: 'No hay ventas pendientes', count: 0 })
  }

  const ids = ventas.map((v) => v.id)
  const { error: updateError } = await supabaseAdmin
    .from('ventas')
    .update({ estado: 'COMPLETADA', updated_at: new Date().toISOString() })
    .in('id', ids)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Ventas actualizadas', count: ids.length })
}
