import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/adminAuth'

const DIAS = 7

type ActividadRow = {
  id: string
  empresa: string
  slug: string
  email: string
  disabled: boolean
  plan: string
  ultima_actividad: string | null
  total_acciones: number
  envios: number
  ventas: number
  compras: number
  gastos: number
}

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const now = new Date()
  const desde = new Date(now)
  desde.setDate(desde.getDate() - (DIAS - 1))
  desde.setHours(0, 0, 0, 0)
  const desdeIso = desde.toISOString()

  // Mapa de perfiles.
  const { data: profiles, error: errProfiles } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa, slug, plan, disabled')

  if (errProfiles) {
    return NextResponse.json({ error: errProfiles.message }, { status: 500 })
  }

  // Mapa de emails.
  let emails = new Map<string, string>()
  try {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (users?.users) emails = new Map(users.users.map((u) => [u.id, u.email ?? '']))
  } catch (e) {
    console.error('[admin] error listando usuarios (actividad):', e)
  }

  // Conteo de actividad por perfil en los últimos 7 días por tabla.
  const recuento = new Map<
    string,
    { envios: number; ventas: number; compras: number; gastos: number; ultima: string | null }
  >()

  const sumar = (perfilId: string, tabla: 'envios' | 'ventas' | 'compras' | 'gastos', fecha: string | null) => {
    const actual = recuento.get(perfilId) ?? { envios: 0, ventas: 0, compras: 0, gastos: 0, ultima: null }
    actual[tabla] += 1
    if (fecha && (!actual.ultima || fecha > actual.ultima)) actual.ultima = fecha
    recuento.set(perfilId, actual)
  }

  // Envíos (user_id + fecha_registro).
  const { data: envios } = await supabaseAdmin
    .from('envios')
    .select('user_id, fecha_registro')
    .gte('fecha_registro', desdeIso)
  ;(envios ?? []).forEach((e) => e.user_id && sumar(e.user_id, 'envios', e.fecha_registro))

  // Ventas (profile_id + created_at).
  const { data: ventas } = await supabaseAdmin
    .from('ventas')
    .select('profile_id, created_at')
    .gte('created_at', desdeIso)
  ;(ventas ?? []).forEach((v) => v.profile_id && sumar(v.profile_id, 'ventas', v.created_at))

  // Compras (profile_id + created_at).
  const { data: compras } = await supabaseAdmin
    .from('compras')
    .select('profile_id, created_at')
    .gte('created_at', desdeIso)
  ;(compras ?? []).forEach((c) => c.profile_id && sumar(c.profile_id, 'compras', c.created_at))

  // Gastos (profile_id + created_at).
  const { data: gastos } = await supabaseAdmin
    .from('gastos')
    .select('profile_id, created_at')
    .gte('created_at', desdeIso)
  ;(gastos ?? []).forEach((g) => g.profile_id && sumar(g.profile_id, 'gastos', g.created_at))

  const filas: ActividadRow[] = (profiles ?? []).map((p) => {
    const r = recuento.get(p.id) ?? { envios: 0, ventas: 0, compras: 0, gastos: 0, ultima: null }
    return {
      id: p.id,
      empresa: p.empresa ?? '',
      slug: p.slug ?? '',
      email: emails.get(p.id) ?? '',
      disabled: !!p.disabled,
      plan: p.plan ?? 'basic',
      ultima_actividad: r.ultima,
      total_acciones: r.envios + r.ventas + r.compras + r.gastos,
      envios: r.envios,
      ventas: r.ventas,
      compras: r.compras,
      gastos: r.gastos,
    }
  })

  // Solo usuarios con actividad en los últimos 7 días, ordenados por última actividad.
  const activos = filas
    .filter((f) => f.total_acciones > 0)
    .sort((a, b) => (b.ultima_actividad ?? '').localeCompare(a.ultima_actividad ?? ''))

  return NextResponse.json({
    dias: DIAS,
    desde: desdeIso,
    total_activos: activos.length,
    activos,
  })
}
