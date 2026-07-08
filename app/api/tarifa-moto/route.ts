import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function GET(req: NextRequest) {

  const distrito =
    req.nextUrl.searchParams.get('distrito')

  if (!distrito) {

    return NextResponse.json(
      {
        error: 'Distrito requerido',
      },
      {
        status: 400,
      }
    )

  }

  const { data, error } =
    await supabaseAdmin
      .from('tarifas_moto')
      .select('precio')
      .eq('distrito', distrito)
      .single()

  if (error || !data) {

    return NextResponse.json(
      {
        precio: null,
      }
    )

  }

  return NextResponse.json({
    precio: data.precio,
  })

}