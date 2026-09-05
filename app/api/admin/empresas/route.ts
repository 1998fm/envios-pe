import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/adminAuth'
import { computeEffectivePlan, type PlanName } from '@/lib/planGating'

export async function GET(request: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const url = new URL(request.url)
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('perPage') ?? 20)))
  const filterPlan = url.searchParams.get('plan') ?? ''

  // Traer todos los perfiles (volumen manejable) y filtrar en memoria,
  // porque el "plan efectivo" se calcula, no está como columna.
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mapa de email por usuario (para mostrar en la tabla).
  let emails = new Map<string, string>()
  try {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (users?.users) {
      emails = new Map(users.users.map((u) => [u.id, u.email ?? '']))
    }
  } catch (e) {
    console.error('[admin] error listando usuarios:', e)
  }

  const filas = (profiles ?? []).map((p) => {
    const eff = computeEffectivePlan(p)
    return {
      id: p.id,
      empresa: p.empresa ?? '',
      slug: p.slug ?? '',
      telefono: p.telefono ?? '',
      email: emails.get(p.id) ?? '',
      plan: eff.plan,
      isTrial: eff.isTrial,
      diasRestantes: eff.diasRestantes,
      planDeclarado: p.plan,
      trial_end: p.trial_end,
      pro_until: p.pro_until,
      disabled: !!p.disabled,
      role: p.role ?? 'user',
      created_at: p.created_at,
    }
  })

  let resultados = filas

  if (search) {
    resultados = resultados.filter(
      (r) =>
        (r.empresa || '').toLowerCase().includes(search) ||
        (r.slug || '').toLowerCase().includes(search) ||
        (r.email || '').toLowerCase().includes(search)
    )
  }

  if (filterPlan) {
    resultados = resultados.filter((r) => r.plan === filterPlan)
  }

  const total = resultados.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage
  const items = resultados.slice(start, start + perPage)

  return NextResponse.json({
    items,
    total,
    page,
    perPage,
    totalPages,
  })
}
