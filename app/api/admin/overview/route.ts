import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/adminAuth'
import { computeEffectivePlan } from '@/lib/planGating'

// Precios mensuales por plan (para estimar MRR).
const PRECIO_MENSUAL: Record<string, number> = {
  pro: 29.9,
  business_plus: 49.9,
}

// Últimos N días de actividad para el gráfico.
const DIAS = 14

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const now = new Date()

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa, slug, plan, trial_end, pro_until, disabled, created_at')

  const perfiles = profiles ?? []
  const total = perfiles.length
  const activas = perfiles.filter((p) => !p.disabled).length

  // Clasificar por plan efectivo.
  let enTrial = 0
  let pagando = 0
  let basic = 0
  let mrr = 0
  const proximosExpiarTrial: { id: string; empresa: string; dias: number }[] = []

  for (const p of perfiles) {
    if (p.disabled) continue
    const eff = computeEffectivePlan(p)
    if (eff.plan === 'basic') basic++
    if (eff.isTrial) {
      enTrial++
      const dias = eff.diasRestantes ?? 99
      if (dias <= 7) {
        proximosExpiarTrial.push({ id: p.id, empresa: p.empresa ?? p.slug ?? '-', dias })
      }
    } else if (p.pro_until && new Date(p.pro_until) > now) {
      pagando++
    }
    if (eff.plan !== 'basic') {
      mrr += PRECIO_MENSUAL[eff.plan] ?? 0
    }
  }

  // Actividad global: envíos y ventas por día (últimos DIAS días), en hora Perú.
  const PE = '-05:00'
  const hoyLima = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  const desde = new Date(new Date(`${hoyLima}T00:00:00${PE}`).getTime() - (DIAS - 1) * 24 * 60 * 60 * 1000)
  const diaLima = (iso?: string | null) =>
    iso ? new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined

  const { data: envios } = await supabaseAdmin
    .from('envios')
    .select('created_at, fecha_registro')
    .gte('fecha_registro', desde.toISOString())

  const { data: ventas } = await supabaseAdmin
    .from('ventas')
    .select('created_at')
    .gte('created_at', desde.toISOString())

  // Serie de los últimos DIAS días.
  const serie: { dia: string; envios: number; ventas: number }[] = []
  for (let i = 0; i < DIAS; i++) {
    const clave = diaLima(new Date(desde.getTime() + i * 24 * 60 * 60 * 1000).toISOString())
    serie.push({ dia: clave ?? '', envios: 0, ventas: 0 })
  }

  ;(envios ?? []).forEach((e) => {
    const k = diaLima(e.fecha_registro)
    const slot = serie.find((s) => s.dia === k)
    if (slot) slot.envios++
  })

  ;(ventas ?? []).forEach((v) => {
    const k = diaLima(v.created_at)
    const slot = serie.find((s) => s.dia === k)
    if (slot) slot.ventas++
  })

  // Totales globales.
  const totalEnvios = (envios ?? []).length
  const totalVentas = (ventas ?? []).length

  return NextResponse.json({
    total,
    activas,
    desactivadas: total - activas,
    enTrial,
    pagando,
    basic,
    mrr: Math.round(mrr * 100) / 100,
    proximosExpiarTrial,
    totalEnvios,
    totalVentas,
    serie,
    ahora: now.toISOString(),
  })
}
