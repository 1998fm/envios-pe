'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  X,
  Building2,
  ShieldCheck,
  Activity,
  Boxes,
  ShoppingCart,
  Wallet,
  Package,
  Truck,
  Ban,
  Unlock,
  RefreshCw,
  User,
  LogIn,
  List,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

type Empresa = {
  id: string
  empresa: string
  slug: string
  email: string
  plan: string
  isTrial: boolean
  diasRestantes: number | null
  planDeclarado: string
  trial_end: string | null
  pro_until: string | null
  disabled: boolean
  role: string
  created_at: string | null
}

type Detalle = {
  id: string
  empresa: string
  slug: string
  email: string
  plan: string
  disabled: boolean
  role: string
  created_at: string | null
  metricas: {
    totalEnvios: number
    totalVentas: number
    totalGastos: number
    totalCompras: number
    totalProductos: number
    montoVentas: number
    montoCompras: number
    montoGastos: number
    utilidadEstimada: number
    ultimaActividad: string | null
    porEstado: Record<string, number>
    porMetodo: Record<string, number>
  }
  serie: { dia: string; envios: number; ventas: number }[]
  enviosRecientes: { id: string; estado: string; fecha_registro: string | null }[]
}

const PLAN_LABEL: Record<string, string> = {
  basic: 'Básico',
  pro: 'Pro',
  business_plus: 'Business Plus',
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EMPACADO: 'Empacado',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
}

const METODO_LABEL: Record<string, string> = {
  MOTORIZADO: 'Motorizado',
  SHALOM: 'Shalom',
  OLVA: 'Olva',
  MARVISUR: 'Marvisur',
  FLORES: 'Flores',
  RECOJO: 'Recojo',
  OTRO: 'Otro',
}

const fmtMoney = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtNum = (n: number) => n.toLocaleString('es-PE')

