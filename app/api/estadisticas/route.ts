import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const now = new Date()

  // Fixed ranges
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  async function countEnvios(desde: Date, hasta?: Date) {
    let q = supabaseAdmin
      .from('envios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('fecha_registro', desde.toISOString())
    if (hasta) q = q.lt('fecha_registro', hasta.toISOString())
    const { count } = await q
    return count ?? 0
  }

  const [hoy, semana, mes] = await Promise.all([
    countEnvios(startOfDay),
    countEnvios(startOfWeek),
    countEnvios(startOfMonth),
  ])

  // Método más popular (overall)
  const { data: metodoPopular } = await supabaseAdmin
    .from('envios')
    .select('metodo')
    .eq('user_id', userId)
    .order('fecha_registro', { ascending: false })

  const metodoCounts: Record<string, number> = {}
  metodoPopular?.forEach((e: any) => {
    const m = e.metodo || 'SIN_METODO'
    metodoCounts[m] = (metodoCounts[m] || 0) + 1
  })
  let topMetodo: { metodo: string; count: number } | null = null
  for (const [metodo, count] of Object.entries(metodoCounts)) {
    if (!topMetodo || count > topMetodo.count) {
      topMetodo = { metodo, count }
    }
  }

  // Date range for charts
  const rangeDesde = desde ? new Date(desde) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const rangeHasta = hasta ? new Date(hasta + 'T23:59:59.999Z') : new Date()

  const desdeISO = rangeDesde.toISOString()
  const hastaISO = rangeHasta.toISOString()

  // Get envios in range
  const { data: envios } = await supabaseAdmin
    .from('envios')
    .select('fecha_registro, metodo, estado')
    .eq('user_id', userId)
    .gte('fecha_registro', desdeISO)
    .lte('fecha_registro', hastaISO)
    .order('fecha_registro', { ascending: true })

  // Tendencia diaria
  const dailyMap: Record<string, number> = {}
  const metodoMap: Record<string, number> = {}
  const estadoMap: Record<string, number> = {}

  envios?.forEach((e: any) => {
    const day = e.fecha_registro.split('T')[0]
    dailyMap[day] = (dailyMap[day] || 0) + 1

    const m = e.metodo || 'SIN_METODO'
    metodoMap[m] = (metodoMap[m] || 0) + 1

    const s = e.estado || 'SIN_ESTADO'
    estadoMap[s] = (estadoMap[s] || 0) + 1
  })

  const tendenciaDiaria = Object.entries(dailyMap)
    .map(([fecha, count]) => ({ fecha, count }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const distribucionMetodo = Object.entries(metodoMap)
    .map(([metodo, count]) => ({ metodo, count }))
    .sort((a, b) => b.count - a.count)

  const distribucionEstado = Object.entries(estadoMap)
    .map(([estado, count]) => ({ estado, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    hoy,
    semana,
    mes,
    metodoPopular: topMetodo,
    tendenciaDiaria,
    distribucionMetodo,
    distribucionEstado,
    rango: {
      desde: rangeDesde.toISOString().split('T')[0],
      hasta: rangeHasta.toISOString().split('T')[0],
    },
  })
}
