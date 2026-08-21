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
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
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

const METODO_COLORS = ['#0284c7', '#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#94a3b8']
const ESTADO_ENVIO_COLORS: Record<string, string> = {
  NO_EMPACADO: '#ef4444',
  EMPACADO: '#f59e0b',
  ENVIADO: '#0284c7',
}

const ESTADO_BADGE: Record<string, string> = {
  NO_EMPACADO: 'bg-red-100 text-red-700',
  EMPACADO: 'bg-amber-100 text-amber-700',
  ENVIADO: 'bg-emerald-100 text-emerald-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  PENDIENTE: 'bg-amber-100 text-amber-700',
  ANULADA: 'bg-slate-100 text-slate-500',
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

const fmtCompacto = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v)

function DeltaBadge({ delta, invert = false }: { delta: number | null; invert?: boolean }) {
  if (delta === null) return null
  const up = delta >= 0
  const bueno = invert ? !up : up
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        bueno ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(delta)}%
    </span>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  hoverClass,
  delta,
  deltaInvert,
}: {
  label: string
  value: string
  sub?: string
  icon: any
  iconClass: string
  hoverClass: string
  delta?: number | null
  deltaInvert?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-200 hover:shadow-md ${hoverClass}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}>
          <Icon size={18} />
        </div>
        {delta !== undefined && <DeltaBadge delta={delta ?? null} invert={deltaInvert} />}
      </div>
      <p className="mt-3 text-xl font-extrabold text-slate-900 leading-none">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
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

