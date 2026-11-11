import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/adminAuth'

// El acceso de plataforma no depende de membresías ni del plan del negocio.
export async function GET() {
  const auth = await requireSuperAdmin()
  const headers = { 'Cache-Control': 'no-store' }
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers })
  return NextResponse.json({ ok: true }, { headers })
}
