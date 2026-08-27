import { NextResponse } from 'next/server'
import { checkTrialStatus, getPlanFeatures, type PlanFeature } from '@/lib/planLimits'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const trial = await checkTrialStatus(userId)
  const features: PlanFeature | null = await getPlanFeatures(trial.plan)

  return NextResponse.json({
    plan: trial.plan,
    isTrial: trial.isTrial,
    isPaid: trial.isPaid,
    daysRemaining: trial.daysRemaining,
    max_envios: features?.max_envios ?? null,
    max_metodos: features?.max_metodos ?? null,
    max_productos: features?.max_productos ?? null,
    max_ventas: features?.max_ventas ?? null,
    max_exportaciones_shalom: features?.max_exportaciones_shalom ?? null,
    max_pedidos_copiar: features?.max_pedidos_copiar ?? null,
  })
}
