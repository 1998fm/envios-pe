import {requireFunciones} from '@/lib/negocioAuth'
import {supabaseAdmin} from 'app/f/[slug]/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requirePlus } from '@/lib/negocioAuth'
import { checkShalomExportLimit } from '@/lib/planLimits'

export async function GET() {
  const auth = await requirePlus('ver_envios')
  if (!auth.ok) return auth.response
  const permisoPlan=requireFunciones(auth,'shalom');
  if(permisoPlan)return permisoPlan;
  const userId = auth.ownerId

  const { used, max } = await checkShalomExportLimit(userId)
  return NextResponse.json({ used, max })
}

export async function POST(request: Request) {
  const auth = await requirePlus('ver_envios')
  if (!auth.ok) return auth.response
  const permisoPlan=requireFunciones(auth,'shalom');
  if(permisoPlan)return permisoPlan;
  const user_id = auth.ownerId

  const body = await request.json().catch(() => ({}))
  const cantidad = Math.max(0, Math.floor(Number(body.cantidad) || 0))

  const {data,error}=await supabaseAdmin.rpc('tori_registrar_exportacion',{p_owner:user_id,p_cantidad:cantidad})
  if(error)return NextResponse.json({error:error.code==='P0001'?error.message:'No se pudo registrar la exportación.'},{status:error.code==='P0001'?403:500})
  return NextResponse.json(data)
}
