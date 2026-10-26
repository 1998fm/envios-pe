import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireNegocio } from '@/lib/negocioAuth'
import { mensajeDb } from '@/lib/erroresEs'

// Cuántos pedidos tiene el negocio desde una fecha (para el contador del plan Básico).
export async function GET(request: Request) {
  const auth = await requireNegocio('ver_envios', 'ver_resumen')
  if (!auth.ok) return auth.response

  const desde = new Date(new URL(request.url).searchParams.get('desde') || '')
  if (Number.isNaN(desde.getTime())) {
    return NextResponse.json({ error: 'Fecha no válida' }, { status: 400 })
  }

  const { count, error } = await supabaseAdmin
    .from('envios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.ownerId)
    .gte('fecha_registro', desde.toISOString())

  if (error) return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  return NextResponse.json({ count: count ?? 0 })
}
