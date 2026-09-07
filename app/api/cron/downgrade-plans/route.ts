import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { computeEffectivePlan } from '@/lib/planGating'
import { sincronizarPagosMP } from '@/lib/facturacion'

export const dynamic = 'force-dynamic'

// GET: invocado por el cron diario de Vercel.
// 1) Reconcilia pagos con MercadoPago (recupera suscripciones autorizadas que
//    el webhook pudiera haber perdido). 2) Degrada a basic los perfiles cuyo
//    trial/pro pagado ya venció, para que la columna plan no quede desactualizada.
export async function GET(request: Request) {
  const esCron = request.headers.get('x-vercel-cron')
  if (!esCron) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let pagos = { revisadas: 0, sincronizadas: 0, errores: 0 }
  try {
    pagos = await sincronizarPagosMP()
  } catch (e) {
    console.error('[cron] error reconciliando pagos:', e)
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

  return NextResponse.json({ ok: true, revisados, degradados, pagos })
}