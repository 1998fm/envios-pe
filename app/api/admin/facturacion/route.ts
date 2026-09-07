import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/adminAuth'
import { computeEffectivePlan } from '@/lib/planGating'

// Precios mensuales por plan (mismo criterio que overvview para MRR).
const PRECIO_MENSUAL: Record<string, number> = {
  pro: 29.9,
  business_plus: 49.9,
}

export async function GET(request: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const url = new URL(request.url)
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
  const estado = url.searchParams.get('estado') ?? '' // '', 'vigente' | 'vencido'

  // Quienes "han pagado" = perfiles con pro_until alguna vez establecido.
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa, slug, plan, trial_end, pro_until, created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let emails = new Map<string, string>()
  try {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (users?.users) {
      emails = new Map(users.users.map((u) => [u.id, u.email ?? '']))
    }
  } catch (e) {
    console.error('[admin] error listando usuarios:', e)
  }

  const now = new Date()

  const filas = (profiles ?? [])
    .filter((p) => p.pro_until != null)
    .map((p) => {
      const proUntil = new Date(p.pro_until)
      const vigente = proUntil > now
      const dias = Math.ceil((proUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const eff = computeEffectivePlan(p)
      return {
        id: p.id,
        empresa: p.empresa ?? '',
        slug: p.slug ?? '',
        email: emails.get(p.id) ?? '',
        plan: eff.plan,
        planDeclarado: p.plan,
        pro_until: p.pro_until,
        estado: (vigente ? 'vigente' : 'vencido') as 'vigente' | 'vencido',
        dias,
        mrr: vigente ? (PRECIO_MENSUAL[eff.plan] ?? 0) : 0,
        ultimo_pago: p.pro_until,
      }
    })

  let resultados = filas

  if (search) {
    resultados = resultados.filter(
      (r) =>
        r.empresa.toLowerCase().includes(search) ||
        r.slug.toLowerCase().includes(search) ||
        r.email.toLowerCase().includes(search)
    )
  }

  if (estado === 'vigente' || estado === 'vencido') {
    resultados = resultados.filter((r) => r.estado === estado)
  }

  resultados.sort((a, b) => new Date(b.pro_until).getTime() - new Date(a.pro_until).getTime())

  const total = resultados.length
  const vigentes = resultados.filter((r) => r.estado === 'vigente').length
  const vencidos = total - vigentes
  const mrr = Math.round(resultados.reduce((a, r) => a + r.mrr, 0) * 100) / 100

  return NextResponse.json({
    items: resultados,
    total,
    vigentes,
    vencidos,
    mrr,
    ahora: now.toISOString(),
  })
}