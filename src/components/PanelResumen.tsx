'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Wallet,
  Banknote,
  PackageOpen,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Hourglass,
  Boxes,
  Package,
  Receipt,
  ChevronRight,
  ChevronDown,
  BarChart3,
  CircleDashed,
  Sparkles,
  type LucideIcon,
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
import type { ConfigState } from '@/types/config'

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
    pedidosSinVenta?: number
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
  onNavegar: (p: 'envios' | 'productos' | 'ventas' | 'compras' | 'gastos') => void
  onConfig: () => void
  config: ConfigState
}

const METODO_COLORS = ['#0ea5e9', '#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#94a3b8']
const ESTADO_ENVIO_COLORS: Record<string, string> = {
  NO_EMPACADO: '#f87171',
  EMPACADO: '#fbbf24',
  EN_OBSERVACION: '#a855f7',
  ENVIADO: '#34d399',
}
const ESTADO_ENVIO_LABEL: Record<string, string> = {
  NO_EMPACADO: 'Sin empacar',
  EMPACADO: 'Empacados',
  EN_OBSERVACION: 'En observación',
  ENVIADO: 'Enviados',
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
      {up ? '▲' : '▼'} {Math.abs(delta)}%
    </span>
  )
}

type HistoricoDato = { fecha: string; total: number; cantidad: number }

function HistoricoTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: HistoricoDato }[]
}) {
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

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const w = 180
  const h = 48
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const rango = max - min || 1
  const pts = data
    .map(
      (d, i) =>
        `${(i / (data.length - 1)) * w},${h - 4 - ((d - min) / rango) * (h - 10)}`
    )
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#spark-fill)" />
      <circle
        cx={(data.length - 1) >= 0 ? ((data.length - 1) / (data.length - 1)) * w : 0}
        cy={h - 4 - ((data[data.length - 1] - min) / rango) * (h - 10)}
        r={3.5}
        fill="#ffffff"
      />
    </svg>
  )
}

