import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin, registrarAuditoria } from '@/lib/adminAuth'

type Body = {
  plan?: string
  trial_end?: string | null
  pro_until?: string | null
  role?: string
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}

  const planesValidos = ['basic', 'pro', 'business_plus']
  if (body.plan !== undefined) {
    if (!planesValidos.includes(body.plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }
    update.plan = body.plan
  }

  if (body.role !== undefined) {
    if (!['user', 'super_admin'].includes(body.role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }
    update.role = body.role
  }

  // Fechas: aceptar null (limpiar) o string ISO válido.
  for (const campo of ['trial_end', 'pro_until'] as const) {
    if (body[campo] !== undefined) {
      const v = body[campo]
      if (v === null) {
        update[campo] = null
      } else if (typeof v === 'string' && !isNaN(Date.parse(v))) {
        update[campo] = v
      } else {
        return NextResponse.json({ error: `${campo} inválido` }, { status: 400 })
      }
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select('id, empresa, slug')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
  }

  await registrarAuditoria(auth, 'editar_empresa', { empresaId: id, cambios: update })

  return NextResponse.json({ ok: true, empresa: data })
}
