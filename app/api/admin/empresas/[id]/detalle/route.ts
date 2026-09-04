import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/adminAuth'
import { computeEffectivePlan } from '@/lib/planGating'

const DIAS_SERIE = 14

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  // Perfil de la empresa.
  const { data: perfil, error: errPerfil } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa, slug, plan, trial_end, pro_until, disabled, role, created_at')
    .eq('id', id)
    .maybeSingle()

  if (errPerfil) {
    return NextResponse.json({ error: errPerfil.message }, { status: 500 })
  }
  if (!perfil) {
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
  }

  // Email del usuario.
  let email = ''
  try {
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(id)
    email = user?.user?.email ?? ''
  } catch {
    email = ''
  }

  const eff = computeEffectivePlan(perfil)

  // Totales históricos por tabla.
  const [envios, ventas, gastos, compras, productos] = await Promise.all([
    supabaseAdmin.from('envios').select('id, fecha_registro, estado').eq('user_id', id),
    supabaseAdmin.from('ventas').select('total, estado, created_at').eq('profile_id', id),
    supabaseAdmin.from('gastos').select('monto, created_at').eq('profile_id', id),
    supabaseAdmin.from('compras').select('id, total, created_at').eq('profile_id', id),
    supabaseAdmin.from('productos').select('id').eq('profile_id', id),
  ])

  const listaEnvios = envios.data ?? []
  const listaVentas = ventas.data ?? []
  const listaGastos = gastos.data ?? []
  const listaCompras = compras.data ?? []
  const listaProductos = productos.data ?? []

  const totalEnvios = listaEnvios.length
  const totalVentas = listaVentas.length
  const totalGastos = listaGastos.length
  const totalCompras = listaCompras.length
  const totalProductos = listaProductos.length

  const sumaMoney = (arr: { total?: number | null | string }[], campo: 'total'): number =>
    arr.reduce((acc, r) => acc + (Number(r[campo]) || 0), 0)
  const sumaMontos = (arr: { monto?: number | null | string }[]): number =>
    arr.reduce((acc, r) => acc + (Number(r.monto) || 0), 0)

  const montoVentas = sumaMoney(listaVentas, 'total')
  const montoCompras = sumaMoney(listaCompras, 'total')
  const montoGastos = sumaMontos(listaGastos)

  // Última actividad (máximo de todas las fechas).
  const fechas: (string | null)[] = [
    ...listaEnvios.map((e) => e.fecha_registro),
    ...listaVentas.map((v) => v.created_at),
    ...listaGastos.map((g) => g.created_at),
    ...listaCompras.map((c) => c.created_at),
  ]
  const ultimaActividad = fechas.filter(Boolean).sort().pop() ?? null

  // Envíos por estado.
  const porEstado: Record<string, number> = {}
  listaEnvios.forEach((e) => {
    const k = e.estado || 'SIN_ESTADO'
    porEstado[k] = (porEstado[k] ?? 0) + 1
  })

  // Serie de actividad (últimos DIAS_SERIE días).
  const now = new Date()
  const inicio = new Date(now)
  inicio.setDate(inicio.getDate() - (DIAS_SERIE - 1))
  inicio.setHours(0, 0, 0, 0)

  const serie: { dia: string; envios: number; ventas: number }[] = []
  for (let i = 0; i < DIAS_SERIE; i++) {
    const d = new Date(inicio)
    d.setDate(d.getDate() + i)
    serie.push({ dia: d.toISOString().slice(0, 10), envios: 0, ventas: 0 })
  }
  const keyDia = (iso?: string | null) => iso?.slice(0, 10)

  ;(listaEnvios ?? []).forEach((e) => {
    const k = keyDia(e.fecha_registro)
    const slot = serie.find((s) => s.dia === k)
    if (slot) slot.envios++
  })
  ;(listaVentas ?? []).forEach((v) => {
    const k = keyDia(v.created_at)
    const slot = serie.find((s) => s.dia === k)
    if (slot) slot.ventas++
  })

  // Últimos 8 envíos recientes.
  const enviosRecientes = listaEnvios
    .slice()
    .sort((a, b) => (b.fecha_registro ?? '').localeCompare(a.fecha_registro ?? ''))
    .slice(0, 8)
    .map((e) => ({ id: e.id, estado: e.estado, fecha_registro: e.fecha_registro }))

  return NextResponse.json({
    id: perfil.id,
    empresa: perfil.empresa ?? '',
    slug: perfil.slug ?? '',
    email,
    plan: eff.plan,
    isTrial: eff.isTrial,
    diasRestantes: eff.diasRestantes,
    planDeclarado: perfil.plan,
    trial_end: perfil.trial_end,
    pro_until: perfil.pro_until,
    disabled: !!perfil.disabled,
    role: perfil.role ?? 'user',
    created_at: perfil.created_at,
    metricas: {
      totalEnvios,
      totalVentas,
      totalGastos,
      totalCompras,
      totalProductos,
      montoVentas: Math.round(montoVentas * 100) / 100,
      montoCompras: Math.round(montoCompras * 100) / 100,
      montoGastos: Math.round(montoGastos * 100) / 100,
      utilidadEstimada: Math.round((montoVentas - montoCompras - montoGastos) * 100) / 100,
      ultimaActividad,
      porEstado,
    },
    serie,
    enviosRecientes,
  })
}