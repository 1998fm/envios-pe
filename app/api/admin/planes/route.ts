import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin, registrarAuditoria } from '@/lib/adminAuth'

// Campos editables de cada plan (límites y features booleanos; NO precios).
export const CAMPOS_PLAN = [
  'max_envios',
  'max_metodos',
  'max_productos',
  'max_ventas',
  'max_exportaciones_shalom',
  'max_pedidos_copiar',
  'form_branding',
  'dashboard_completo',
  'envios_masivos',
  'control_logistico',
] as const

const BOOLEANOS = new Set(['form_branding', 'dashboard_completo', 'envios_masivos', 'control_logistico'])

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await supabaseAdmin.from('plan_features').select('*').order('plan')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ planes: data })
}

export async function PUT(request: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: Record<string, Record<string, unknown>>
  try {
    body = (await request.json()) as Record<string, Record<string, unknown>>
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const cambios: { plan: string; valores: Record<string, unknown> }[] = []
  const cambiosAuditoria: Record<string, unknown> = {}

  for (const [plan, valores] of Object.entries(body)) {
    if (!['basic', 'pro', 'business_plus'].includes(plan)) continue
    const limpio: Record<string, unknown> = {}

    for (const campo of CAMPOS_PLAN) {
      if (valores[campo] === undefined) continue
      const v = valores[campo]
      if (BOOLEANOS.has(campo)) {
        limpio[campo] = v === true
      } else if (v === null || v === '' || v === 'null' || v === 'Ilimitados' || v === 'Ilimitado') {
        limpio[campo] = null
      } else {
        const n = Number(v)
        limpio[campo] = Number.isFinite(n) ? n : null
      }
    }

    if (Object.keys(limpio).length > 0) {
      cambios.push({ plan, valores: limpio })
      cambiosAuditoria[plan] = limpio
    }
  }

  if (cambios.length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  for (const c of cambios) {
    const { error } = await supabaseAdmin.from('plan_features').update(c.valores).eq('plan', c.plan)
    if (error) {
      return NextResponse.json({ error: `Error en ${c.plan}: ${error.message}` }, { status: 500 })
    }
  }

  await registrarAuditoria(auth, 'editar_planes', cambiosAuditoria)

  const { data } = await supabaseAdmin.from('plan_features').select('*').order('plan')
  return NextResponse.json({ ok: true, planes: data })
}
