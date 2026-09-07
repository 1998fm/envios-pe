import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { computeEffectivePlan } from '@/lib/planGating'

export const dynamic = 'force-dynamic'

// GET: invocado por el cron diario de Vercel.
// Degrada a basic los perfiles cuyo trial/pro pagado ya venció,
// para que la columna plan no quede desactualizada.
export async function GET(request: Request) {
  const esCron = request.headers.get('x-vercel-cron')
  if (!esCron) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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

  return NextResponse.json({ ok: true, revisados, degradados })
}