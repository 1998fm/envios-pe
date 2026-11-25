import {requireFunciones} from '@/lib/negocioAuth'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireNegocio } from '@/lib/negocioAuth'
import { ESTADOS_ENVIO, sincronizarVentasEnviadas } from '@/lib/enviosServidor'
import { mensajeDb } from '@/lib/erroresEs'

const TAMANOS = ['PAQUETE XS', 'PAQUETE S', 'PAQUETE M', 'PAQUETE L']

// Cambia un dato del pedido: estado, tamaño, fecha programada u observación.
// Solo estos campos (lista blanca): el resto del registro no se puede tocar.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireNegocio('ver_envios')
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await request.json().catch(() => ({}))

  for(const [campo,funcion] of [['estado','envios_estado'],['tamano','envios_tamano'],['fecha_programada','envios_reprogramar'],['observaciones','envios_observaciones']] as const) {
    if(campo in body){const denial=requireFunciones(auth,funcion);if(denial)return denial;}
  }
  const cambios: Record<string, unknown> = {}

  if ('estado' in body) {
    if (!ESTADOS_ENVIO.includes(body.estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }
    cambios.estado = body.estado
  }
  if ('tamano' in body) {
    const t = body.tamano
    if (t !== '' && t !== null && !TAMANOS.includes(t)) {
      return NextResponse.json({ error: 'Tamaño no válido' }, { status: 400 })
    }
    cambios.tamano = t || null
  }
  if ('fecha_programada' in body) {
    const valor = body.fecha_programada
    if (typeof valor !== 'string' || valor.length > 50 || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(valor)) return NextResponse.json({ error: 'Fecha no válida' }, { status: 400 })
    const f = new Date(typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? `${valor}T12:00:00-05:00` : valor)
    if (Number.isNaN(f.getTime()) || (/^\d{4}-\d{2}-\d{2}$/.test(valor) && f.toISOString().slice(0,10) !== valor)) {
      return NextResponse.json({ error: 'Fecha no válida' }, { status: 400 })
    }
    cambios.fecha_programada = f.toISOString()
  }
  if ('observaciones' in body) {
    const o = body.observaciones
    if (o !== null && (typeof o !== 'string' || o.length > 1000)) {
      return NextResponse.json({ error: 'Observación no válida' }, { status: 400 })
    }
    cambios.observaciones = o === null || o.trim() === '' ? null : o.trim()
  }
  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }
  cambios.updated_at = new Date().toISOString()

  const { data, error } = 'fecha_programada' in cambios
    ? await supabaseAdmin.rpc('tori_actualizar_envio_logistico', { p_owner:auth.ownerId,p_id:id,p_cambios:cambios })
    : await supabaseAdmin.from('envios').update(cambios).eq('id',id).eq('user_id',auth.ownerId).select('*').maybeSingle()

  if (error) return NextResponse.json({ error: mensajeDb(error) }, { status: error.code === 'P0001' ? 409 : 500 })
  if (!data) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  if (cambios.estado === 'ENVIADO') await sincronizarVentasEnviadas(auth.ownerId, [id])

  return NextResponse.json({ data })
}

// Elimina el pedido. Las ventas que estaban ligadas a él quedan libres (antes la
// llave foránea impedía borrarlo y la pantalla no avisaba).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireNegocio('ver_envios')
  if (!auth.ok) return auth.response
  const permisoPlan=requireFunciones(auth,'envios_eliminar');
  if(permisoPlan)return permisoPlan;
  const { id } = await params

  const { data: existe } = await supabaseAdmin
    .from('envios')
    .select('id')
    .eq('id', id)
    .eq('user_id', auth.ownerId)
    .maybeSingle()
  if (!existe) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  await supabaseAdmin
    .from('ventas')
    .update({ envio_id: null })
    .eq('envio_id', id)
    .eq('profile_id', auth.ownerId)

  const { error } = await supabaseAdmin.from('envios').delete().eq('id', id).eq('user_id', auth.ownerId)
  if (error) return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  return NextResponse.json({ ok: true })
}
