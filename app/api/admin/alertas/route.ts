import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/adminAuth'
import { computeEffectivePlan } from '@/lib/planGating'

type Alerta = {
  tipo: 'trial' | 'plan_vencido' | 'inactiva' | 'cuota'
  nivel: 'warning' | 'danger' | 'info'
  titulo: string
  descripcion: string
  empresaId?: string
}

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const now = new Date()
  const alertas: Alerta[] = []

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa, slug, plan, trial_end, pro_until, disabled, created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const perfiles = profiles ?? []

  // Trials que expiran pronto o vencidos.
  for (const p of perfiles) {
    if (p.disabled) continue
    const eff = computeEffectivePlan(p)
    const nombre = p.empresa ?? p.slug ?? p.id

    if (eff.isTrial && eff.diasRestantes != null) {
      const d = eff.diasRestantes
      if (d <= 3) {
        alertas.push({
          tipo: 'trial',
          nivel: d <= 0 ? 'danger' : 'warning',
          titulo: `Trial por vencer: ${nombre}`,
          descripcion: d <= 0 ? 'El trial de esta empresa ya venció hoy.' : `Expira en ${d} día(s).`,
          empresaId: p.id,
        })
      }
    }

    // Pro pago ya vencido (pasó pro_until, no trial activo).
    if (!eff.isTrial && p.pro_until && new Date(p.pro_until) <= now) {
      alertas.push({
        tipo: 'plan_vencido',
        nivel: 'warning',
        titulo: `Suscripción vencida: ${nombre}`,
        descripcion: 'Su plan Pro/Business Plus expiró y pasó a plan básico.',
        empresaId: p.id,
      })
    }
  }

  // Empresas sin actividad en los últimos 14 días (no bloqueadas, creadas hace > 14 días).
  const corte = new Date(now)
  corte.setDate(corte.getDate() - 14)
  corte.setHours(0, 0, 0, 0)
  const corteIso = corte.toISOString()

  const ids = perfiles.filter((p) => !p.disabled).map((p) => p.id)

  if (ids.length > 0) {
    const { data: envios } = await supabaseAdmin
      .from('envios')
      .select('user_id')
      .gte('fecha_registro', corteIso)
      .in('user_id', ids)

    const activos = new Set((envios ?? []).map((e) => e.user_id))

    for (const p of perfiles) {
      if (p.disabled) continue
      const creado = p.created_at ? new Date(p.created_at) : null
      if (creado && now.getTime() - creado.getTime() > 14 * 86400000 && !activos.has(p.id)) {
        alertas.push({
          tipo: 'inactiva',
          nivel: 'info',
          titulo: `Empresa inactiva: ${p.empresa ?? p.slug ?? p.id}`,
          descripcion: 'Sin envíos en los últimos 14 días.',
          empresaId: p.id,
        })
      }
    }
  }

  // Ordenar: danger primero.
  const orden = { danger: 0, warning: 1, info: 2 }
  alertas.sort((a, b) => orden[a.nivel] - orden[b.nivel])

  return NextResponse.json({
    total: alertas.length,
    danger: alertas.filter((a) => a.nivel === 'danger').length,
    warning: alertas.filter((a) => a.nivel === 'warning').length,
    info: alertas.filter((a) => a.nivel === 'info').length,
    alertas,
  })
}