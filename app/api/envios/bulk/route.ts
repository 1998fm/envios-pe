import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { ESTADOS_ENVIO, idsValidos, sincronizarVentasEnviadas } from '@/lib/enviosServidor'
import { mensajeDb } from '@/lib/erroresEs'

// Cambio masivo de estado. Solo afecta pedidos del propio negocio: los ids
// ajenos se ignoran.
export async function PATCH(request: Request) {
  const auth = await requirePlus('ver_envios')
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const ids = idsValidos(body.ids)
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Selecciona al menos un envío.' }, { status: 400 })
  }
  if (!ESTADOS_ENVIO.includes(body.estado)) {
    return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('envios')
    .update({ estado: body.estado, updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('user_id', auth.ownerId)
    .select('id')

  if (error) return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  const actualizados = (data ?? []).map((r) => r.id as string)

  if (body.estado === 'ENVIADO') await sincronizarVentasEnviadas(auth.ownerId, actualizados)
  return NextResponse.json({ ok: true, ids: actualizados })
}
