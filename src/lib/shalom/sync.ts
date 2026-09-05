import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { obtenerAgenciasShalom } from '@/lib/shalom/agencias'

export type SyncResult = {
  ok: boolean
  sincronizadas?: number
  version?: number | null
  error?: string
  info?: string
}

// Lógica central de sincronización de agencias Shalom.
// Conserva la tabla actual si algo falla.
export async function ejecutarSyncShalom(): Promise<SyncResult> {
  const resultado = await obtenerAgenciasShalom()
  if (!resultado.ok || !resultado.agencias) {
    return {
      ok: false,
      error:
        'No se pudo obtener las agencias desde Shalom. Se conserva la lista actual.',
    }
  }

  const agencias = resultado.agencias

  const upsert = await supabaseAdmin
    .from('agencias_shalom')
    .upsert(
      agencias.map((a) => ({
        ter_id: a.ter_id,
        etiqueta: a.etiqueta,
        departamento: a.departamento,
        provincia: a.provincia,
        lugar: a.lugar,
        direccion: a.direccion,
        telefono: a.telefono,
        latitud: a.latitud,
        longitud: a.longitud,
        recibe: a.recibe,
        activa: true,
        actualizada_en: new Date().toISOString(),
      })),
      { onConflict: 'ter_id' }
    )

  if (upsert.error) {
    return { ok: false, error: upsert.error.message }
  }

  // Marcar como inactivas las agencias que Shalom ya no reporta.
  const idsRecibidos = agencias.map((a) => a.ter_id)
  const desactivar = await supabaseAdmin
    .from('agencias_shalom')
    .update({ activa: false, actualizada_en: new Date().toISOString() })
    .not('ter_id', 'in', `(${idsRecibidos.join(',')})`)

  if (desactivar.error) {
    return { ok: false, error: desactivar.error.message }
  }

  return { ok: true, sincronizadas: agencias.length, version: resultado.version ?? null }
}
