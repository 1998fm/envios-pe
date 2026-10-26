import { NextResponse } from 'next/server'
import { cronAutorizado, claveValida } from '@/lib/cronAuth'
import { ejecutarSyncOlva } from '@/lib/olva/sync'

// GET: invocado por el cron semanal de Vercel.
// Vercel envía Authorization: Bearer $CRON_SECRET (variable CRON_SECRET).
export async function GET(request: Request) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const r = await ejecutarSyncOlva()
  return NextResponse.json(r, { status: r.ok ? 200 : 502 })
}

// POST: llamadas manuales (o por clave).
// Requiere cabecera x-sync-key == OLVA_SYNC_SECRET.
export async function POST(request: Request) {
  if (!claveValida(request.headers.get('x-sync-key'), process.env.OLVA_SYNC_SECRET)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const r = await ejecutarSyncOlva()
  return NextResponse.json(r, { status: r.ok ? 200 : 502 })
}