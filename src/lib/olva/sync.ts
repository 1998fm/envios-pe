import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { obtenerAgenciasOlva } from '@/lib/olva/agencias'

export type SyncResult = {
  ok: boolean
  sincronizadas?: number
  error?: string
}

// Lógica central de sincronización de agencias Olva courier.
// Conserva la tabla actual si algo falla.
export async function ejecutarSyncOlva(): Promise<SyncResult> {
  const resultado = await obtenerAgenciasOlva()
  if (!resultado.ok || !resultado.agencias) {
    return {
      ok: false,
      error:
        'No se pudo obtener las agencias desde Olva. Se conserva la lista actual.',
    }
  }

  const agencias = resultado.agencias

  const upsert = await supabaseAdmin
    .from('agencias_olva')
    .upsert(
      agencias.map((a) => ({
        office_id: a.office_id,
        nombres: a.nombres,
        direccion: a.direccion,
        department: a.department,
        province: a.province,
        district: a.district,
        office_type: a.office_type,
        lat: a.lat,
        lng: a.lng,
        activa: true,
        actualizada_en: new Date().toISOString(),
      })),
      { onConflict: 'office_id' }
    )

  if (upsert.error) {
    return { ok: false, error: upsert.error.message }
  }

  // Marcar como inactivas las agencias que Olva ya no reporta.
  // office_id es texto: el `.not('in', ...)` inline tendría problemas de
  // tipos/comillas, así que diff en JS (traer activas y restar las recibidas).
  const recibidos = new Set(agencias.map((a) => a.office_id))
  const { data: activas, error: errActivas } = await supabaseAdmin
    .from('agencias_olva')
    .select('office_id')
    .eq('activa', true)

  if (errActivas) {
    return { ok: false, error: errActivas.message }
  }

  const porDesactivar = (activas || [])
    .map((r) => r.office_id as string)
    .filter((id) => !recibidos.has(id))

  if (porDesactivar.length > 0) {
    const desactivar = await supabaseAdmin
      .from('agencias_olva')
      .update({ activa: false, actualizada_en: new Date().toISOString() })
      .in('office_id', porDesactivar)

    if (desactivar.error) {
      return { ok: false, error: desactivar.error.message }
    }
  }

  return { ok: true, sincronizadas: agencias.length }
}