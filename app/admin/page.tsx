'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Truck,
  History,
  Search,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Ban,
  Unlock,
  ExternalLink,
} from 'lucide-react'

type Tab = 'resumen' | 'empresas' | 'planes' | 'shalom' | 'auditoria'

const PLANES = ['basic', 'pro', 'business_plus']
const PLAN_LABEL: Record<string, string> = {
  basic: 'Básico',
  pro: 'Pro',
  business_plus: 'Business Plus',
}

// ---------- tipos ----------
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

type Overview = {
  total: number
  activas: number
  desactivadas: number
  enTrial: number
  pagando: number
  basic: number
  mrr: number
  proximosExpiarTrial: { id: string; empresa: string; dias: number }[]
  totalEnvios: number
  totalVentas: number
  serie: { dia: string; envios: number; ventas: number }[]
}

type PlanRow = {
  plan: string
  max_envios: number | null
  max_metodos: number | null
  max_productos: number | null
  max_ventas: number | null
  max_exportaciones_shalom: number | null
  max_pedidos_copiar: number | null
  form_branding: boolean
  dashboard_completo: boolean
  envios_masivos: boolean
  control_logistico: boolean
}

// ---------- helpers de presentación ----------
const fmtNum = (n: number) => n.toLocaleString('es-PE')
const fmtMoney = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('es-PE') : '—'

