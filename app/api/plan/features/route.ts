import { NextResponse } from 'next/server'
import { requireNegocio } from '@/lib/negocioAuth'
import { checkTrialStatus, getPlanFeatures, type PlanFeature } from '@/lib/planLimits'

export async function GET() {
  const auth = await requireNegocio()
  if (!auth.ok) return auth.response
  const userId = auth.ownerId

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
    max_miembros: features?.max_miembros ?? null,
  })
}
