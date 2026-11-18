import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'

const DIAS_HISTORICO = 90

// Los registros se agrupan en la base antes de viajar a la aplicación.
// Se conserva todo el histórico para caja y pendientes; las gráficas usan 90 días.

export async function GET() {
  const auth = await requirePlus('ver_resumen')
  if (!auth.ok) return auth.response
  const userId = auth.ownerId

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

  const { data: agrupados, error } = await supabaseAdmin.rpc('tori_datos_dashboard', { p_owner: userId, p_ahora: now.toISOString() })
  if (error) return NextResponse.json({ error: 'No se pudo calcular el resumen del negocio.' }, { status: 503 })
  const { ventas, envios, compras, gastos, stockBajo: stockBajoCount, pedidosSinVenta } = agrupados

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

  // Ganancia = total de la venta - costo de sus ítems (foto del costo al vender).
  function gananciaVentas(desde: Date, hasta?: Date) {
    let acc = 0
    for (const v of ventas as any[]) {
      if (!esVentaVigente(v.estado)) continue
      const t = new Date(v.created_at).getTime()
      if (t < desde.getTime()) continue
      if (hasta && t >= hasta.getTime()) continue
      const costo = ((v.items ?? []) as any[]).reduce(
        (a, it) => a + Number(it.cantidad || 0) * Number(it.costo_unitario || 0),
        0
      )
      acc += Number(v.total || 0) - costo
    }
    return Math.round(acc * 100) / 100
  }

  function cantidadVentas(desde: Date, hasta?: Date) {
    let n = 0
    for (const v of ventas as any[]) {
      if (!esVentaVigente(v.estado)) continue
      const t = new Date(v.created_at).getTime()
      if (t >= desde.getTime() && (!hasta || t < hasta.getTime())) n += Number(v.cantidad || 1)
    }
    return n
  }

  const ventasMes = sumaVentas(startOfMonth, startOfNextMonth)
  const gananciaMes = gananciaVentas(startOfMonth, startOfNextMonth)
  const gananciaHoy = gananciaVentas(startOfDay, now)
  const ventasHoyCantidad = cantidadVentas(startOfDay, now)
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
      cobrosPendientes += Number(v.cobros_pendientes || 0)
      cobrosPendientesTotal += Number(v.saldo_pendiente || 0)
    }
  }
  cobrosPendientesTotal = Math.round(cobrosPendientesTotal * 100) / 100

  // ========================================
  // ENVÍOS
  // ========================================

  let sinEmpacar = 0
  let empacados = 0
  // Lo que toca despachar HOY (día calendario Perú) y lo que ya venció.
  let porEnviarHoy = 0
  let enviadosHoy = 0
  let atrasados = 0
  let pedidosNuevosHoy = 0
  let enviosMes = 0
  let enviosMesAnterior = 0
  for (const e of envios as any[]) {
    const diaProg = e.fecha_programada ? diaLima(e.fecha_programada) : null
    const pendiente = e.estado === 'NO_EMPACADO' || e.estado === 'EMPACADO' || e.estado === 'EN_OBSERVACION'
    if (diaProg === hoyLima) {
      if (pendiente) porEnviarHoy += Number(e.cantidad || 1)
      if (e.estado === 'ENVIADO') enviadosHoy += Number(e.cantidad || 1)
    } else if (diaProg && diaProg < hoyLima && pendiente) {
      atrasados += Number(e.cantidad || 1)
    }
    if (e.fecha_registro && diaLima(e.fecha_registro) === hoyLima) pedidosNuevosHoy += Number(e.cantidad || 1)
    if (e.estado === 'NO_EMPACADO') sinEmpacar += Number(e.cantidad || 1)
    if (e.estado === 'EMPACADO') empacados += Number(e.cantidad || 1)

    const t = new Date(e.fecha_registro).getTime()
    if (t >= startOfMonth.getTime() && t < startOfNextMonth.getTime()) enviosMes += Number(e.cantidad || 1)
    if (t >= startOfPrevMonth.getTime() && t < startOfMonth.getTime()) enviosMesAnterior += Number(e.cantidad || 1)
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
  const mesStr = hoyLima.slice(0, 7)
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
      bucket.cantidad += Number(v.cantidad || 1)
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
    if (pedidosDia[day] !== undefined) pedidosDia[day] += Number(e.cantidad || 1)
    if (day >= corte30) {
      const s = e.estado || 'SIN_ESTADO'
      enviosPorEstado[s] = (enviosPorEstado[s] || 0) + Number(e.cantidad || 1)
      const m = e.metodo || 'SIN_METODO'
      enviosPorMetodo[m] = (enviosPorMetodo[m] || 0) + Number(e.cantidad || 1)
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

  // Las cifras de dinero salen del servidor solo si el rol las permite: ocultarlas
  // únicamente en pantalla no sirve, quien abre la pestaña Red las vería igual.
  const verDinero = auth.permisos.ver_kpis_venta
  const verGanancia = auth.permisos.ver_ganancia_venta
  const verEgresos = verDinero && auth.permisos.ver_gastos && auth.permisos.ver_compras
  const d = (permitido: boolean, n: number) => (permitido ? n : 0)

  return NextResponse.json({
    acceso: { dinero: verDinero, ganancia: verGanancia, egresos: verEgresos },
    hoy: {
      fecha: hoyLima,
      ventas: d(verDinero, ventasHoy),
      ventasCantidad: ventasHoyCantidad,
      ganancia: d(verGanancia, gananciaHoy),
      pedidosNuevos: pedidosNuevosHoy,
      porEnviar: porEnviarHoy,
      enviados: enviadosHoy,
      atrasados,
    },
    kpis: {
      ventasMes: d(verDinero, ventasMes),
      gananciaMes: d(verGanancia, gananciaMes),
      ventasHoy: d(verDinero, ventasHoy),
      cobrosPendientes,
      cobrosPendientesTotal: d(verDinero, cobrosPendientesTotal),
      pedidosPorDespachar: sinEmpacar + empacados,
      enviosMes,
      stockBajo: stockBajoCount,
      totalVentas: d(verEgresos, totalCobrado),
      totalCompras: d(verEgresos, totalCompras),
      totalGastos: d(verEgresos, totalGastos),
      gastosMes: d(verEgresos, gastosMes),
      saldoDisponible: d(verEgresos, totalCobrado - totalCompras - totalGastos),
    },
    pendientes: {
      sinEmpacar,
      empacados,
      cobrosPendientes,
      cobrosPendientesTotal: d(verDinero, cobrosPendientesTotal),
      stockBajo: stockBajoCount,
      pedidosSinVenta,
    },
    deltas: {
      ventasMes: verDinero ? delta(ventasMes, ventasMesAnterior) : null,
      enviosMes: delta(enviosMes, enviosMesAnterior),
      ventasHoy: verDinero ? delta(ventasHoy, ventasAyer) : null,
      gastosMes: verEgresos ? delta(gastosMes, gastosMesAnterior) : null,
    },
    historico: {
      ventas: verDinero ? historicoVentas : historicoVentas.map((h) => ({ ...h, total: 0 })),
      pedidos: historicoPedidos,
    },
    graficos: {
      ventasPorMetodo: Object.entries(ventasPorMetodo)
        .map(([metodo, total]) => ({ metodo, total: d(verDinero, total) }))
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
