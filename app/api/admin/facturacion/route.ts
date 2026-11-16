import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/adminAuth'
import { computeEffectivePlan } from '@/lib/planGating'
import { mensajeDb } from '@/lib/erroresEs'

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
  const paginaRecibos = Math.max(1, Math.floor(Number(url.searchParams.get('paginaRecibos')) || 1))
  const estado = url.searchParams.get('estado') ?? '' // '', 'vigente' | 'vencido'

  // Quienes "han pagado" = perfiles con pro_until alguna vez establecido.
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa, slug, plan, trial_end, pro_until, created_at')

  if (error) {
    return NextResponse.json({ error: mensajeDb(error) }, { status: 500 })
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

  // Comprobantes de pago registrados (recibos de MercadoPago via webhook/reconciliación).
  let recibos: {
    id: string
    user_id: string
    empresa: string
    slug: string
    email: string
    plan: string
    monto: number
    periodo_meses: number
    pro_until: string | null
    origen: string
    pagado_en: string | null
  }[] = []

  let totalRecibos = 0
  try {
    const { data: comprobantes, error: errorPagos, count } = await supabaseAdmin
      .from('pagos')
      .select('id, user_id, preapproval_id, plan, monto, periodo_meses, pro_until, origen, created_at', { count: 'exact' })
      .order('created_at', { ascending: false }).order('id', { ascending: false })
      .range((paginaRecibos - 1) * 100, paginaRecibos * 100 - 1)
    if (errorPagos) throw new Error('No se pudieron consultar los pagos registrados.')
    totalRecibos = count ?? 0

    const perfilesPorId = new Map((profiles ?? []).map((p) => [p.id, p]))

    recibos = (comprobantes ?? []).map((c) => {
      let meta: { tipo?: string; estado?: string; aprobado?: string; canal?: string; payment_id?: string; preapproval_id?: string; inicio?: string; reembolsado?: number } = {}
      try { meta = JSON.parse(c.origen) } catch {}
      const perfil = perfilesPorId.get(c.user_id)
      return {
        id: c.id,
        payment_id: meta.payment_id ?? null,
        suscripcion_id: meta.preapproval_id ?? c.preapproval_id,
        inicio: meta.inicio ?? null,
        reembolsado: meta.reembolsado ?? 0,
        user_id: c.user_id,
        empresa: perfil?.empresa ?? '',
        slug: perfil?.slug ?? '',
        email: emails.get(c.user_id) ?? '',
        plan: c.plan,
        monto: Number(c.monto),
        periodo_meses: c.periodo_meses,
        pro_until: c.pro_until,
        origen: meta.tipo === 'mp-payment' ? `${meta.canal === 'reconciliacion' ? 'Conciliación' : 'Notificación'} · ${({ approved: 'aprobado', partially_refunded: 'reembolso parcial', refunded: 'reembolsado', charged_back: 'contracargo', rejected: 'rechazado', pending: 'pendiente' } as Record<string,string>)[meta.estado ?? ''] ?? meta.estado}` : c.origen,
        estado_pago: meta.estado ?? 'historico',
        pagado_en: meta.tipo === 'mp-payment' ? meta.aprobado || null : c.created_at,
      }
    })
  } catch {
    return NextResponse.json({ error: 'No se pudieron consultar los pagos registrados. No se muestra un historial vacío como si fuera correcto.' }, { status: 503 })
  }

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
        mrr: vigente ? (PRECIO_MENSUAL[p.plan === 'pro' ? 'pro' : eff.plan] ?? 0) : 0,
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
    recibos,
    totalRecibos,
    paginaRecibos,
    ahora: now.toISOString(),
  })
}