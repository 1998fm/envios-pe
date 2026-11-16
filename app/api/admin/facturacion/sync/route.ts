import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/adminAuth'
import { ErrorBilling } from '@/lib/billing/types'
import { sincronizarPagosMP } from '@/lib/facturacion'
export const maxDuration = 300

// POST: botón "Sincronizar pagos" en Facturación. Consulta MercadoPago y
// registra comprobantes de cobros verificados.
export async function POST() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await sincronizarPagosMP()
    return NextResponse.json({ ok: result.errores === 0, ...result, error: result.errores ? "Sincronización parcial: revisa el detalle de contratos con error." : undefined }, { status: result.errores ? 503 : 200 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof ErrorBilling ? e.message : 'No se pudo sincronizar los pagos con MercadoPago.' }, { status: 503 })
  }
}