import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/adminAuth'
import { sincronizarPagosMP } from '@/lib/facturacion'

// POST: botón "Sincronizar pagos" en Facturación. Consulta MercadoPago y
// registra/renueva los comprobantes de suscripciones autorizadas.
export async function POST() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await sincronizarPagosMP()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}