function SectionHeader({
  icon: Icon,
  grad,
  title,
  subtitle,
  badge,
}: {
  icon: LucideIcon
  grad: string
  title: string
  subtitle: string
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <span
          className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm shrink-0`}
        >
          <Icon size={16} className="text-white" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">{title}</h3>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{subtitle}</p>
        </div>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
          {badge}
        </span>
      )}
    </div>
  )
}

function Tile({ icon: Icon, label, valor }: { icon: LucideIcon; label: string; valor: string }) {
  return (
    <div className="group relative rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-200">
      <div className="flex items-start justify-between gap-2">
        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
          <Icon size={15} className="text-white" />
        </span>
        <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={11} className="text-emerald-600" />
        </span>
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-extrabold text-slate-900 leading-none truncate">{valor}</p>
    </div>
  )
}

export default function PanelResumen({ userId, onNavegar, onConfig, config }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<7 | 30 | 90>(30)
  const [metrica, setMetrica] = useState<'monto' | 'pedidos'>('monto')
  const [verDetalle, setVerDetalle] = useState(false)

  useEffect(() => {
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

  // ========================================
  // DIAGNÓSTICO DE CONFIGURACIÓN
  // ========================================
  const metodosActivos = [
    config.metodoMotorizado && 'Motorizado',
    config.metodoShalom && 'Shalom',
    config.metodoOlva && 'Olva',
    config.metodoMarvisur && 'Marvisur',
    config.metodoFlores && 'Flores',
    config.metodoOtro && (config.nombreMetodoOtro || 'Otro'),
    config.metodoRecojo && 'Recojo',
  ].filter(Boolean) as string[]

  const pasosConfig = [
    {
      id: 'logo',
      ok: Boolean(config.logoUrl),
      label: 'Logo',
      listo: 'Con logo',
      falta: 'Sube tu logo para que tus clientes confíen.',
    },
    {
      id: 'metodos',
      ok: metodosActivos.length > 0,
      label: 'Métodos de envío',
      listo: `${metodosActivos.length} activ${metodosActivos.length === 1 ? 'o' : 'os'}`,
      falta: 'Activa al menos un método de envío.',
    },
    {
      id: 'origen',
      ok: !config.metodoShalom || Boolean(config.nuevoOrigen.trim()),
      label: 'Origen Shalom',
      listo: 'Configurado',
      falta: 'Configura tu origen para envíos Shalom.',
    },
  ]

  const falta = pasosConfig.filter((p) => !p.ok)
  const configOk = pasosConfig.length - falta.length
  const configTotal = pasosConfig.length
  const pctConfig = configTotal > 0 ? Math.round((configOk / configTotal) * 100) : 0

  // ========================================
  // ESTADO: LO QUE ESTÁ MAL (OPERATIVO)
  // ========================================
  const enObservacion =
    (data?.graficos.enviosPorEstado ?? []).find((e) => e.estado === 'EN_OBSERVACION')?.count ?? 0

  const mal = data
    ? [
        {
          id: 'empacar',
          count: data.pendientes.sinEmpacar,
          label: 'pedidos sin empacar',
          detalle: 'Prepararlos para poder enviarlos.',
          icon: Boxes as LucideIcon,
          grad: 'from-red-400 to-rose-500',
          tab: 'envios' as const,
        },
        {
          id: 'observacion',
          count: enObservacion,
          label: 'envíos en observación',
          detalle: 'Requieren revisión.',
          icon: Eye as LucideIcon,
          grad: 'from-violet-400 to-purple-500',
          tab: 'envios' as const,
        },
        {
          id: 'cobrar',
          count: data.pendientes.cobrosPendientes,
          label: 'ventas por cobrar',
          detalle: `${fmtSoles(data.pendientes.cobrosPendientesTotal)} pendientes`,
          icon: Hourglass as LucideIcon,
          grad: 'from-sky-400 to-blue-500',
          tab: 'ventas' as const,
        },
        {
          id: 'stock',
          count: data.pendientes.stockBajo,
          label: 'productos bajo stock',
          detalle: 'Reabastécete pronto.',
          icon: AlertTriangle as LucideIcon,
          grad: 'from-orange-400 to-amber-500',
          tab: 'productos' as const,
        },
        {
          id: 'sinventa',
          count: data.pendientes.pedidosSinVenta ?? 0,
          label: 'pedidos sin venta',
          detalle: 'Registra la venta asociada.',
          icon: Receipt as LucideIcon,
          grad: 'from-amber-400 to-yellow-500',
          tab: 'ventas' as const,
        },
        {
          id: 'enviar',
          count: data.pendientes.empacados,
          label: 'listos para enviar',
          detalle: 'Ya empacados, expedirlos.',
          icon: Package as LucideIcon,
          grad: 'from-indigo-400 to-blue-600',
          tab: 'envios' as const,
        },
      ].filter((i) => i.count > 0)
    : []

  const sinDatos =
    !data ||
    (data.kpis.ventasMes === 0 &&
      data.kpis.enviosMes === 0 &&
      data.kpis.cobrosPendientes === 0 &&
      data.kpis.pedidosPorDespachar === 0 &&
      data.kpis.stockBajo === 0)

  const saldo = data?.kpis.saldoDisponible ?? 0
  const areaColor = metrica === 'monto' ? '#0284c7' : '#6366f1'
  const sparkData = useMemo(() => (data?.historico.ventas ?? []).slice(-14).map((v) => v.total), [data])

  const metodosPago = data?.graficos.ventasPorMetodo.filter((m) => m.total > 0) ?? []
  const totalMetodosPago = metodosPago.reduce((a, m) => a + m.total, 0)

  const estadosData = (data?.graficos.enviosPorEstado ?? [])
    .filter((e) => e.count > 0)
    .sort(
      (a, b) =>
        ['NO_EMPACADO', 'EMPACADO', 'EN_OBSERVACION', 'ENVIADO'].indexOf(a.estado) -
        ['NO_EMPACADO', 'EMPACADO', 'EN_OBSERVACION', 'ENVIADO'].indexOf(b.estado)
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-3xl bg-gradient-to-r from-slate-100 to-slate-200" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="h-32 animate-pulse rounded-3xl bg-white border border-slate-100" />
        <div className="h-32 animate-pulse rounded-3xl bg-white border border-slate-100" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ============ SALUDO ============ */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-sm">
            <Sparkles size={18} className="text-white" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
              ¡Hola, {config.empresa.trim() || 'tu negocio'}!
            </h2>
            <p className="text-[11px] text-slate-400">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })} · así está tu negocio hoy
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm ${
            data && saldo < 0
              ? 'bg-red-50 text-red-600'
              : data && saldo > 0
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {data && saldo < 0 ? 'En rojo' : data && saldo > 0 ? 'Vamos bien' : 'Sin datos aún'}
        </span>
      </div>

      {/* ============ SALDO DISPONIBLE ============ */}
      {data && (
        <div
          data-tour="resumen-saldo"
          className={`relative overflow-hidden rounded-3xl text-white shadow-xl ${
            saldo >= 0
              ? 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700'
              : 'bg-gradient-to-br from-rose-500 via-red-600 to-rose-700'
          }`}
        >
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-28 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute right-8 top-6 hidden sm:block h-20 w-20 rounded-3xl border border-white/15 rotate-12 pointer-events-none" />
          <div className="absolute right-20 top-24 hidden lg:block h-6 w-6 rounded-xl bg-white/10 rotate-6 pointer-events-none" />

          <div className="relative p-5 sm:p-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <Wallet size={17} className="text-white" />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
                  Saldo disponible
                </p>
                <span
                  className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    saldo >= 0 ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/20 text-white'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${saldo >= 0 ? 'bg-emerald-300' : 'bg-red-200'}`}
                  />
                  {saldo >= 0 ? 'Negocio sano' : 'Saldo negativo'}
                </span>
              </div>
              <p className="mt-3 text-4xl sm:text-5xl font-extrabold leading-none tracking-tight drop-shadow-sm">
                {fmtSoles(saldo)}
              </p>
              <p className="text-[11px] text-white/65 mt-2.5">
                Ventas cobradas − Compras − Gastos
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="rounded-2xl bg-white/10 backdrop-blur px-3.5 py-2 border border-white/10">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/55">
                    Por cobrar
                  </p>
                  <p className="text-base font-extrabold leading-none mt-0.5">
                    {fmtSoles(data.kpis.cobrosPendientesTotal)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 backdrop-blur px-3.5 py-2 border border-white/10">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/55">
                    Gastos del mes
                  </p>
                  <p className="text-base font-extrabold leading-none mt-0.5">
                    {fmtSoles(data.kpis.gastosMes)}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-56 rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/55">
                Ventas últimos 14 días
              </p>
              <div className="mt-2">
                <Sparkline data={sparkData} />
              </div>
              <p className="text-[11px] text-white/70 mt-1.5">
                {sparkData.length > 0
                  ? fmtSoles(sparkData.reduce((a, b) => a + b, 0)) + ' este período'
                  : 'Aún sin ventas'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============ FORMULARIO CERRADO ============ */}
      {config.cerrarFormulario && (
        <button
          onClick={onConfig}
          className="w-full flex items-center gap-3 rounded-3xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 text-left shadow-sm hover:shadow-md transition-all"
        >
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle size={17} className="text-white" />
          </span>
          <span className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-700">Tu formulario está cerrado</p>
            <p className="text-xs text-red-500 mt-0.5">
              No estás recibiendo pedidos. Toca aquí para activarlo.
            </p>
          </span>
          <ChevronRight size={16} className="text-red-400 shrink-0" />
        </button>
      )}

      {/* ============ LO QUE TIENES ============ */}
      <div
        data-tour="resumen-kpis"
        className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm"
      >
        <SectionHeader
          icon={CheckCircle2}
          grad="from-emerald-400 to-emerald-600"
          title="Lo que tienes"
          subtitle="Tu negocio listo para vender."
          badge={`${configOk}/${configTotal} listo`}
        />
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {data && (
            <>
              <Tile icon={Banknote} label="Ventas del mes" valor={fmtSoles(data.kpis.ventasMes)} />
              <Tile icon={Banknote} label="Ventas de hoy" valor={fmtSoles(data.kpis.ventasHoy)} />
              <Tile icon={PackageOpen} label="Envíos del mes" valor={String(data.kpis.enviosMes)} />
              <Tile
                icon={Truck}
                label="Métodos de envío"
                valor={`${metodosActivos.length} activos`}
              />
            </>
          )}
          {pasosConfig
            .filter(
              (p) =>
                p.ok &&
                !(p.id === 'metodos' && data) &&
                p.id !== 'logo' &&
                p.id !== 'origen'
            )
            .map((p) => (
              <Tile key={p.id} icon={CheckCircle2} label={p.label} valor={p.listo} />
            ))}
        </div>
      </div>

      {/* ============ FALTA + ATENCIÓN al lado ============ */}
      {(falta.length > 0 || mal.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ============ LO QUE FALTA ============ */}
          {falta.length > 0 && (
            <div
              className={`rounded-3xl border border-amber-100 bg-gradient-to-b from-amber-50/70 to-white p-4 sm:p-5 shadow-sm ${
                mal.length > 0 ? '' : 'lg:col-span-2'
              }`}
            >
              <SectionHeader
                icon={CircleDashed}
                grad="from-amber-400 to-orange-500"
                title="Lo que falta"
                subtitle="Pasos para que tu negocio esté completo."
                badge={`${falta.length} por hacer`}
              />
              <div className="mt-3 rounded-2xl bg-amber-100/50 border border-amber-200/60 px-3.5 py-3">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-bold text-slate-700">Progreso de configuración</span>
                  <span className="font-extrabold text-amber-700">
                    {configOk}/{configTotal} listo · {pctConfig}%
                  </span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-amber-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${pctConfig}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Te falta {100 - pctConfig}% para dejar tu negocio listo.
                </p>
              </div>
              <div className="mt-3 space-y-1.5">
                {falta.map((f) => (
              <button
                key={f.id}
                onClick={onConfig}
                className="group flex items-center gap-3 rounded-2xl border border-transparent p-2.5 w-full text-left transition-all hover:bg-white hover:border-amber-100 hover:shadow-sm"
              >
                <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                  <CircleDashed size={16} className="text-white" />
                </span>
                <span className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800">{f.label}</p>
                  <p className="text-[11px] text-slate-500 truncate">{f.falta}</p>
                </span>
                <ChevronRight
                  size={15}
                  className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </button>
            ))}
          </div>
        </div>
      )}

        {/* ============ LO QUE ESTÁ MAL ============ */}
        {mal.length > 0 && (
          <div
            data-tour="resumen-pendientes"
            className={`rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm ${
              falta.length > 0 ? '' : 'lg:col-span-2'
            }`}
          >
          <SectionHeader
            icon={AlertTriangle}
            grad="from-red-400 to-rose-600"
            title="Necesita tu atención"
            subtitle="Toca un tema e iremos directo a resolverlo."
            badge={`${mal.length} tema${mal.length === 1 ? '' : 's'}`}
          />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mal.map((m) => (
              <button
                key={m.id}
                onClick={() => onNavegar(m.tab)}
                className="group relative rounded-2xl border border-red-100 bg-gradient-to-br from-white to-rose-50/70 p-3 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-red-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${m.grad} flex items-center justify-center shadow-sm`}
                  >
                    <m.icon size={15} className="text-white" />
                  </span>
                  <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-extrabold text-red-600">
                    {m.count}
                  </span>
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {m.label}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-600 leading-tight truncate">
                  {m.detalle}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
        </div>
      )}

      {/* ============ VACÍO ============ */}
      {sinDatos && falta.length === 0 && mal.length === 0 && !config.cerrarFormulario && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ToriMascot variant="empty" size={56} animate />
          <p className="text-sm text-slate-400">
            Aún no hay datos. Crea tu primer pedido o registra una venta para ver tu resumen.
          </p>
        </div>
      )}

      {/* ============ VER DETALLE ============ */}
      {!sinDatos && (
        <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
          <button
            onClick={() => setVerDetalle((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-slate-50/60 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-sm">
                <BarChart3 size={16} className="text-white" />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">Ver detalle</span>
                <span className="block text-[11px] text-slate-400">
                  Histórico de ventas y desglose de operaciones
                </span>
              </span>
            </span>
            <span
              className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-200 ${
                verDetalle ? 'rotate-180' : ''
              }`}
            >
              <ChevronDown size={16} className="text-slate-600" />
            </span>
          </button>
          {verDetalle && (
            <div className="border-t border-slate-100">
              {/* HISTÓRICO */}
              <div data-tour="resumen-historico" className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Histórico de ventas por día</h3>
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

                <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <div className="rounded-2xl bg-slate-50 p-2.5">
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
                  <div className="rounded-2xl bg-slate-50 p-2.5">
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
                  <div className="rounded-2xl bg-slate-50 p-2.5">
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
                  <div className="rounded-2xl bg-slate-50 p-2.5">
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

              {/* DESGLOSE DE OPERACIONES */}
              <div data-tour="resumen-graficos" className="border-t border-slate-100">
                <div className="flex items-center justify-between px-4 pt-4">
                  <h3 className="text-sm font-bold text-slate-900">Desglose de operaciones</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Últimos 30 días
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-slate-100">
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
                        <p className="mt-2 text-[10px] text-slate-400">{totalEstados} envíos en total</p>
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
            </div>
          )}
        </div>
      )}

      </div>
  )
}