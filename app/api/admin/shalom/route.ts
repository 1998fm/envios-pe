import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin, registrarAuditoria } from '@/lib/adminAuth'
import { ejecutarSyncShalom } from '@/lib/shalom/sync'

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { count: total, error: errTotal } = await supabaseAdmin
    .from('agencias_shalom')
    .select('ter_id', { count: 'exact', head: true })

  const { count: activas, error: errActivas } = await supabaseAdmin
    .from('agencias_shalom')
    .select('ter_id', { count: 'exact', head: true })
    .eq('activa', true)

  const { data: ultima } = await supabaseAdmin
    .from('agencias_shalom')
    .select('actualizada_en')
    .order('actualizada_en', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (errTotal || errActivas) {
    return NextResponse.json(
      { error: errTotal?.message ?? errActivas?.message ?? 'Error' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    total: total ?? 0,
    activas: activas ?? 0,
    inactivas: (total ?? 0) - (activas ?? 0),
    actualizada_en: ultima?.actualizada_en ?? null,
  })
}

export async function POST() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const r = await ejecutarSyncShalom()
  await registrarAuditoria(auth, 'sync_agencias', {
    ok: r.ok,
    sincronizadas: r.sincronizadas ?? null,
    version: r.version ?? null,
    error: r.error ?? null,
  })

  return NextResponse.json(r, { status: r.ok ? 200 : 502 })
}
