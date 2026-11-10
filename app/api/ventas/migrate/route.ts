import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { mensajeDb } from '@/lib/erroresEs'

export async function POST(request: Request) {
  const auth = await requirePlus('ver_ventas')
  if (!auth.ok) return auth.response
  const user_id = auth.ownerId

  const { data: ventas, error: fetchError } = await supabaseAdmin
    .from('ventas')
    .select('id')
    .eq('profile_id', user_id)
    .eq('estado', 'PENDIENTE')

  if (fetchError) {
    return NextResponse.json({ error: mensajeDb(fetchError) }, { status: 500 })
  }

  if (!ventas?.length) {
    return NextResponse.json({ message: 'No hay ventas pendientes', count: 0 })
  }

  const ids = ventas.map((v) => v.id)
  const { error: updateError } = await supabaseAdmin
    .from('ventas')
    .update({ estado: 'COMPLETADA', updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('profile_id', user_id)

  if (updateError) {
    return NextResponse.json({ error: mensajeDb(updateError) }, { status: 500 })
  }

  return NextResponse.json({ message: 'Ventas actualizadas', count: ids.length })
}
