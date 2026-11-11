import { NextResponse } from 'next/server'
import { cronAutorizado } from '@/lib/cronAuth'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { computeEffectivePlan } from '@/lib/planGating'
import { sincronizarPagosMP } from '@/lib/facturacion'

export const maxDuration = 300

export const dynamic = 'force-dynamic'

// GET: invocado por el cron diario de Vercel (Authorization: Bearer $CRON_SECRET).
// 1) Reconcilia pagos con MercadoPago (recupera cobros aprobados que
//    el webhook pudiera haber perdido). 2) Degrada a basic los perfiles cuyo
//    trial/pro pagado ya venció, para que la columna plan no quede desactualizada.
export async function GET(request: Request) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let pagos = { revisadas: 0, sincronizadas: 0, errores: 0 }
  let falloPagos = false
  try {
    pagos = await sincronizarPagosMP()
  } catch {
    falloPagos = true
    console.error('[cron] No se pudo conciliar Mercado Pago.')
  }

  const { data: perfiles } = await supabaseAdmin
    .from('profiles')
    .select('id, plan, trial_end, pro_until')
    .in('plan', ['pro', 'business_plus'])

  let degradados = 0
  let revisados = 0

  for (const p of perfiles ?? []) {
    revisados++
    const eff = computeEffectivePlan(p)
    if (eff.plan === 'basic') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ plan: 'basic' })
        .eq('id', p.id)
      if (!error) degradados++
    }
  }

  return NextResponse.json({ ok: !falloPagos && pagos.errores === 0, revisados, degradados, pagos }, { status: falloPagos || pagos.errores ? 503 : 200 })
}