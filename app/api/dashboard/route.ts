import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

const DIAS_HISTORICO = 90

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const now = new Date()
  const PE = '-05:00'
  // "Hoy" en hora Perú (UTC-5, sin DST): la medianoche peruana son las 05:00 UTC.
  const hoyLima = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }) // YYYY-MM-DD
  const startOfDay = new Date(`${hoyLima}T00:00:00${PE}`)
  const baseMes = new Date(`${hoyLima.slice(0, 8)}01T00:00:00${PE}`)
  const startOfMonth = new Date(baseMes)
  const startOfPrevMonth = new Date(baseMes)
  startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1)
  const startOfNextMonth = new Date(baseMes)
  startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1)
  const startOfYesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000)
  // Día calendario Perú de una fecha ISO (para buckets y cortes).
  const diaLima = (iso: string) =>
    new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000).toISOString().split('T')[0]

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

  async function sumGastos(desde: Date, hasta?: Date) {
    let q = supabaseAdmin
      .from('gastos')
      .select('monto')
      .eq('profile_id', userId)
      .gte('fecha', desde.toISOString().split('T')[0])
    if (hasta) q = q.lt('fecha', hasta.toISOString().split('T')[0])
    const { data } = await q
    return (data ?? []).reduce((acc: number, v: any) => acc + Number(v.monto || 0), 0)
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

  // Dinero realmente cobrado: suma de monto_pagado de todas las ventas no
  // anuladas. Una venta PENDIENTE con abono parcial aporta lo ya pagado, no el
  // total (así el saldo disponible refleja el dinero real en caja).
  async function sumCobrado(desde: Date, hasta?: Date, estados?: string[]) {
    let q = supabaseAdmin
      .from('ventas')
      .select('monto_pagado')
      .eq('profile_id', userId)
      .gte('created_at', desde.toISOString())
    if (hasta) q = q.lt('created_at', hasta.toISOString())
    if (estados && estados.length) q = q.in('estado', estados)
    const { data } = await q
    return (data ?? []).reduce((acc: number, v: any) => acc + Number(v.monto_pagado ?? 0), 0)
  }

  // Ventas pendientes con su saldo por cobrar (total - lo ya abonado)
  async function pendientesPorCobrar() {
    const { data } = await supabaseAdmin
      .from('ventas')
      .select('total, monto_pagado')
      .eq('profile_id', userId)
      .eq('estado', 'PENDIENTE')
    const filas = (data ?? []).filter((v: any) => Number(v.total ?? 0) > Number(v.monto_pagado ?? 0))
    const total = filas.reduce((acc: number, v: any) => acc + (Number(v.total ?? 0) - Number(v.monto_pagado ?? 0)), 0)
    return { cantidad: filas.length, total: Math.round(total * 100) / 100 }
  }

  const [
    ventasMes,
    ventasMesAnterior,
    ventasHoy,
    ventasAyer,
    enviosMes,
    enviosMesAnterior,
    enviosHoy,
    sinEmpacar,
    empacados,
    stockBajoCount,
    pedidosSinVenta,
    totalCobrado,
    totalCompras,
    gastosMes,
    gastosMesAnterior,
    totalGastos,
  ] = await Promise.all([
    sumVentas(startOfMonth, startOfNextMonth, ['COMPLETADA', 'PENDIENTE']),
    sumVentas(startOfPrevMonth, startOfMonth, ['COMPLETADA', 'PENDIENTE']),
    sumVentas(startOfDay, new Date(), ['COMPLETADA', 'PENDIENTE']),
    sumVentas(startOfYesterday, startOfDay, ['COMPLETADA', 'PENDIENTE']),
    countEnvios(startOfMonth, startOfNextMonth),
    countEnvios(startOfPrevMonth, startOfMonth),
    countEnvios(startOfDay),
    countEnvios(new Date(0), undefined, ['NO_EMPACADO']),
    countEnvios(new Date(0), undefined, ['EMPACADO']),
    countProductosStockBajo(supabaseAdmin, userId),
    countPedidosSinVenta(supabaseAdmin, userId),
    sumCobrado(new Date(0), undefined, ['COMPLETADA', 'PENDIENTE']),
    sumCompras(new Date(0), undefined, ['COMPLETADA']),
    sumGastos(startOfMonth, startOfNextMonth),
    sumGastos(startOfPrevMonth, startOfMonth),
    sumGastos(new Date(0)),
  ])

  const { cantidad: cobrosPendientes, total: cobrosPendientesTotal } = await pendientesPorCobrar()

  // ========================================
  // HISTÓRICO DIARIO (90 días) — se calcula
  // agregando en memoria; no usa tablas extra.
  // ========================================

  const inicioHistorico = startOfDay.getTime() - (DIAS_HISTORICO - 1) * 24 * 60 * 60 * 1000

  const dias: string[] = []
  for (let i = 0; i < DIAS_HISTORICO; i++) {
    dias.push(new Date(inicioHistorico + i * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString().split('T')[0])
  }

  const [{ data: enviosRango }, { data: ventasRango }] = await Promise.all([
    supabaseAdmin
      .from('envios')
      .select('fecha_registro, metodo, estado')
      .eq('user_id', userId)
      .gte('fecha_registro', new Date(inicioHistorico).toISOString())
      .order('fecha_registro', { ascending: true }),
    supabaseAdmin
      .from('ventas')
      .select('created_at, metodo_pago, total, estado')
      .eq('profile_id', userId)
      .gte('created_at', new Date(inicioHistorico).toISOString())
      .order('created_at', { ascending: true }),
  ])

  // Ventas por día (solo COMPLETADA y PENDIENTE, igual que los KPIs de ventas)
  const ventasDia: Record<string, { total: number; cantidad: number }> = {}
  dias.forEach((d) => {
    ventasDia[d] = { total: 0, cantidad: 0 }
  })
  ventasRango?.forEach((v: any) => {
    if (v.estado !== 'COMPLETADA' && v.estado !== 'PENDIENTE') return
    const bucket = ventasDia[diaLima(v.created_at)]
    if (!bucket) return
    bucket.total += Number(v.total || 0)
    bucket.cantidad += 1
  })

  // Pedidos por día (todos los estados, igual que la tendencia anterior)
  const pedidosDia: Record<string, number> = {}
  dias.forEach((d) => {
    pedidosDia[d] = 0
  })
  enviosRango?.forEach((e: any) => {
    const day = diaLima(e.fecha_registro)
    if (pedidosDia[day] === undefined) return
    pedidosDia[day] += 1
  })

  const historicoVentas = dias.map((fecha) => ({
    fecha,
    total: Math.round(ventasDia[fecha].total * 100) / 100,
    cantidad: ventasDia[fecha].cantidad,
  }))

  const historicoPedidos = dias.map((fecha) => ({
    fecha,
    count: pedidosDia[fecha],
  }))

  // ========================================
  // GRÁFICOS DE LOS ÚLTIMOS 30 DÍAS
  // (se filtran del rango de 90 días ya descargado)
  // ========================================

  const corte30 = dias[dias.length - 30]

  const envios30 = (enviosRango ?? []).filter((e: any) => diaLima(e.fecha_registro) >= corte30)
  const ventas30 = (ventasRango ?? []).filter((v: any) => diaLima(v.created_at) >= corte30)

  const metodoMap: Record<string, number> = {}
  ventas30.forEach((v: any) => {
    const m = v.metodo_pago || 'SIN_METODO'
    metodoMap[m] = (metodoMap[m] || 0) + Number(v.total || 0)
  })
  const ventasPorMetodo = Object.entries(metodoMap)
    .map(([metodo, total]) => ({ metodo, total }))
    .sort((a, b) => b.total - a.total)

  const estadoEnvioMap: Record<string, number> = {}
  envios30.forEach((e: any) => {
    const s = e.estado || 'SIN_ESTADO'
    estadoEnvioMap[s] = (estadoEnvioMap[s] || 0) + 1
  })
  const enviosPorEstado = Object.entries(estadoEnvioMap)
    .map(([estado, count]) => ({ estado, count }))
    .sort((a, b) => b.count - a.count)

  const metodoEnvioMap: Record<string, number> = {}
  envios30.forEach((e: any) => {
    const m = e.metodo || 'SIN_METODO'
    metodoEnvioMap[m] = (metodoEnvioMap[m] || 0) + 1
  })
  const enviosPorMetodo = Object.entries(metodoEnvioMap)
    .map(([metodo, count]) => ({ metodo, count }))
    .sort((a, b) => b.count - a.count)

  const [{ data: stockBajo }, { data: recientesEnvios }, { data: recientesVentas }, { data: recientesGastos }] =
    await Promise.all([
      supabaseAdmin
        .from('productos')
        .select('nombre, stock_actual, stock_minimo, unidad')
        .eq('profile_id', userId)
        .eq('archivado', false)
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
      supabaseAdmin
        .from('gastos')
        .select('id, categoria, concepto, monto, fecha')
        .eq('profile_id', userId)
        .order('fecha', { ascending: false })
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
      totalVentas: totalCobrado,
      totalCompras,
      totalGastos,
      gastosMes,
      saldoDisponible: totalCobrado - totalCompras - totalGastos,
    },
    pendientes: {
      sinEmpacar,
      empacados,
      cobrosPendientes,
      cobrosPendientesTotal,
      stockBajo: stockBajoCount,
      pedidosSinVenta,
    },
    deltas: {
      ventasMes: delta(ventasMes, ventasMesAnterior),
      enviosMes: delta(enviosMes, enviosMesAnterior),
      ventasHoy: delta(ventasHoy, ventasAyer),
      gastosMes: delta(gastosMes, gastosMesAnterior),
    },
    historico: {
      ventas: historicoVentas,
      pedidos: historicoPedidos,
    },
    graficos: {
      ventasPorMetodo,
      enviosPorEstado,
      enviosPorMetodo,
    },
    stockBajo: stockBajo ?? [],
    recientes: {
      envios: recientesEnvios ?? [],
      ventas: recientesVentas ?? [],
      gastos: recientesGastos ?? [],
    },
  })
}

async function countProductosStockBajo(client: typeof supabaseAdmin, userId: string) {
  const { data } = await client
    .from('productos')
    .select('id')
    .eq('profile_id', userId)
    .eq('archivado', false)
    .or('stock_actual.lte.stock_minimo')
  return data?.length ?? 0
}

// Envíos pendientes (sin empacar / en observación) que todavía no tienen una
// venta vinculada. El usuario debe registrar la venta para poder validar el
// contenido del pedido desde el dashboard.
async function countPedidosSinVenta(client: typeof supabaseAdmin, userId: string) {
  const { data: envios } = await client
    .from('envios')
    .select('id')
    .eq('user_id', userId)
    .in('estado', ['NO_EMPACADO', 'EN_OBSERVACION'])
  const enviosIds = (envios ?? []).map((e: any) => e.id)
  if (enviosIds.length === 0) return 0

  const { data: ventas } = await client
    .from('ventas')
    .select('envio_id')
    .eq('profile_id', userId)
    .in('envio_id', enviosIds)
  const vinculados = new Set((ventas ?? []).map((v: any) => v.envio_id))
  return enviosIds.filter((id: string) => !vinculados.has(id)).length
}
