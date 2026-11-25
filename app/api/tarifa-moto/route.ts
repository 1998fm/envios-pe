import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { accesoPlan,permitePlan } from '@/lib/planesServidor'
import { buscarPrecioPorDistrito } from '@/lib/normalizarDistrito'

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

  const plan=await accesoPlan(userId).catch(()=>null)
  if(!plan) return NextResponse.json({error:'No se pudo verificar el negocio'},{status:503})
  if(!permitePlan(plan,'tarifas'))return NextResponse.json({precio:null})

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

  const precio = buscarPrecioPorDistrito(data.tarifas, distrito)

  return NextResponse.json({
    precio: precio ?? null,
  })

}