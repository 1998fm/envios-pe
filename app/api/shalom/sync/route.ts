import { NextResponse } from 'next/server'
import { ejecutarSyncShalom } from '@/lib/shalom/sync'

// GET: invocado por el cron semanal de Vercel.
// Vercel inyecta la cabecera x-vercel-cron solo en peticiones de cron,
// por lo que sirve como verificación de que la petición viene de Vercel.
export async function GET(request: Request) {
  const esCron = request.headers.get('x-vercel-cron')
  if (!esCron) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const r = await ejecutarSyncShalom()
  return NextResponse.json(r, { status: r.ok ? 200 : 502 })
}

// POST: llamadas manuales / panel de super admin (o por clave).
// Requiere cabecera x-sync-key == SHALOM_SYNC_SECRET.
export async function POST(request: Request) {
  const key = request.headers.get('x-sync-key')
  const expected = process.env.SHALOM_SYNC_SECRET
  if (!expected || key !== expected) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const r = await ejecutarSyncShalom()
  return NextResponse.json(r, { status: r.ok ? 200 : 502 })
}
