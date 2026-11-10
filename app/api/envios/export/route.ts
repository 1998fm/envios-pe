import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { idsValidos } from '@/lib/enviosServidor'
import { mensajeDb } from '@/lib/erroresEs'

// Pedidos SHALOM ya empacados, listos para exportar. Con ?ids= se limita a esa
// selección; sin ella, devuelve todos los del negocio.
export async function GET(request: Request) {
  const auth = await requirePlus('ver_envios')
  if (!auth.ok) return auth.response

  const ids = idsValidos(new URL(request.url).searchParams.get('ids'))

  let query = supabaseAdmin
    .from('envios')
    .select('*')
    .eq('user_id', auth.ownerId)
    .eq('metodo', 'SHALOM')
    .eq('estado', 'EMPACADO')
    .order('fecha_registro', { ascending: false })
    .limit(5000)
  if (ids.length > 0) query = query.in('id', ids)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
