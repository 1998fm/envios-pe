import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function GET(req: NextRequest) {

  const distrito =
    req.nextUrl.searchParams.get('distrito')
  const userId =
    req.nextUrl.searchParams.get('userId')

  if (!distrito || !userId) {

    return NextResponse.json(
      {
        error: 'Distrito y userId requeridos',
      },
      {
        status: 400,
      }
    )

  }

  const { data, error } =
    await supabaseAdmin
      .from('tarifas_moto')
      .select('tarifas')
      .eq('profile_id', userId)
      .maybeSingle()

  if (error || !data) {

    return NextResponse.json(
      {
        precio: null,
      }
    )

  }

  const precio = data.tarifas[distrito]

  return NextResponse.json({
    precio: precio ?? null,
  })

}