import { NextResponse } from 'next/server'
import { requirePlus } from '@/lib/negocioAuth'
import { checkShalomExportLimit, registrarExportacionShalom } from '@/lib/planLimits'

export async function GET() {
  const auth = await requirePlus('ver_envios')
  if (!auth.ok) return auth.response
  const userId = auth.ownerId

  const { used, max } = await checkShalomExportLimit(userId)
  return NextResponse.json({ used, max })
}

export async function POST(request: Request) {
  const auth = await requirePlus('ver_envios')
  if (!auth.ok) return auth.response
  const user_id = auth.ownerId

  const body = await request.json().catch(() => ({}))
  const cantidad = Math.max(0, Math.floor(Number(body.cantidad) || 0))

  const { allowed, used, max, reason } = await checkShalomExportLimit(user_id)

  if (!allowed) {
    return NextResponse.json({ error: reason, used, max }, { status: 403 })
  }

  await registrarExportacionShalom(user_id, cantidad ?? 0)

  return NextResponse.json({ ok: true, used: used + 1, max })
}
