import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { obtenerAgenciasShalom } from '@/lib/shalom/agencias'

// Lógica central de sincronización. Conserva la tabla actual si algo falla.
async function ejecutarSync(): Promise<{
  ok: boolean
  sincronizadas?: number
  version?: number | null
  error?: string
}> {
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

// GET: invocado por el cron semanal de Vercel.
// Vercel inyecta la cabecera x-vercel-cron solo en peticiones de cron,
// por lo que sirve como verificación de que la petición viene de Vercel.
export async function GET(request: Request) {
  const esCron = request.headers.get('x-vercel-cron')
  if (!esCron) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const r = await ejecutarSync()
  return NextResponse.json(r, { status: r.ok ? 200 : 502 })
}

// POST: llamadas manuales / futuro panel de super admin.
// Requiere cabecera x-sync-key == SHALOM_SYNC_SECRET.
export async function POST(request: Request) {
  const key = request.headers.get('x-sync-key')
  const expected = process.env.SHALOM_SYNC_SECRET
  if (!expected || key !== expected) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const r = await ejecutarSync()
  return NextResponse.json(r, { status: r.ok ? 200 : 502 })
}