function KpiMini({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 font-medium truncate">{label}</p>
        <p className="text-base font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  )
}

function BadgeEstado({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    PENDIENTE: 'bg-slate-100 text-slate-600',
    EMPACADO: 'bg-amber-100 text-amber-700',
    ENVIADO: 'bg-sky-100 text-sky-700',
    ENTREGADO: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[estado] ?? 'bg-slate-100 text-slate-600'}`}>
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  )
}

type Props = {
  open: boolean
  empresa: Empresa | null
  onClose: () => void
  onToggleBlock: (emp: Empresa) => void
  onResetPassword: (emp: Empresa) => void
  onImpersonate: (emp: Empresa) => void
  onEditar: (emp: Empresa) => void
}

export default function CompanyDetailModal({
  open,
  empresa,
  onClose,
  onToggleBlock,
  onResetPassword,
  onImpersonate,
  onEditar,
}: Props) {
  const [detalle, setDetalle] = useState<Detalle | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    if (!empresa) return
    setCargando(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/empresas/${empresa.id}/detalle`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setDetalle(data)
    } catch (e) {
      setError((e as Error).message)
      setDetalle(null)
    } finally {
      setCargando(false)
    }
  }, [empresa])

  useEffect(() => {
    if (open && empresa) cargar()
  }, [open, empresa, cargar])

  const max = detalle
    ? Math.max(
        ...detalle.serie.map((s) => Math.max(s.envios, s.ventas)),
        1
      )
    : 1

  return (
    <Modal open={open} maxWidth="max-w-3xl">
      <div className="max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 truncate">{detalle?.empresa || empresa?.empresa || 'Empresa'}</h3>
              <p className="text-xs text-slate-400 truncate">{detalle?.email || empresa?.email || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {cargando && (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw size={18} className="animate-spin mr-2" /> Cargando métricas...
            </div>
          )}

          {error && !cargando && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          {detalle && !cargando && (
            <>
              {/* KPI grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <KpiMini icon={<Truck size={16} />} label="Envíos" value={fmtNum(detalle.metricas.totalEnvios)} color="bg-sky-100 text-sky-600" />
                <KpiMini icon={<ShoppingCart size={16} />} label="Ventas" value={fmtNum(detalle.metricas.totalVentas)} color="bg-emerald-100 text-emerald-600" />
                <KpiMini icon={<Boxes size={16} />} label="Productos" value={fmtNum(detalle.metricas.totalProductos)} color="bg-violet-100 text-violet-600" />
                <KpiMini icon={<Package size={16} />} label="Compras" value={fmtNum(detalle.metricas.totalCompras)} color="bg-amber-100 text-amber-600" />
                <KpiMini icon={<Wallet size={16} />} label="Gastos" value={fmtNum(detalle.metricas.totalGastos)} color="bg-red-100 text-red-600" />
                <KpiMini icon={<Activity size={16} />} label="Última actividad" value={detalle.metricas.ultimaActividad ? fmtFecha(detalle.metricas.ultimaActividad) : '—'} color="bg-slate-100 text-slate-600" />
              </div>

              {/* Money + utilidad */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] text-slate-400 font-medium">Ingresos (ventas)</p>
                  <p className="text-lg font-bold text-emerald-600">{fmtMoney(detalle.metricas.montoVentas)}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] text-slate-400 font-medium">Costos (compras+gastos)</p>
                  <p className="text-lg font-bold text-slate-700">{fmtMoney(detalle.metricas.montoCompras + detalle.metricas.montoGastos)}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] text-slate-400 font-medium">Utilidad estimada</p>
                  <p className={`text-lg font-bold ${detalle.metricas.utilidadEstimada >= 0 ? 'text-sky-700' : 'text-red-600'}`}>{fmtMoney(detalle.metricas.utilidadEstimada)}</p>
                </div>
              </div>

              {/* Gráfico actividad */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-900">Actividad (14 días)</h4>
                  <span className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Envíos</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Ventas</span>
                  </span>
                </div>
                <div className="flex items-end gap-[3px] h-28">
                  {detalle.serie.map((s) => (
                    <div key={s.dia} className="flex-1 flex items-end gap-[2px] h-full">
                      <div className="flex-1 bg-sky-500 rounded-t-sm" style={{ height: `${(s.envios / max) * 100}%` }} title={`${s.dia} · envíos ${s.envios}`} />
                      <div className="flex-1 bg-indigo-400 rounded-t-sm" style={{ height: `${(s.ventas / max) * 100}%` }} title={`${s.dia} · ventas ${s.ventas}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Envíos recientes */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <List size={15} className="text-sky-600" />
                  <h4 className="text-sm font-semibold text-slate-900">Últimos envíos</h4>
                </div>
                <div className="divide-y divide-slate-100">
                  {detalle.enviosRecientes.length === 0 && (
                    <p className="px-4 py-6 text-sm text-slate-400 text-center">Sin envíos registrados.</p>
                  )}
                  {detalle.enviosRecientes.map((e) => (
                    <div key={e.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <span className="text-slate-500">{e.fecha_registro ? fmtFecha(e.fecha_registro) : '—'}</span>
                      <BadgeEstado estado={e.estado} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Estado de envíos por estado */}
              {Object.keys(detalle.metricas.porEstado).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Envíos por estado</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(detalle.metricas.porEstado).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-sky-500" /> {ESTADO_LABEL[k] ?? k}: {fmtNum(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Envíos por método de envío */}
              {Object.keys(detalle.metricas.porMetodo).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Envíos por método</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(detalle.metricas.porMetodo)
                      .sort((a, b) => b[1] - a[1])
                      .map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" /> {METODO_LABEL[k] ?? k}: {fmtNum(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex flex-wrap gap-2 justify-end z-10">
          <Button type="secondary" className="!px-4 !py-2 text-sm" onClick={() => empresa && onEditar(empresa)}>
            <span className="flex items-center gap-1.5"><User size={15} /> Editar plan</span>
          </Button>
          <Button type="secondary" className="!px-4 !py-2 text-sm" onClick={() => empresa && onResetPassword(empresa)}>
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} /> Reset contraseña</span>
          </Button>
          <Button type="secondary" className="!px-4 !py-2 text-sm" onClick={() => empresa && onImpersonate(empresa)}>
            <span className="flex items-center gap-1.5"><LogIn size={15} /> Entrar como</span>
          </Button>
          <Button
            type={empresa?.disabled ? 'primary' : 'danger'}
            className="!px-4 !py-2 text-sm"
            onClick={() => empresa && onToggleBlock(empresa)}
          >
            <span className="flex items-center gap-1.5">
              {empresa?.disabled ? <Unlock size={15} /> : <Ban size={15} />}
              {empresa?.disabled ? 'Desbloquear' : 'Bloquear'}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}