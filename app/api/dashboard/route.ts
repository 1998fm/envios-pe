import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)

  async function sumVentas(desde: Date, hasta?: Date, estados?: string[]) {
    let q = supabaseAdmin
      .from('ventas')
      .select('total')
      .eq('profile_id', userId)
      .gte('created_at', desde.toISOString())
    if (hasta) q = q.lt('created_at', hasta.toISOString())
    if (estados && estados.length) {
      q = q.in('estado', estados)
    }
    const { data } = await q
    return (data ?? []).reduce((acc: number, v: any) => acc + Number(v.total || 0), 0)
  }

  async function sumCompras(desde: Date, hasta?: Date, estados?: string[]) {
    let q = supabaseAdmin
      .from('compras')
      .select('total')
      .eq('profile_id', userId)
      .gte('created_at', desde.toISOString())
    if (hasta) q = q.lt('created_at', hasta.toISOString())
    if (estados && estados.length) {
      q = q.in('estado', estados)
    }
    const { data } = await q
    return (data ?? []).reduce((acc: number, v: any) => acc + Number(v.total || 0), 0)
  }

  async function countEnvios(desde: Date, hasta?: Date, estados?: string[]) {
    let q = supabaseAdmin
      .from('envios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('fecha_registro', desde.toISOString())
    if (hasta) q = q.lt('fecha_registro', hasta.toISOString())
    if (estados && estados.length) q = q.in('estado', estados)
    const { count } = await q
    return count ?? 0
  }

  async function countVentas(desde: Date, hasta?: Date, estados?: string[]) {
    let q = supabaseAdmin
      .from('ventas')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .gte('created_at', desde.toISOString())
    if (hasta) q = q.lt('created_at', hasta.toISOString())
    if (estados && estados.length) q = q.in('estado', estados)
    const { count } = await q
    return count ?? 0
  }

  const [
    ventasMes,
    ventasMesAnterior,
    ventasHoy,
    ventasAyer,
    enviosMes,
    enviosMesAnterior,
    enviosHoy,
    cobrosPendientes,
    cobrosPendientesTotal,
    sinEmpacar,
    empacados,
    stockBajoCount,
    totalVentas,
    totalCompras,
  ] = await Promise.all([
    sumVentas(startOfMonth, startOfNextMonth, ['COMPLETADA', 'PENDIENTE']),
    sumVentas(startOfPrevMonth, startOfMonth, ['COMPLETADA', 'PENDIENTE']),
    sumVentas(startOfDay, new Date(), ['COMPLETADA', 'PENDIENTE']),
    sumVentas(startOfYesterday, startOfDay, ['COMPLETADA', 'PENDIENTE']),
    countEnvios(startOfMonth, startOfNextMonth),
    countEnvios(startOfPrevMonth, startOfMonth),
    countEnvios(startOfDay),
    countVentas(new Date(0), undefined, ['PENDIENTE']),
    sumVentas(new Date(0), undefined, ['PENDIENTE']),
    countEnvios(new Date(0), undefined, ['NO_EMPACADO']),
    countEnvios(new Date(0), undefined, ['EMPACADO']),
    countProductosStockBajo(supabaseAdmin, userId),
    sumVentas(new Date(0), undefined, ['COMPLETADA', 'PENDIENTE']),
    sumCompras(new Date(0), undefined, ['COMPLETADA']),
  ])

  const fechaInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [{ data: enviosRango }, { data: ventasRango }] = await Promise.all([
    supabaseAdmin
      .from('envios')
      .select('fecha_registro, metodo, estado')
      .eq('user_id', userId)
      .gte('fecha_registro', `${fechaInicio}T00:00:00.000Z`)
      .order('fecha_registro', { ascending: true }),
    supabaseAdmin
      .from('ventas')
      .select('created_at, metodo_pago, total, estado')
      .eq('profile_id', userId)
      .gte('created_at', `${fechaInicio}T00:00:00.000Z`)
      .order('created_at', { ascending: true }),
  ])

  const tendenciaDiaria: { fecha: string; count: number }[] = []
  const dailyMap: Record<string, number> = {}
  enviosRango?.forEach((e: any) => {
    const day = e.fecha_registro.split('T')[0]
    dailyMap[day] = (dailyMap[day] || 0) + 1
  })
  Object.entries(dailyMap)
    .map(([fecha, count]) => ({ fecha, count }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .forEach((item) => tendenciaDiaria.push(item))

  const metodoMap: Record<string, number> = {}
  ventasRango?.forEach((v: any) => {
    const m = v.metodo_pago || 'SIN_METODO'
    metodoMap[m] = (metodoMap[m] || 0) + Number(v.total || 0)
  })
  const ventasPorMetodo = Object.entries(metodoMap)
    .map(([metodo, total]) => ({ metodo, total }))
    .sort((a, b) => b.total - a.total)

  const estadoEnvioMap: Record<string, number> = {}
  enviosRango?.forEach((e: any) => {
    const s = e.estado || 'SIN_ESTADO'
    estadoEnvioMap[s] = (estadoEnvioMap[s] || 0) + 1
  })
  const enviosPorEstado = Object.entries(estadoEnvioMap)
    .map(([estado, count]) => ({ estado, count }))
    .sort((a, b) => b.count - a.count)

  const metodoEnvioMap: Record<string, number> = {}
  enviosRango?.forEach((e: any) => {
    const m = e.metodo || 'SIN_METODO'
    metodoEnvioMap[m] = (metodoEnvioMap[m] || 0) + 1
  })
  const enviosPorMetodo = Object.entries(metodoEnvioMap)
    .map(([metodo, count]) => ({ metodo, count }))
    .sort((a, b) => b.count - a.count)

  const [{ data: stockBajo }, { data: recientesEnvios }, { data: recientesVentas }] = await Promise.all([
    supabaseAdmin
      .from('productos')
      .select('nombre, stock_actual, stock_minimo, unidad')
      .eq('profile_id', userId)
      .or('stock_actual.lte.stock_minimo')
      .order('stock_actual', { ascending: true })
      .limit(5),
    supabaseAdmin
      .from('envios')
      .select('id, nombre, estado, metodo, fecha_registro')
      .eq('user_id', userId)
      .order('fecha_registro', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('ventas')
      .select('id, persona_nombre, total, estado, metodo_pago, created_at')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const delta = (actual: number, anterior: number) =>
    anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : null

  return NextResponse.json({
    kpis: {
      ventasMes,
      ventasHoy,
      cobrosPendientes,
      cobrosPendientesTotal,
      pedidosPorDespachar: sinEmpacar + empacados,
      enviosMes,
      stockBajo: stockBajoCount,
      totalVentas,
      totalCompras,
      saldoDisponible: totalVentas - totalCompras,
    },
    pendientes: {
      sinEmpacar,
      empacados,
      cobrosPendientes,
      cobrosPendientesTotal,
      stockBajo: stockBajoCount,
    },
    deltas: {
      ventasMes: delta(ventasMes, ventasMesAnterior),
      enviosMes: delta(enviosMes, enviosMesAnterior),
      ventasHoy: delta(ventasHoy, ventasAyer),
    },
    graficos: {
      tendenciaDiaria,
      ventasPorMetodo,
      enviosPorEstado,
      enviosPorMetodo,
    },
    stockBajo: stockBajo ?? [],
    recientes: {
      envios: recientesEnvios ?? [],
      ventas: recientesVentas ?? [],
    },
  })
}

async function countProductosStockBajo(client: typeof supabaseAdmin, userId: string) {
  const { data } = await client
    .from('productos')
    .select('id')
    .eq('profile_id', userId)
    .or('stock_actual.lte.stock_minimo')
  return data?.length ?? 0
}