function SkeletonCard() {
  return <div className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white" />
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
          iconClass: 'bg-sky-100 text-sky-600',
          hoverClass: 'hover:border-sky-200',
          delta: data.deltas.ventasMes,
        },
        {
          label: 'Ventas hoy',
          value: fmtSoles(data.kpis.ventasHoy),
          icon: TrendingUp,
          iconClass: 'bg-emerald-100 text-emerald-600',
          hoverClass: 'hover:border-emerald-200',
          delta: data.deltas.ventasHoy,
        },
        {
          label: 'Gastos del mes',
          value: fmtSoles(data.kpis.gastosMes),
          icon: Receipt,
          iconClass: 'bg-rose-100 text-rose-600',
          hoverClass: 'hover:border-rose-200',
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
          iconClass: 'bg-amber-100 text-amber-600',
          hoverClass: 'hover:border-amber-200',
        },
        {
          label: 'Envíos del mes',
          value: String(data.kpis.enviosMes),
          icon: PackageOpen,
          iconClass: 'bg-purple-100 text-purple-600',
          hoverClass: 'hover:border-purple-200',
          delta: data.deltas.enviosMes,
        },
        {
          label: 'Cobros pendientes',
          value: String(data.kpis.cobrosPendientes),
          sub: fmtSoles(data.kpis.cobrosPendientesTotal),
          icon: Hourglass,
          iconClass: 'bg-indigo-100 text-indigo-600',
          hoverClass: 'hover:border-indigo-200',
        },
        {
          label: 'Stock bajo',
          value: String(data.kpis.stockBajo),
          sub: 'por reabastecer',
          icon: AlertTriangle,
          iconClass:
            data.kpis.stockBajo > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400',
          hoverClass: 'hover:border-red-200',
        },
      ]
    : []

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-slate-100 bg-white" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="h-64 animate-pulse rounded-2xl border border-slate-100 bg-white" />
          <div className="h-64 animate-pulse rounded-2xl border border-slate-100 bg-white" />
        </div>
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

  return (
    <div className="space-y-4">
      {/* ============ SALDO DISPONIBLE ============ */}
      {data && (
        <div
          data-tour="resumen-saldo"
          className={`rounded-2xl bg-gradient-to-r ${
            data.kpis.saldoDisponible >= 0
              ? 'from-sky-600 via-sky-600 to-indigo-700'
              : 'from-red-500 via-red-500 to-rose-600'
          } p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Saldo disponible
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold mt-1 leading-none tracking-tight">
              {fmtSoles(data.kpis.saldoDisponible)}
            </p>
            <p className="text-xs text-white/70 mt-2">Ventas totales − Compras − Gastos</p>
          </div>
          <div className="flex items-center gap-5 sm:gap-8 sm:divide-x sm:divide-white/20">
            <div className="sm:pr-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Ventas
              </p>
              <p className="text-lg font-extrabold mt-0.5">{fmtSoles(data.kpis.totalVentas)}</p>
            </div>
            <div className="sm:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Compras
              </p>
              <p className="text-lg font-extrabold mt-0.5">{fmtSoles(data.kpis.totalCompras)}</p>
            </div>
            <div className="sm:pl-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Gastos
              </p>
              <p className="text-lg font-extrabold mt-0.5">{fmtSoles(data.kpis.totalGastos)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ============ KPIs ============ */}
      <div data-tour="resumen-kpis" className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Dinero
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dineroKpis.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Operación
          </p>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {operacionKpis.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>
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
            className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5"
          >
            <h3 className="text-sm font-bold text-slate-900">Pendiente de acción</h3>
            <p className="text-xs text-slate-400 mt-0.5">Lo que necesita tu atención hoy.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <button
                onClick={() => onNavegar('envios')}
                className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 text-left transition-all hover:border-red-200 hover:bg-red-50/50"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Boxes size={18} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-extrabold text-slate-900 leading-none">
                    {pendientes?.sinEmpacar ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">sin empacar</p>
                  <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-400"
                      style={{ width: `${pctSinEmpacar}%` }}
                    />
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-red-500 transition-colors"
                />
              </button>

              <button
                onClick={() => onNavegar('envios')}
                className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 text-left transition-all hover:border-amber-200 hover:bg-amber-50/50"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-extrabold text-slate-900 leading-none">
                    {pendientes?.empacados ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">por enviar</p>
                  <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${pctEmpacados}%` }}
                    />
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-amber-500 transition-colors"
                />
              </button>

              <button
                onClick={() => onNavegar('ventas')}
                className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <Hourglass size={18} className="text-indigo-600" />
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
                  size={16}
                  className="text-slate-300 group-hover:text-indigo-500 transition-colors"
                />
              </button>

              <button
                onClick={() => onNavegar('productos')}
                className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 text-left transition-all hover:border-orange-200 hover:bg-orange-50/50"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-extrabold text-slate-900 leading-none">
                    {pendientes?.stockBajo ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">productos bajo stock</p>
                </div>
                <ChevronRight
                  size={16}
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
                  <CalendarDays size={15} className="text-sky-600" />
                  Histórico de ventas por día
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evolución diaria de tu negocio.
                </p>
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
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Total del período
                </p>
                <p className="mt-1 text-base font-extrabold text-slate-900 leading-none">
                  {fmtValor(stats.totalValor)}
                  {metrica === 'pedidos' && (
                    <span className="text-[11px] font-semibold text-slate-400"> pedidos</span>
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Promedio diario
                </p>
                <p className="mt-1 text-base font-extrabold text-slate-900 leading-none">
                  {fmtValor(stats.promedio)}
                  {metrica === 'pedidos' && (
                    <span className="text-[11px] font-semibold text-slate-400"> pedidos/día</span>
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Mejor día
                </p>
                <p className="mt-1 text-base font-extrabold text-slate-900 leading-none">
                  {stats.mejor ? fmtValor(stats.mejor.valor) : '—'}
                </p>
                {stats.mejor && (
                  <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                    {fmtFechaLarga(stats.mejor.fecha)}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Días con venta
                </p>
                <p className="mt-1 text-base font-extrabold text-slate-900 leading-none">
                  {stats.diasActivos}
                  <span className="text-[11px] font-semibold text-slate-400">
                    {' '}
                    de {serie.length}
                  </span>
                </p>
              </div>
            </div>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${metrica}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={areaColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={areaColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickFormatter={(v: string) => fmtFecha(v)}
                    minTickGap={28}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    width={38}
                    allowDecimals={false}
                    tickFormatter={(v: number) => fmtCompacto(v)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<HistoricoTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke={areaColor}
                    strokeWidth={2.5}
                    fill={`url(#grad-${metrica})`}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ============ GRÁFICOS ============ */}
          <div data-tour="resumen-graficos" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Ventas por método de pago</h3>
              <p className="text-[11px] text-slate-400">Últimos 30 días</p>
              <div className="h-52 flex items-center justify-center mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.graficos.ventasPorMetodo}
                      dataKey="total"
                      nameKey="metodo"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={32}
                      label={({ metodo, percent }: any) =>
                        `${METODO_PAGO_LABEL[metodo] || metodo} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.graficos.ventasPorMetodo.map((entry, i) => (
                        <Cell key={entry.metodo} fill={METODO_COLORS[i % METODO_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Envíos por estado</h3>
              <p className="text-[11px] text-slate-400">Últimos 30 días</p>
              <div className="h-52 flex items-center justify-center mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.graficos.enviosPorEstado}
                      dataKey="count"
                      nameKey="estado"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={32}
                      label={({ estado, percent }: any) =>
                        `${estado} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.graficos.enviosPorEstado.map((entry) => (
                        <Cell
                          key={entry.estado}
                          fill={ESTADO_ENVIO_COLORS[entry.estado] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Envíos por método</h3>
              <p className="text-[11px] text-slate-400">Últimos 30 días</p>
              <div className="h-52 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.graficos.enviosPorMetodo} layout="vertical">
                    <XAxis
                      type="number"
                      tick={{ fontSize: 9, fill: '#94a3b8' }}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="metodo"
                      type="category"
                      tick={{ fontSize: 9, fill: '#94a3b8' }}
                      width={70}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data.graficos.enviosPorMetodo.map((_, i) => (
                        <Cell key={i} fill={METODO_COLORS[i % METODO_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Este mes vs mes anterior</h3>
              <p className="text-[11px] text-slate-400">Comparativa del mes en curso</p>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                    <Banknote size={14} className="text-sky-600" />
                  </div>
                  <p className="flex-1 text-xs font-bold text-slate-700">Ventas</p>
                  <span className="text-sm font-extrabold text-slate-900">
                    {fmtSoles(data.kpis.ventasMes)}
                  </span>
                  <DeltaBadge delta={data.deltas.ventasMes} />
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <PackageOpen size={14} className="text-purple-600" />
                  </div>
                  <p className="flex-1 text-xs font-bold text-slate-700">Envíos</p>
                  <span className="text-sm font-extrabold text-slate-900">
                    {data.kpis.enviosMes}
                  </span>
                  <DeltaBadge delta={data.deltas.enviosMes} />
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                    <Receipt size={14} className="text-rose-600" />
                  </div>
                  <p className="flex-1 text-xs font-bold text-slate-700">Gastos</p>
                  <span className="text-sm font-extrabold text-slate-900">
                    {fmtSoles(data.kpis.gastosMes)}
                  </span>
                  <DeltaBadge delta={data.deltas.gastosMes} invert />
                </div>
              </div>
            </div>
          </div>

          {/* ============ RECIENTES ============ */}
          <div data-tour="resumen-recientes" className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-900">Últimos pedidos</h3>
              {data.recientes.envios.length === 0 ? (
                <p className="text-xs text-slate-400 mt-3">Aún no hay pedidos.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {data.recientes.envios.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{e.nombre}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {e.metodo} · {fmtFecha(e.fecha_registro)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                          ESTADO_BADGE[e.estado] || 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {e.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-900">Últimas ventas</h3>
              {data.recientes.ventas.length === 0 ? (
                <p className="text-xs text-slate-400 mt-3">Aún no hay ventas.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {data.recientes.ventas.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                        <Banknote size={14} className="text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {v.persona_nombre}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {METODO_PAGO_LABEL[v.metodo_pago] || v.metodo_pago} ·{' '}
                          {fmtFecha(v.created_at)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                        {fmtSoles(v.total)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                          ESTADO_BADGE[v.estado] || 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {v.estado === 'PENDIENTE' ? 'Por cobrar' : v.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-900">Últimos gastos</h3>
              {data.recientes.gastos.length === 0 ? (
                <p className="text-xs text-slate-400 mt-3">Aún no hay gastos.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {data.recientes.gastos.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                        <Receipt size={14} className="text-rose-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{g.concepto}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {CATEGORIA_GASTO_LABEL[g.categoria] || g.categoria} · {fmtFecha(g.fecha)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                          CATEGORIA_GASTO_STYLE[g.categoria] || 'bg-slate-100 text-slate-600'
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
