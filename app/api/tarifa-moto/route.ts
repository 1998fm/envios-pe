import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { computeEffectivePlan } from '@/lib/planGating'

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

  // Las tarifas por distrito son una función de plan Pro/Business Plus.
  // Si el usuario no tiene un plan pagado/Pro activo, no se aplican precios
  // por distrito (se neutraliza igual que la configuración logística).
  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('plan, trial_end, pro_until')
    .eq('id', userId)
    .single()

  const esPro = computeEffectivePlan(perfil ?? {}).plan !== 'basic'
  if (!esPro) {
    return NextResponse.json({ precio: null })
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