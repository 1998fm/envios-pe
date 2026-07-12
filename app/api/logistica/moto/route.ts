import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  const { data: perfil, error } = await supabaseAdmin
    .from('profiles')
    .select('logistica_moto_dias, logistica_moto_usa_hora_corte, logistica_moto_hora_corte')
    .eq('id', userId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    logistica_moto_dias: perfil?.logistica_moto_dias ?? ['MONDAY'],
    logistica_moto_usa_hora_corte: perfil?.logistica_moto_usa_hora_corte ?? false,
    logistica_moto_hora_corte: perfil?.logistica_moto_hora_corte ?? '14:00',
  })
}
