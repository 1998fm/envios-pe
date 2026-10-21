import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

const DIAS_HISTORICO = 90

// ============================================================
// PANEL DE RESUMEN
//
// Todo se resuelve con CINCO consultas (una por tabla) en vez de una por
// métrica. Antes se hacían ~24 viajes a la base (una por cada suma y
// conteo), y a ~150 ms por viaje eso son 3-4 segundos solo en esperas.
//
// La clave: cada tabla se trae una vez con las columnas justas y todos los
// indicadores se calculan en memoria. Los datos por negocio son cientos de
// filas, no millones, así que traer la tabla del negocio es más rápido que
// encadenar 20 conteos.
// ============================================================

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

  // ========================================
  // LAS CINCO CONSULTAS
  // ========================================

  const [ventasRes, enviosRes, comprasRes, gastosRes, stockBajoCount] = await Promise.all([
    // Todas las ventas del negocio: de aquí salen los KPIs de dinero, la
    // serie histórica, los gráficos y los saldos por cobrar.
    supabaseAdmin
      .from('ventas')
      .select('created_at, total, monto_pagado, estado, metodo_pago, envio_id')
      .eq('profile_id', userId),
    // Todos los envíos: de aquí salen el histórico de pedidos, los gráficos
    // por estado/método y los contadores de despachar.
    supabaseAdmin
      .from('envios')
      .select('id, estado, fecha_registro, metodo')
      .eq('user_id', userId),
    // Compras: total histórico y comparación con el mes anterior.
    supabaseAdmin
      .from('compras')
      .select('created_at, total, estado')
      .eq('profile_id', userId),
    // Gastos: idem, pero por fecha contable (columna date).
    supabaseAdmin
      .from('gastos')
      .select('fecha, monto')
      .eq('profile_id', userId),
    // Productos con stock en o por debajo del mínimo (solo el conteo).
    countProductosStockBajo(supabaseAdmin, userId),
  ])

  const ventas = ventasRes.data ?? []
  const envios = enviosRes.data ?? []
  const compras = comprasRes.data ?? []
  const gastos = gastosRes.data ?? []

  // ========================================
  // DINERO DE VENTAS
  // ========================================

  const esVentaVigente = (e: string) => e === 'COMPLETADA' || e === 'PENDIENTE'

  function sumaVentas(desde: Date, hasta?: Date) {
    let acc = 0
    for (const v of ventas as any[]) {
      if (!esVentaVigente(v.estado)) continue
      const t = new Date(v.created_at).getTime()
      if (t < desde.getTime()) continue
      if (hasta && t >= hasta.getTime()) continue
      acc += Number(v.total || 0)
    }
    return acc
  }

  const ventasMes = sumaVentas(startOfMonth, startOfNextMonth)
  const ventasMesAnterior = sumaVentas(startOfPrevMonth, startOfMonth)
  const ventasHoy = sumaVentas(startOfDay, now)
  const ventasAyer = sumaVentas(startOfYesterday, startOfDay)

  // Dinero realmente cobrado: una venta PENDIENTE con abono parcial aporta
  // lo ya pagado, no el total (así el saldo disponible refleja la caja real).
  let totalCobrado = 0
  let cobrosPendientes = 0
  let cobrosPendientesTotal = 0
  for (const v of ventas as any[]) {
    if (!esVentaVigente(v.estado)) continue
    totalCobrado += Number(v.monto_pagado ?? 0)
    if (v.estado === 'PENDIENTE') {
      const saldo = Number(v.total ?? 0) - Number(v.monto_pagado ?? 0)
      if (saldo > 0) {
        cobrosPendientes += 1
        cobrosPendientesTotal += saldo
      }
    }
  }
  cobrosPendientesTotal = Math.round(cobrosPendientesTotal * 100) / 100

  // ========================================
  // ENVÍOS
  // ========================================

  let sinEmpacar = 0
  let empacados = 0
  let enviosMes = 0
  let enviosMesAnterior = 0
  const enviosPendientesIds = new Set<string>()
  for (const e of envios as any[]) {
    if (e.estado === 'NO_EMPACADO') sinEmpacar += 1
    if (e.estado === 'EMPACADO') empacados += 1
    if (e.estado === 'NO_EMPACADO' || e.estado === 'EN_OBSERVACION') {
      enviosPendientesIds.add(e.id)
    }
    const t = new Date(e.fecha_registro).getTime()
    if (t >= startOfMonth.getTime() && t < startOfNextMonth.getTime()) enviosMes += 1
    if (t >= startOfPrevMonth.getTime() && t < startOfMonth.getTime()) enviosMesAnterior += 1
  }

  // Envíos pendientes (sin empacar / en observación) que todavía no tienen una
  // venta vinculada. El usuario debe registrar la venta para poder validar el
  // contenido del pedido desde el dashboard.
  let pedidosSinVenta = 0
  if (enviosPendientesIds.size > 0) {
    const vinculados = new Set<string>()
    for (const v of ventas as any[]) {
      if (v.envio_id && enviosPendientesIds.has(v.envio_id)) vinculados.add(v.envio_id)
    }
    pedidosSinVenta = enviosPendientesIds.size - vinculados.size
  }

  // ========================================
  // COMPRAS Y GASTOS
  // ========================================

  const sumaCompras = (desde: Date, hasta?: Date) => {
    let acc = 0
    for (const c of compras as any[]) {
      if (c.estado !== 'COMPLETADA') continue
      const t = new Date(c.created_at).getTime()
      if (t < desde.getTime()) continue
      if (hasta && t >= hasta.getTime()) continue
      acc += Number(c.total || 0)
    }
    return acc
  }

  const totalCompras = sumaCompras(new Date(0))

  // Los gastos se filtran por `fecha` (columna date, no timestamp): se
  // compara con el día, no con la hora.
  const diaGasto = (g: any) => String(g.fecha || '').slice(0, 10)
  const hoyStr = hoyLima
  const mesStr = hoyLima.slice(0, 8)
  const mesAntStr = (() => {
    const d = new Date(startOfPrevMonth)
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }).slice(0, 7)
  })()

  let totalGastos = 0
  let gastosMes = 0
  let gastosMesAnterior = 0
  for (const g of gastos as any[]) {
    const monto = Number(g.monto || 0)
    totalGastos += monto
    const dia = diaGasto(g)
    if (dia.slice(0, 7) === mesStr) gastosMes += monto
    if (dia.slice(0, 7) === mesAntStr) gastosMesAnterior += monto
  }

  // ========================================
  // HISTÓRICO DIARIO (90 días) Y GRÁFICOS (30 días)
  // ========================================

  const inicioHistorico = startOfDay.getTime() - (DIAS_HISTORICO - 1) * 24 * 60 * 60 * 1000

  const dias: string[] = []
  for (let i = 0; i < DIAS_HISTORICO; i++) {
    dias.push(new Date(inicioHistorico + i * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString().split('T')[0])
  }

  const ventasDia: Record<string, { total: number; cantidad: number }> = {}
  const pedidosDia: Record<string, number> = {}
  dias.forEach((d) => {
    ventasDia[d] = { total: 0, cantidad: 0 }
    pedidosDia[d] = 0
  })

  const corte30 = dias[dias.length - 30]

  const ventasPorMetodo: Record<string, number> = {}
  const enviosPorEstado: Record<string, number> = {}
  const enviosPorMetodo: Record<string, number> = {}

  for (const v of ventas as any[]) {
    const t = new Date(v.created_at).getTime()
    if (t < inicioHistorico) continue
    const bucket = ventasDia[diaLima(v.created_at)]
    if (!bucket) continue
    if (esVentaVigente(v.estado)) {
      bucket.total += Number(v.total || 0)
      bucket.cantidad += 1
    }
    if (diaLima(v.created_at) >= corte30) {
      const m = v.metodo_pago || 'SIN_METODO'
      ventasPorMetodo[m] = (ventasPorMetodo[m] || 0) + Number(v.total || 0)
    }
  }

  for (const e of envios as any[]) {
    const t = new Date(e.fecha_registro).getTime()
    if (t < inicioHistorico) continue
    const day = diaLima(e.fecha_registro)
    if (pedidosDia[day] !== undefined) pedidosDia[day] += 1
    if (day >= corte30) {
      const s = e.estado || 'SIN_ESTADO'
      enviosPorEstado[s] = (enviosPorEstado[s] || 0) + 1
      const m = e.metodo || 'SIN_METODO'
      enviosPorMetodo[m] = (enviosPorMetodo[m] || 0) + 1
    }
  }

  const historicoVentas = dias.map((fecha) => ({
    fecha,
    total: Math.round(ventasDia[fecha].total * 100) / 100,
    cantidad: ventasDia[fecha].cantidad,
  }))

  const historicoPedidos = dias.map((fecha) => ({
    fecha,
    count: pedidosDia[fecha],
  }))

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
      ventasPorMetodo: Object.entries(ventasPorMetodo)
        .map(([metodo, total]) => ({ metodo, total }))
        .sort((a, b) => b.total - a.total),
      enviosPorEstado: Object.entries(enviosPorEstado)
        .map(([estado, count]) => ({ estado, count }))
        .sort((a, b) => b.count - a.count),
      enviosPorMetodo: Object.entries(enviosPorMetodo)
        .map(([metodo, count]) => ({ metodo, count }))
        .sort((a, b) => b.count - a.count),
    },
  })
}

async function countProductosStockBajo(client: typeof supabaseAdmin, userId: string) {
  const { count } = await client
    .from('productos')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', userId)
    .eq('archivado', false)
    .or('stock_actual.lte.stock_minimo')
  return count ?? 0
}
