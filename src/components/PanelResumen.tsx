'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import ToriMascot from '@/components/ToriMascot'

type DashboardData = {
  kpis: {
    ventasMes: number
    ventasHoy: number
    cobrosPendientes: number
    cobrosPendientesTotal: number
    pedidosPorDespachar: number
    enviosMes: number
    stockBajo: number
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
  }
  graficos: {
    tendenciaDiaria: { fecha: string; count: number }[]
    ventasPorMetodo: { metodo: string; total: number }[]
    enviosPorEstado: { estado: string; count: number }[]
    enviosPorMetodo: { metodo: string; count: number }[]
  }
  stockBajo: { nombre: string; stock_actual: number; stock_minimo: number; unidad: string }[]
  recientes: {
    envios: { id: string; nombre: string; estado: string; metodo: string; fecha_registro: string }[]
    ventas: { id: string; persona_nombre: string; total: number; estado: string; metodo_pago: string; created_at: string }[]
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

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null
  const up = delta >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(delta)}%
    </span>
  )
}

function SkeletonCard() {
  return <div className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white" />
}

export default function PanelResumen({ userId, onNavegar }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard?user_id=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [userId])

  const kpis = data
    ? [
        {
          label: 'Ventas del mes',
          value: fmtSoles(data.kpis.ventasMes),
          icon: Banknote,
          iconClass: 'bg-sky-100 text-sky-600',
          delta: data.deltas.ventasMes,
        },
        {
          label: 'Ventas hoy',
          value: fmtSoles(data.kpis.ventasHoy),
          icon: TrendingUp,
          iconClass: 'bg-emerald-100 text-emerald-600',
          delta: data.deltas.ventasHoy,
        },
        {
          label: 'Cobros pendientes',
          value: String(data.kpis.cobrosPendientes),
          sub: fmtSoles(data.kpis.cobrosPendientesTotal),
          icon: Hourglass,
          iconClass: 'bg-indigo-100 text-indigo-600',
        },
        {
          label: 'Por despachar',
          value: String(data.kpis.pedidosPorDespachar),
          sub: `${data.kpis.pedidosPorDespachar - data.pendientes.sinEmpacar} empacados`,
          icon: Package,
          iconClass: 'bg-amber-100 text-amber-600',
        },
        {
          label: 'Envíos del mes',
          value: String(data.kpis.enviosMes),
          icon: PackageOpen,
          iconClass: 'bg-purple-100 text-purple-600',
          delta: data.deltas.enviosMes,
        },
        {
          label: 'Stock bajo',
          value: String(data.kpis.stockBajo),
          sub: 'productos por reabastecer',
          icon: AlertTriangle,
          iconClass: data.kpis.stockBajo > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400',
        },
      ]
    : []

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 h-64 animate-pulse rounded-2xl border border-slate-100 bg-white" />
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

  return (
    <div className="space-y-4">
      {/* ============ KPIs ============ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-100 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.iconClass}`}>
                <kpi.icon size={18} />
              </div>
              {kpi.delta !== undefined && <DeltaBadge delta={kpi.delta ?? null} />}
            </div>
            <p className="mt-3 text-xl font-extrabold text-slate-900 leading-none">{kpi.value}</p>
            {kpi.sub && <p className="mt-1 text-[11px] text-slate-400">{kpi.sub}</p>}
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {kpi.label}
            </p>
          </div>
        ))}
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
          <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
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
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-red-500 transition-colors" />
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
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
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
                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
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
                <ChevronRight size={16} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
              </button>
            </div>
          </div>

          {/* ============ GRÁFICOS ============ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-900">Pedidos últimos 30 días</h3>
              <div className="h-52 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.graficos.tendenciaDiaria}>
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 9, fill: '#94a3b8' }}
                      tickFormatter={(v: string) => fmtFecha(v)}
                      minTickGap={30}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={22} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}
                      labelFormatter={(v: any) => (typeof v === 'string' ? fmtFecha(v) : '')}
                    />
                    <Line type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Ventas por método de pago</h3>
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
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Envíos por estado</h3>
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
                      label={({ estado, percent }: any) => `${estado} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.graficos.enviosPorEstado.map((entry) => (
                        <Cell
                          key={entry.estado}
                          fill={ESTADO_ENVIO_COLORS[entry.estado] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Envíos por método</h3>
              <div className="h-52 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.graficos.enviosPorMetodo} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} allowDecimals={false} />
                    <YAxis
                      dataKey="metodo"
                      type="category"
                      tick={{ fontSize: 9, fill: '#94a3b8' }}
                      width={70}
                    />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data.graficos.enviosPorMetodo.map((_, i) => (
                        <Cell key={i} fill={METODO_COLORS[i % METODO_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ============ RECIENTES ============ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-900">Últimos pedidos</h3>
              {data.recientes.envios.length === 0 ? (
                <p className="text-xs text-slate-400 mt-3">Aún no hay pedidos.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {data.recientes.envios.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
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
                    <div key={v.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                        <Banknote size={14} className="text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{v.persona_nombre}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {METODO_PAGO_LABEL[v.metodo_pago] || v.metodo_pago} · {fmtFecha(v.created_at)}
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
          </div>
        </>
      )}
    </div>
  )
}
