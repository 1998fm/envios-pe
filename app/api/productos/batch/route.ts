import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { mensajeDb } from '@/lib/erroresEs'
import { idsValidos } from '@/lib/enviosServidor'
import { rutaDesdeUrlProducto } from '@/lib/comprimirImagen'

// Archiva o restaura varios productos a la vez (selección múltiple).
export async function PATCH(request: Request) {
  const auth = await requirePlus('ver_productos')
  if (!auth.ok) return auth.response

  const body = await request.json()
  const ids = body?.ids
  const archivado = body?.archivado

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    typeof archivado !== 'boolean'
  ) {
    return NextResponse.json({ error: 'ids y archivado son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('productos')
    .update({ archivado, updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('profile_id', auth.ownerId)
    .select('id')

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// Elimina varios productos a la vez (selección múltiple) y borra sus fotos.
export async function DELETE(request: Request) {
  const auth = await requirePlus('ver_productos')
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const ids = idsValidos(body?.ids, 200)
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids es requerido' }, { status: 400 })
  }

  const { data: actuales } = await supabaseAdmin
    .from('productos')
    .select('id, imagen_url')
    .in('id', ids)
    .eq('profile_id', auth.ownerId)

  if (!actuales || actuales.length === 0) {
    return NextResponse.json({ error: 'Productos no encontrados' }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('productos')
    .delete()
    .in('id', actuales.map((p) => p.id))
    .eq('profile_id', auth.ownerId)

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
  }

  const rutas = actuales
    .map((p) => (p.imagen_url ? rutaDesdeUrlProducto(p.imagen_url) : null))
    .filter((r): r is string => !!r)
  if (rutas.length > 0) {
    try {
      await supabaseAdmin.storage.from('productos').remove(rutas)
    } catch (err) {
      console.error('No se pudieron borrar archivos del bucket:', err)
    }
  }

  return NextResponse.json({ success: true, eliminados: actuales.length })
}
