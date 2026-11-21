import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/adminAuth'
import { ErrorBilling } from '@/lib/billing/types'
import { recuperarPagosMP } from '@/lib/billing/recovery'
export const maxDuration = 300

// POST: botón "Sincronizar pagos" en Facturación. Consulta MercadoPago y
// registra comprobantes de cobros verificados.
export async function POST() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await recuperarPagosMP('admin')
    return NextResponse.json({ ...result, error: !result.ok ? ["Sincronización parcial: revisa el diagnóstico de pagos.", result.contratosDetalle, result.descubrimientoDetalle].filter(Boolean).join(" ") : undefined }, { status: !result.ok ? 503 : 200 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof ErrorBilling ? e.message : 'No se pudo sincronizar los pagos con MercadoPago.' }, { status: 503 })
  }
}