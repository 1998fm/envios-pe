import { NextResponse } from 'next/server'
import { checkShalomExportLimit, registrarExportacionShalom } from '@/lib/planLimits'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const { used, max } = await checkShalomExportLimit(userId)
  return NextResponse.json({ used, max })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, cantidad } = body

  if (!user_id) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const { allowed, used, max, reason } = await checkShalomExportLimit(user_id)

  if (!allowed) {
    return NextResponse.json({ error: reason, used, max }, { status: 403 })
  }

  await registrarExportacionShalom(user_id, cantidad ?? 0)

  return NextResponse.json({ ok: true, used: used + 1, max })
}
