'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Banknote,
  TrendingUp,
  Hourglass,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Boxes,
  PackageOpen,
  CheckCircle2,
  Receipt,
  CalendarDays,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import ToriMascot from '@/components/ToriMascot'
import { CATEGORIA_GASTO_LABEL, CATEGORIA_GASTO_STYLE } from '@/types/inventario'

type DashboardData = {
  kpis: {
    ventasMes: number
    ventasHoy: number
    cobrosPendientes: number
    cobrosPendientesTotal: number
    pedidosPorDespachar: number
    enviosMes: number
    stockBajo: number
    totalVentas: number
    totalCompras: number
    totalGastos: number
    gastosMes: number
    saldoDisponible: number
  }
  pendientes: {
    sinEmpacar: number
    empacados: number
    cobrosPendientes: number
    cobrosPendientesTotal: number
    stockBajo: number
  }
  deltas: {
    ventasMes: number | null
    enviosMes: number | null
    ventasHoy: number | null
    gastosMes: number | null
  }
  historico: {
    ventas: { fecha: string; total: number; cantidad: number }[]
    pedidos: { fecha: string; count: number }[]
  }
  graficos: {
    ventasPorMetodo: { metodo: string; total: number }[]
    enviosPorEstado: { estado: string; count: number }[]
    enviosPorMetodo: { metodo: string; count: number }[]
  }
  stockBajo: { nombre: string; stock_actual: number; stock_minimo: number; unidad: string }[]
  recientes: {
    envios: { id: string; nombre: string; estado: string; metodo: string; fecha_registro: string }[]
    ventas: { id: string; persona_nombre: string; total: number; estado: string; metodo_pago: string; created_at: string }[]
    gastos: { id: string; categoria: string; concepto: string; monto: number; fecha: string }[]
  }
}

type Props = {
  userId: string
  onNavegar: (p: 'envios' | 'productos' | 'ventas' | 'compras') => void
}

const METODO_COLORS = ['#0ea5e9', '#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#94a3b8']
const ESTADO_ENVIO_COLORS: Record<string, string> = {
  NO_EMPACADO: '#f87171',
  EMPACADO: '#fbbf24',
  ENVIADO: '#34d399',
}
const ESTADO_ENVIO_LABEL: Record<string, string> = {
  NO_EMPACADO: 'Sin empacar',
  EMPACADO: 'Empacados',
  ENVIADO: 'Enviados',
}

const ESTADO_BADGE: Record<string, string> = {
  NO_EMPACADO: 'bg-red-50 text-red-600',
  EMPACADO: 'bg-amber-50 text-amber-600',
  ENVIADO: 'bg-emerald-50 text-emerald-600',
  COMPLETADA: 'bg-emerald-50 text-emerald-600',
  PENDIENTE: 'bg-amber-50 text-amber-600',
  ANULADA: 'bg-slate-100 text-slate-400',
}

const METODO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  YAPE_PLIN: 'Yape / Plin',
  TARJETA: 'Tarjeta',
}

const fmtSoles = (n: number) =>
  'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtFecha = (s: string) =>
  new Date(s + (s.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
  })

const fmtFechaLarga = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

function DeltaBadge({ delta, invert = false }: { delta: number | null; invert?: boolean }) {
  if (delta === null) return null
  const up = delta >= 0
  const bueno = invert ? !up : up
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        bueno ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
      }`}
    >
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(delta)}%
    </span>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tint,
  iconColor,
  delta,
  deltaInvert,
}: {
  label: string
  value: string
  sub?: string
  icon: any
  tint: string
  iconColor: string
  delta?: number | null
  deltaInvert?: boolean
}) {
  return (
    <div className={`rounded-2xl p-3.5 sm:p-4 transition-all duration-200 ${tint}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
          <Icon size={13} className={iconColor} />
          {label}
        </span>
        {delta !== undefined && <DeltaBadge delta={delta ?? null} invert={deltaInvert} />}
      </div>
      <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 leading-none tracking-tight">
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </div>
  )
}

function HistoricoTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-bold text-slate-900 capitalize">{fmtFechaLarga(d.fecha)}</p>
      <p className="text-[11px] text-slate-500 mt-1">
        Vendido: <span className="font-bold text-slate-900">{fmtSoles(d.total)}</span>
      </p>
      <p className="text-[11px] text-slate-500">
        Pedidos: <span className="font-bold text-slate-900">{d.cantidad}</span>
      </p>
    </div>
  )
}

const prevDe = (valor: number, delta: number | null): number | null => {
  if (delta === null) return null
  if (delta <= -99) return valor * 5
  return valor / (1 + delta / 100)
}

export default function PanelResumen({ userId, onNavegar }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<7 | 30 | 90>(30)
  const [metrica, setMetrica] = useState<'monto' | 'pedidos'>('monto')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard?user_id=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [userId])

  const serie = useMemo(() => {
    if (!data?.historico) return []
    const ventas = data.historico.ventas.slice(-periodo)
    const pedidosMap = new Map(data.historico.pedidos.map((p) => [p.fecha, p.count]))
    return ventas.map((v) => ({
      fecha: v.fecha,
      valor: metrica === 'monto' ? v.total : pedidosMap.get(v.fecha) ?? 0,
      total: v.total,
      cantidad: pedidosMap.get(v.fecha) ?? 0,
    }))
  }, [data, periodo, metrica])

  const stats = useMemo(() => {
    const totalValor = serie.reduce((a, d) => a + d.valor, 0)
    const diasActivos = serie.filter((d) => d.cantidad > 0).length
    const mejor = serie.reduce<(typeof serie)[number] | null>(
      (best, d) => (!best || d.valor > best.valor ? d : best),
      null
    )
    const promedio = serie.length ? totalValor / serie.length : 0
    return { totalValor, promedio, mejor, diasActivos }
  }, [serie])

  const fmtValor = (n: number) =>
    metrica === 'monto' ? fmtSoles(n) : `${Math.round(n * 10) / 10}`

  const dineroKpis = data
    ? [
        {
          label: 'Ventas del mes',
          value: fmtSoles(data.kpis.ventasMes),
          icon: Banknote,
          tint: 'bg-sky-50',
          iconColor: 'text-sky-600',
          delta: data.deltas.ventasMes,
        },
        {
          label: 'Ventas hoy',
          value: fmtSoles(data.kpis.ventasHoy),
          icon: TrendingUp,
          tint: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
          delta: data.deltas.ventasHoy,
        },
        {
          label: 'Gastos del mes',
          value: fmtSoles(data.kpis.gastosMes),
          icon: Receipt,
          tint: 'bg-rose-50',
          iconColor: 'text-rose-600',
          delta: data.deltas.gastosMes,
          deltaInvert: true,
        },
      ]
    : []

  const operacionKpis = data
    ? [
        {
          label: 'Por despachar',
          value: String(data.kpis.pedidosPorDespachar),
          sub: `${data.kpis.pedidosPorDespachar - data.pendientes.sinEmpacar} empacados`,
          icon: Package,
          tint: 'bg-amber-50',
          iconColor: 'text-amber-600',
        },
        {
          label: 'Envíos del mes',
          value: String(data.kpis.enviosMes),
          icon: PackageOpen,
          tint: 'bg-purple-50',
          iconColor: 'text-purple-600',
          delta: data.deltas.enviosMes,
        },
        {
          label: 'Cobros pendientes',
          value: String(data.kpis.cobrosPendientes),
          sub: fmtSoles(data.kpis.cobrosPendientesTotal),
          icon: Hourglass,
          tint: 'bg-indigo-50',
          iconColor: 'text-indigo-600',
        },
        {
          label: 'Stock bajo',
          value: String(data.kpis.stockBajo),
          sub: 'por reabastecer',
          icon: AlertTriangle,
          tint: data.kpis.stockBajo > 0 ? 'bg-red-50' : 'bg-slate-100',
          iconColor: data.kpis.stockBajo > 0 ? 'text-red-500' : 'text-slate-400',
        },
      ]
    : []

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-32 animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white border border-slate-100" />
        <div className="h-80 animate-pulse rounded-2xl bg-white border border-slate-100" />
      </div>
    )
  }

  const sinDatos =
    !data ||
    (data.kpis.ventasMes === 0 &&
      data.kpis.enviosMes === 0 &&
      data.kpis.cobrosPendientes === 0 &&
      data.kpis.pedidosPorDespachar === 0 &&
      data.kpis.stockBajo === 0)

  const pendientes = data?.pendientes
  const totalDespacho = (pendientes?.sinEmpacar ?? 0) + (pendientes?.empacados ?? 0)
  const pctSinEmpacar = totalDespacho > 0 ? ((pendientes?.sinEmpacar ?? 0) / totalDespacho) * 100 : 0
  const pctEmpacados = totalDespacho > 0 ? ((pendientes?.empacados ?? 0) / totalDespacho) * 100 : 0

  const areaColor = metrica === 'monto' ? '#0284c7' : '#6366f1'

  const metodosPago = data?.graficos.ventasPorMetodo.filter((m) => m.total > 0) ?? []
  const totalMetodosPago = metodosPago.reduce((a, m) => a + m.total, 0)

  const estadosData = (data?.graficos.enviosPorEstado ?? [])
    .filter((e) => e.count > 0)
    .sort(
      (a, b) =>
        ['NO_EMPACADO', 'EMPACADO', 'ENVIADO'].indexOf(a.estado) -
        ['NO_EMPACADO', 'EMPACADO', 'ENVIADO'].indexOf(b.estado)
    )
  const totalEstados = estadosData.reduce((a, e) => a + e.count, 0)

  const canales = (data?.graficos.enviosPorMetodo ?? []).filter((m) => m.count > 0)
  const maxCanal = Math.max(...canales.map((c) => c.count), 1)

  const comparativa = data
    ? [
        {
          label: 'Ventas',
          icon: Banknote,
          valor: data.kpis.ventasMes,
          fmt: (n: number) => fmtSoles(n),
          delta: data.deltas.ventasMes,
          color: 'bg-sky-500',
        },
        {
          label: 'Envíos',
          icon: PackageOpen,
          valor: data.kpis.enviosMes,
          fmt: (n: number) => String(Math.round(n)),
          delta: data.deltas.enviosMes,
          color: 'bg-purple-500',
        },
        {
          label: 'Gastos',
          icon: Receipt,
          valor: data.kpis.gastosMes,
          fmt: (n: number) => fmtSoles(n),
          delta: data.deltas.gastosMes,
          invert: true,
          color: 'bg-rose-500',
        },
      ]
    : []

  return (
    <div className="space-y-3">
      {/* ============ SALDO DISPONIBLE ============ */}
      {data && (
        <div
          data-tour="resumen-saldo"
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${
            data.kpis.saldoDisponible >= 0
              ? 'from-sky-600 via-sky-600 to-indigo-700'
              : 'from-red-500 via-red-500 to-rose-600'
          } p-5 sm:p-6 text-white shadow-sm`}
        >
          <div className="absolute -right-12 -top-20 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -right-24 -bottom-10 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Saldo disponible
              </p>
              <p className="text-4xl sm:text-5xl font-extrabold mt-1.5 leading-none tracking-tight">
                {fmtSoles(data.kpis.saldoDisponible)}
              </p>
              <p className="text-[11px] text-white/60 mt-2">Ventas totales − Compras − Gastos</p>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:pb-1">
              {[
                { l: 'Ventas', v: data.kpis.totalVentas },
                { l: 'Compras', v: data.kpis.totalCompras },
                { l: 'Gastos', v: data.kpis.totalGastos },
              ].map((t) => (
                <div key={t.l}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                    {t.l}
                  </p>
                  <p className="text-base sm:text-lg font-extrabold mt-0.5 whitespace-nowrap">
                    {fmtSoles(t.v)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ KPIs ============ */}
      <div data-tour="resumen-kpis" className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {dineroKpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
          {operacionKpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </div>

      {sinDatos ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <ToriMascot variant="empty" size={56} animate />
          <p className="text-sm text-slate-400">
            Aún no hay datos. Crea tu primer pedido o registra una venta para ver tu resumen.
          </p>
        </div>
      ) : (
        <>
          {/* ============ PENDIENTE DE ACCIÓN ============ */}
          <div
            data-tour="resumen-pendientes"
            className="rounded-2xl border border-slate-100 bg-white p-3 sm:p-4"
          >
            <div className="px-1.5 pt-1">
              <h3 className="text-sm font-bold text-slate-900">Pendiente de acción</h3>
              <p className="text-[11px] text-slate-400">Lo que necesita tu atención hoy.</p>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-1">
              <button
                onClick={() => onNavegar('envios')}
                className="group flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-red-50/60"
              >
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Boxes size={16} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-extrabold text-slate-900 leading-none">
                    {pendientes?.sinEmpacar ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">sin empacar</p>
                  <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-400 transition-all duration-500"
                      style={{ width: `${pctSinEmpacar}%` }}
                    />
                  </div>
                </div>
                <ChevronRight
                  size={15}
                  className="text-slate-300 group-hover:text-red-500 transition-colors"
                />
              </button>

              <button
                onClick={() => onNavegar('envios')}
                className="group flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-amber-50/60"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Package size={16} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-extrabold text-slate-900 leading-none">
                    {pendientes?.empacados ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">por enviar</p>
                  <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${pctEmpacados}%` }}
                    />
                  </div>
                </div>
                <ChevronRight
                  size={15}
                  className="text-slate-300 group-hover:text-amber-500 transition-colors"
                />
              </button>

              <button
                onClick={() => onNavegar('ventas')}
                className="group flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-indigo-50/60"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <Hourglass size={16} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-extrabold text-slate-900 leading-none">
                    {pendientes?.cobrosPendientes ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {fmtSoles(pendientes?.cobrosPendientesTotal ?? 0)} por cobrar
                  </p>
                </div>
                <ChevronRight
                  size={15}
                  className="text-slate-300 group-hover:text-indigo-500 transition-colors"
                />
              </button>

              <button
                onClick={() => onNavegar('productos')}
                className="group flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-orange-50/60"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-extrabold text-slate-900 leading-none">
                    {pendientes?.stockBajo ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">productos bajo stock</p>
                </div>
                <ChevronRight
                  size={15}
                  className="text-slate-300 group-hover:text-orange-500 transition-colors"
                />
              </button>
            </div>
          </div>

          {/* ============ HISTÓRICO DE VENTAS POR DÍA ============ */}
          <div
            data-tour="resumen-historico"
            className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays size={14} className="text-sky-600" />
                  Histórico de ventas por día
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Evolución diaria de tu negocio.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                  {([7, 30, 90] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriodo(p)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        periodo === p
                          ? 'bg-white shadow text-slate-900'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {p}d
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                  <button
                    onClick={() => setMetrica('monto')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      metrica === 'monto'
                        ? 'bg-white shadow text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Ventas (S/)
                  </button>
                  <button
                    onClick={() => setMetrica('pedidos')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      metrica === 'pedidos'
                        ? 'bg-white shadow text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Pedidos
                  </button>
                </div>
              </div>
            </div>

            {/* Chips de estadísticas */}
            <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Total del período
                </p>
                <p className="mt-1 text-base font-extrabold text-slate-900 leading-none">
                  {fmtValor(stats.totalValor)}
                  {metrica === 'pedidos' && (
                    <span className="text-[10px] font-semibold text-slate-400"> pedidos</span>
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Promedio diario
                </p>
                <p className="mt-1 text-base font-extrabold text-slate-900 leading-none">
                  {fmtValor(stats.promedio)}
                  {metrica === 'pedidos' && (
                    <span className="text-[10px] font-semibold text-slate-400"> /día</span>
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Mejor día
                </p>
                <p className="mt-1 text-base font-extrabold text-slate-900 leading-none">
                  {stats.mejor ? fmtValor(stats.mejor.valor) : '—'}
                </p>
                {stats.mejor && (
                  <p className="text-[9px] text-slate-400 mt-0.5 capitalize">
                    {fmtFechaLarga(stats.mejor.fecha)}
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Días con venta
                </p>
                <p className="mt-1 text-base font-extrabold text-slate-900 leading-none">
                  {stats.diasActivos}
                  <span className="text-[10px] font-semibold text-slate-400"> de {serie.length}</span>
                </p>
              </div>
            </div>

            <div className="h-56 mt-3 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${metrica}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={areaColor} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={areaColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 10, fill: '#cbd5e1' }}
                    tickFormatter={(v: string) => fmtFecha(v)}
                    minTickGap={36}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <Tooltip
                    content={<HistoricoTooltip />}
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke={areaColor}
                    strokeWidth={3}
                    fill={`url(#grad-${metrica})`}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff', fill: areaColor }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ============ DESGLOSE DE OPERACIONES ============ */}
          <div data-tour="resumen-graficos" className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4">
              <h3 className="text-sm font-bold text-slate-900">Desglose de operaciones</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Últimos 30 días
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-slate-100">
              {/* Métodos de pago */}
              <section className="bg-white p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Métodos de pago
                </h4>
                {metodosPago.length === 0 ? (
                  <p className="text-xs text-slate-400 mt-6 text-center">Sin ventas en el período.</p>
                ) : (
                  <>
                    <div className="relative h-32 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metodosPago}
                            dataKey="total"
                            nameKey="metodo"
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={58}
                            paddingAngle={3}
                            cornerRadius={5}
                            strokeWidth={0}
                          >
                            {metodosPago.map((entry, i) => (
                              <Cell
                                key={entry.metodo}
                                fill={METODO_COLORS[i % METODO_COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Total
                        </p>
                        <p className="text-xs font-extrabold text-slate-900 whitespace-nowrap">
                          {fmtSoles(totalMetodosPago)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {metodosPago.map((m, i) => (
                        <div key={m.metodo} className="flex items-center gap-2 text-[11px]">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: METODO_COLORS[i % METODO_COLORS.length] }}
                          />
                          <span className="flex-1 text-slate-600 truncate">
                            {METODO_PAGO_LABEL[m.metodo] || m.metodo}
                          </span>
                          <span className="font-bold text-slate-900 whitespace-nowrap">
                            {fmtSoles(m.total)}
                          </span>
                          <span className="text-slate-400 w-8 text-right shrink-0">
                            {Math.round((m.total / totalMetodosPago) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* Estados de envío */}
              <section className="bg-white p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Estados de envío
                </h4>
                {totalEstados === 0 ? (
                  <p className="text-xs text-slate-400 mt-6 text-center">Sin envíos en el período.</p>
                ) : (
                  <>
                    <div className="mt-4 flex h-3.5 rounded-full overflow-hidden bg-slate-100">
                      {estadosData.map((e) => (
                        <div
                          key={e.estado}
                          className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                          style={{
                            width: `${(e.count / totalEstados) * 100}%`,
                            background: ESTADO_ENVIO_COLORS[e.estado] || '#94a3b8',
                          }}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400">
                      {totalEstados} envíos en total
                    </p>
                    <div className="mt-3 space-y-2">
                      {estadosData.map((e) => (
                        <div key={e.estado} className="flex items-center gap-2 text-[11px]">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: ESTADO_ENVIO_COLORS[e.estado] || '#94a3b8' }}
                          />
                          <span className="flex-1 text-slate-600">
                            {ESTADO_ENVIO_LABEL[e.estado] || e.estado}
                          </span>
                          <span className="font-bold text-slate-900">{e.count}</span>
                          <span className="text-slate-400 w-8 text-right">
                            {Math.round((e.count / totalEstados) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* Canales de envío */}
              <section className="bg-white p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Canales de envío
                </h4>
                {canales.length === 0 ? (
                  <p className="text-xs text-slate-400 mt-6 text-center">Sin envíos en el período.</p>
                ) : (
                  <div className="mt-4 space-y-3.5">
                    {canales.map((c, i) => (
                      <div key={c.metodo}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-semibold truncate">{c.metodo}</span>
                          <span className="font-extrabold text-slate-900">{c.count}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(c.count / maxCanal) * 100}%`,
                              background: METODO_COLORS[i % METODO_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Mes vs anterior */}
              <section className="bg-white p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Mes vs anterior
                </h4>
                <div className="mt-4 space-y-4">
                  {comparativa.map((row) => {
                    const prev = prevDe(row.valor, row.delta)
                    const max = Math.max(row.valor, prev ?? 0, 1)
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                            <row.icon size={12} className="text-slate-400" />
                            {row.label}
                          </span>
                          <DeltaBadge delta={row.delta} invert={row.invert} />
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {row.fmt(row.valor)}
                        </p>
                        <div className="mt-1.5 space-y-1">
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                              style={{ width: `${(row.valor / max) * 100}%` }}
                            />
                          </div>
                          {prev !== null && (
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-slate-300 transition-all duration-500"
                                style={{ width: `${(prev / max) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 flex items-center gap-3 text-[9px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-1.5 rounded-full bg-slate-400" /> Este mes
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-1.5 rounded-full bg-slate-200" /> Anterior
                  </span>
                </div>
              </section>
            </div>
          </div>

          {/* ============ RECIENTES ============ */}
          <div data-tour="resumen-recientes" className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Últimos pedidos</h3>
              {data.recientes.envios.length === 0 ? (
                <p className="text-xs text-slate-400 mt-3">Aún no hay pedidos.</p>
              ) : (
                <div className="mt-1 divide-y divide-slate-50">
                  {data.recientes.envios.map((e) => (
                    <div key={e.id} className="py-2.5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={13} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{e.nombre}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {e.metodo} · {fmtFecha(e.fecha_registro)}
                        </p>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                          ESTADO_BADGE[e.estado] || 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {ESTADO_ENVIO_LABEL[e.estado] || e.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Últimas ventas</h3>
              {data.recientes.ventas.length === 0 ? (
                <p className="text-xs text-slate-400 mt-3">Aún no hay ventas.</p>
              ) : (
                <div className="mt-1 divide-y divide-slate-50">
                  {data.recientes.ventas.map((v) => (
                    <div key={v.id} className="py-2.5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                        <Banknote size={13} className="text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {v.persona_nombre}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {METODO_PAGO_LABEL[v.metodo_pago] || v.metodo_pago} ·{' '}
                          {fmtFecha(v.created_at)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-900">{fmtSoles(v.total)}</p>
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                            ESTADO_BADGE[v.estado] || 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {v.estado === 'PENDIENTE' ? 'Por cobrar' : v.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Últimos gastos</h3>
              {data.recientes.gastos.length === 0 ? (
                <p className="text-xs text-slate-400 mt-3">Aún no hay gastos.</p>
              ) : (
                <div className="mt-1 divide-y divide-slate-50">
                  {data.recientes.gastos.map((g) => (
                    <div key={g.id} className="py-2.5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                        <Receipt size={13} className="text-rose-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{g.concepto}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {CATEGORIA_GASTO_LABEL[g.categoria] || g.categoria} · {fmtFecha(g.fecha)}
                        </p>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                          CATEGORIA_GASTO_STYLE[g.categoria] || 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {fmtSoles(g.monto)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
