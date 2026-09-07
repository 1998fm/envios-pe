import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export type PlanPagoDb = 'pro' | 'business_plus'

// Guarda/renueva un comprobante de pago (pagos) y actualiza pro_until del perfil,
// conservando siempre el vencimiento más lejano (no se pierden días pagados).
// El registro en `pagos` es best-effort: si la tabla aún no existe (migración
// pendiente) no bloquea la activación del plan.
export async function registrarPago(params: {
  userId: string
  preapprovalId: string
  plan: PlanPagoDb
  monto: number
  meses: number
  proUntil: Date
  origen?: string
}): Promise<void> {
  const iso = params.proUntil.toISOString()

  try {
    const { error: errUpsert } = await supabaseAdmin
      .from('pagos')
      .upsert(
        {
          user_id: params.userId,
          preapproval_id: params.preapprovalId,
          plan: params.plan,
          monto: params.monto,
          periodo_meses: params.meses,
          pro_until: iso,
          origen: params.origen ?? 'webhook',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'preapproval_id' }
      )

    if (errUpsert) {
      console.warn('[pagos] no se pudo guardar el comprobante:', errUpsert.message)
    }
  } catch (e) {
    console.warn('[pagos] tabla no disponible, se omite el comprobante:', (e as Error).message)
  }

  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('pro_until')
    .eq('id', params.userId)
    .maybeSingle()

  const actual = perfil?.pro_until ? new Date(perfil.pro_until) : null
  const final = actual && actual > params.proUntil ? actual : params.proUntil

  const { error: errPerfil } = await supabaseAdmin
    .from('profiles')
    .update({ plan: params.plan, pro_until: final.toISOString() })
    .eq('id', params.userId)

  if (errPerfil) {
    throw new Error(`No se pudo actualizar el perfil: ${errPerfil.message}`)
  }
}