// Badge de plan con color
function BadgePlan({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    basic: 'bg-slate-100 text-slate-700 border-slate-200',
    pro: 'bg-sky-100 text-sky-700 border-sky-200',
    business_plus: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[plan] ?? map.basic}`}>
      {PLAN_LABEL[plan] ?? plan}
    </span>
  )
}

function BadgeEstado({ disabled, esAdmin }: { disabled: boolean; esAdmin: boolean }) {
  if (disabled)
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Bloqueada</span>
  if (esAdmin)
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Admin</span>
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Activa</span>
}

// Tarjeta KPI
function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const tabsList: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={16} /> },
  { key: 'empresas', label: 'Empresas', icon: <Building2 size={16} /> },
  { key: 'planes', label: 'Planes', icon: <CreditCard size={16} /> },
  { key: 'shalom', label: 'Agencias Shalom', icon: <Truck size={16} /> },
  { key: 'auditoria', label: 'Auditoría', icon: <History size={16} /> },
]

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('resumen')
  const [chequeando, setChequeando] = useState(true)
  const [sesion, setSesion] = useState(false)

  const [overview, setOverview] = useState<Overview | null>(null)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [totalEmpresas, setTotalEmpresas] = useState(0)
  const [totalPaginasE, setTotalPaginasE] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [filtroPlan, setFiltroPlan] = useState('')
  const [paginaE, setPaginaE] = useState(1)
  const [planRows, setPlanRows] = useState<PlanRow[] | null>(null)
  const [shalomEstado, setShalomEstado] = useState<{ total: number; activas: number; inactivas: number; actualizada_en: string | null } | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [auditoria, setAuditoria] = useState<{ id: number; admin_email: string; accion: string; detalle: unknown; created_at: string }[]>([])
  const [totalAuditoria, setTotalAuditoria] = useState(0)
  const [totalPaginasA, setTotalPaginasA] = useState(1)
  const [paginaA, setPaginaA] = useState(1)

  // modal editar empresa
  const [editando, setEditando] = useState<Empresa | null>(null)

  const [error, setError] = useState('')

  const fetchJson = useCallback(async (url: string, opts?: RequestInit) => {
    const res = await fetch(url, {
      cache: 'no-store',
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error((d as { error?: string }).error ?? `Error ${res.status}`)
    }
    return res.json()
  }, [])

  // Verificar sesión y rol
  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      setSesion(true)
      setChequeando(false)
    }
    check()
  }, [router])

  const cargarOverview = useCallback(async () => {
    try {
      const d = await fetchJson('/api/admin/overview')
      setOverview(d)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [fetchJson])

  const cargarEmpresas = useCallback(async () => {
    try {
      const q = new URLSearchParams()
      q.set('page', String(paginaE))
      q.set('perPage', '20')
      if (busqueda) q.set('search', busqueda)
      if (filtroPlan) q.set('plan', filtroPlan)
      const d = await fetchJson(`/api/admin/empresas?${q.toString()}`)
      setEmpresas(d.items)
      setTotalEmpresas(d.total)
      setTotalPaginasE(d.totalPages)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [fetchJson, paginaE, busqueda, filtroPlan])

  const cargarPlanes = useCallback(async () => {
    try {
      const d = await fetchJson('/api/admin/planes')
      setPlanRows(d.planes)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [fetchJson])

  const cargarShalom = useCallback(async () => {
    try {
      const d = await fetchJson('/api/admin/shalom')
      setShalomEstado(d)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [fetchJson])

  const cargarAuditoria = useCallback(async () => {
    try {
      const q = new URLSearchParams()
      q.set('page', String(paginaA))
      q.set('perPage', '20')
      const d = await fetchJson(`/api/admin/auditoria?${q.toString()}`)
      setAuditoria(d.items)
      setTotalAuditoria(d.total)
      setTotalPaginasA(d.totalPages)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [fetchJson, paginaA])

  // Carga según la pestaña activa
  useEffect(() => {
    if (!sesion) return
    if (tab === 'resumen') cargarOverview()
    if (tab === 'empresas') cargarEmpresas()
    if (tab === 'planes') cargarPlanes()
    if (tab === 'shalom') cargarShalom()
    if (tab === 'auditoria') cargarAuditoria()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion, tab])

  const refetchCurrent = () => {
    if (tab === 'resumen') cargarOverview()
    if (tab === 'empresas') cargarEmpresas()
    if (tab === 'planes') cargarPlanes()
    if (tab === 'shalom') cargarShalom()
    if (tab === 'auditoria') cargarAuditoria()
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // Acción: bloquear/desbloquear
  const toggleBlock = async (emp: Empresa) => {
    const nuevo = !emp.disabled
    setError('')
    try {
      const res = await fetch(`/api/admin/empresas/${emp.id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: nuevo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      if (data.aviso) setError(data.aviso)
      refetchCurrent()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // Acción: guardar edición de empresa
  const guardarEdicion = async () => {
    if (!editando) return
    setError('')
    try {
      await fetchJson(`/api/admin/empresas/${editando.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          plan: editando.plan,
          trial_end: editando.trial_end,
          pro_until: editando.pro_until,
          role: editando.role,
        }),
      })
      setEditando(null)
      refetchCurrent()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // Acción: sincronizar agencias
  const sincronizar = async () => {
    setSincronizando(true)
    setError('')
    try {
      const res = await fetch('/api/admin/shalom', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al sincronizar')
      await cargarShalom()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSincronizando(false)
    }
  }

  // Acción: guardar planes
  const guardarPlanes = async () => {
    if (!planRows) return
    setError('')
    try {
      const body: Record<string, Record<string, unknown>> = {}
      planRows.forEach((p) => (body[p.plan] = { ...p }))
      await fetchJson('/api/admin/planes', { method: 'PUT', body: JSON.stringify(body) })
      cargarPlanes()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const setCampoPlan = (plan: string, campo: keyof PlanRow, valor: unknown) => {
    setPlanRows((prev) =>
      prev ? prev.map((p) => (p.plan === plan ? { ...p, [campo]: valor } : p)) : prev
    )
  }

  if (chequeando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
            title="Ir al dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Panel Super Admin</h1>
            <p className="text-xs text-slate-400">Control y supervisión global de envios.pe</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 flex gap-1 overflow-x-auto">
        {tabsList.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 font-bold px-2">
            ×
          </button>
        </div>
      )}

      <div className="p-4">
        {/* ============ RESUEN ============ */}
        {tab === 'resumen' && overview && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Empresas totales" value={fmtNum(overview.total)} />
              <Kpi label="Activas" value={fmtNum(overview.activas)} sub={`${fmtNum(overview.desactivadas)} bloqueadas`} />
              <Kpi label="En trial" value={fmtNum(overview.enTrial)} />
              <Kpi label="MRR estimado" value={fmtMoney(overview.mrr)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Kpi label="Pagando" value={fmtNum(overview.pagando)} />
              <Kpi label="En básico" value={fmtNum(overview.basic)} />
              <Kpi label="Envíos (14d)" value={fmtNum(overview.totalEnvios)} />
            </div>

            {/* Gráfico simple con barras */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Actividad (últimos 14 días)</h3>
                <span className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Envíos</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Ventas</span>
                </span>
              </div>
              <div className="flex items-end gap-[3px] h-40">
                {overview.serie.map((s) => {
                  const max = Math.max(
                    overview.serie.reduce((m, x) => Math.max(m, x.envios, x.ventas), 1),
                    1
                  )
                  return (
                    <div key={s.dia} className="flex-1 flex items-end gap-[2px] h-full">
                      <div
                        className="flex-1 bg-sky-500 rounded-t-sm min-w-[3px]"
                        style={{ height: `${(s.envios / max) * 100}%` }}
                        title={`${s.dia} · envíos ${s.envios}`}
                      />
                      <div
                        className="flex-1 bg-indigo-400 rounded-t-sm min-w-[3px]"
                        style={{ height: `${(s.ventas / max) * 100}%` }}
                        title={`${s.dia} · ventas ${s.ventas}`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="mt-1 flex gap-[3px]">
                {overview.serie.map((s) => (
                  <div key={s.dia} className="flex-1 text-center text-[9px] text-slate-400 truncate">
                    {new Date(s.dia).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}
                  </div>
                ))}
              </div>
            </div>

            {/* Trial por expirar */}
            {overview.proximosExpiarTrial.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <h3 className="font-semibold text-amber-800 mb-2">Trials por expirar (≤ 7 días)</h3>
                <div className="space-y-1.5">
                  {overview.proximosExpiarTrial.map((t) => (
                    <div key={t.id} className="flex justify-between text-sm text-amber-900">
                      <span>{t.empresa}</span>
                      <span className="font-semibold">{t.dias} día(s)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ EMPRESAS ============ */}
        {tab === 'empresas' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value)
                    setPaginaE(1)
                  }}
                  placeholder="Buscar por empresa, slug o email..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <Select value={filtroPlan} onChange={(e) => { setFiltroPlan(e.target.value); setPaginaE(1) }} className="w-full sm:w-44 bg-white">
                <option value="">Todos los planes</option>
                {PLANES.map((p) => (
                  <option key={p} value={p}>{PLAN_LABEL[p]}</option>
                ))}
              </Select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold">Pro hasta</th>
                      <th className="px-4 py-3 font-semibold">Registro</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empresas.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{e.empresa || '—'}</p>
                          <p className="text-xs text-slate-400">{e.email || e.slug}</p>
                        </td>
                        <td className="px-4 py-3"><BadgePlan plan={e.plan} /></td>
                        <td className="px-4 py-3"><BadgeEstado disabled={e.disabled} esAdmin={e.role === 'super_admin'} /></td>
                        <td className="px-4 py-3 text-slate-600">{e.pro_until ? new Date(e.pro_until).toLocaleDateString('es-PE') : '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{e.created_at ? new Date(e.created_at).toLocaleDateString('es-PE') : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {e.slug && (
                              <a
                                href={`/f/${e.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                                title="Ver formulario"
                              >
                                <ExternalLink size={15} />
                              </a>
                            )}
                            <button
                              onClick={() => setEditando(e)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => toggleBlock(e)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                                e.disabled
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                  : 'text-red-700 bg-red-50 hover:bg-red-100'
                              }`}
                            >
                              {e.disabled ? <Unlock size={13} /> : <Ban size={13} />}
                              {e.disabled ? 'Desbloquear' : 'Bloquear'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {empresas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                          No se encontraron empresas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{fmtNum(totalEmpresas)} empresa(s)</span>
              <div className="flex gap-2">
                <Button type="secondary" className="!px-4 !py-2 text-sm" disabled={paginaE <= 1} onClick={() => setPaginaE((p) => p - 1)}>
                  Anterior
                </Button>
                <span className="self-center">Pág {paginaE} / {totalPaginasE}</span>
                <Button type="secondary" className="!px-4 !py-2 text-sm" disabled={paginaE >= totalPaginasE} onClick={() => setPaginaE((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============ PLANES ============ */}
        {tab === 'planes' && planRows && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Máx. envíos</th>
                      <th className="px-4 py-3 font-semibold">Máx. métodos</th>
                      <th className="px-4 py-3 font-semibold">Máx. productos</th>
                      <th className="px-4 py-3 font-semibold">Máx. ventas</th>
                      <th className="px-4 py-3 font-semibold">Máx. export Shalom</th>
                      <th className="px-4 py-3 font-semibold">Máx. copiar</th>
                      <th className="px-4 py-3 font-semibold">Features</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {planRows.map((p) => (
                      <tr key={p.plan} className="align-top">
                        <td className="px-4 py-3 font-semibold text-slate-900 capitalize">{p.plan}</td>
                        {(['max_envios', 'max_metodos', 'max_productos', 'max_ventas', 'max_exportaciones_shalom', 'max_pedidos_copiar'] as const).map((campo) => (
                          <td key={campo} className="px-4 py-3">
                            <input
                              type="text"
                              value={p[campo] === null ? '' : String(p[campo])}
                              onChange={(e) => setCampoPlan(p.plan, campo, e.target.value)}
                              placeholder="Ilimit."
                              className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {([
                              ['form_branding', 'Marca blanca'],
                              ['dashboard_completo', 'Dashboard completo'],
                              ['envios_masivos', 'Envíos masivos'],
                              ['control_logistico', 'Control logístico'],
                            ] as const).map(([campo, label]) => (
                              <label key={campo} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!p[campo]}
                                  onChange={(e) => setCampoPlan(p.plan, campo, e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300"
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={guardarPlanes}>Guardar planes</Button>
            </div>
          </div>
        )}

        {/* ============ SHALOM ============ */}
        {tab === 'shalom' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Total agencias" value={shalomEstado ? fmtNum(shalomEstado.total) : '...'} />
              <Kpi label="Activas" value={shalomEstado ? fmtNum(shalomEstado.activas) : '...'} />
              <Kpi label="Inactivas" value={shalomEstado ? fmtNum(shalomEstado.inactivas) : '...'} />
              <Kpi label="Última sync" value={shalomEstado?.actualizada_en ? new Date(shalomEstado.actualizada_en).toLocaleDateString('es-PE') : '—'} sub={shalomEstado?.actualizada_en ? new Date(shalomEstado.actualizada_en).toLocaleTimeString('es-PE') : ''} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <p className="text-sm text-slate-600">
                Sincroniza la lista de agencias desde el endpoint oficial de Shalom. El cron semanal lo hace solo, pero puedes forzarlo aquí.
              </p>
              <Button onClick={sincronizar} disabled={sincronizando}>
                <span className="flex items-center gap-2">
                  <RefreshCw size={16} className={sincronizando ? 'animate-spin' : ''} />
                  {sincronizando ? 'Sincronizando...' : 'Sincronizar ahora'}
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* ============ AUDITORÍA ============ */}
        {tab === 'auditoria' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Fecha</th>
                      <th className="px-4 py-3 font-semibold">Admin</th>
                      <th className="px-4 py-3 font-semibold">Acción</th>
                      <th className="px-4 py-3 font-semibold">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditoria.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(a.created_at)}</td>
                        <td className="px-4 py-3 text-slate-600">{a.admin_email || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {a.accion}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{JSON.stringify(a.detalle)}</td>
                      </tr>
                    ))}
                    {auditoria.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-slate-400">Sin registros.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{fmtNum(totalAuditoria)} registro(s)</span>
              <div className="flex gap-2">
                <Button type="secondary" className="!px-4 !py-2 text-sm" disabled={paginaA <= 1} onClick={() => setPaginaA((p) => p - 1)}>
                  Anterior
                </Button>
                <span className="self-center">Pág {paginaA} / {totalPaginasA}</span>
                <Button type="secondary" className="!px-4 !py-2 text-sm" disabled={paginaA >= totalPaginasA} onClick={() => setPaginaA((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ MODAL EDITAR EMPRESA ============ */}
      <Modal open={!!editando} maxWidth="max-w-md">
        {editando && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Editar empresa</h3>
              <p className="text-sm text-slate-400">{editando.empresa || editando.slug}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Plan</label>
              <Select
                value={editando.plan}
                onChange={(e) => setEditando({ ...editando, plan: e.target.value })}
              >
                {PLANES.map((p) => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Pro hasta (fecha)</label>
              <input
                type="datetime-local"
                value={editando.pro_until ? new Date(editando.pro_until).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditando({ ...editando, pro_until: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Trial hasta (fecha)</label>
              <input
                type="datetime-local"
                value={editando.trial_end ? new Date(editando.trial_end).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditando({ ...editando, trial_end: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Rol</label>
              <Select
                value={editando.role}
                onChange={(e) => setEditando({ ...editando, role: e.target.value })}
              >
                <option value="user">Usuario</option>
                <option value="super_admin">Super admin</option>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="secondary" onClick={() => setEditando(null)}>Cancelar</Button>
              <Button onClick={guardarEdicion}>Guardar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
