import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin, registrarAuditoria } from '@/lib/adminAuth'

type Body = {
  id?: string
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const targetId = body.id
  if (!targetId) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  }

  // No permitir que un admin se revoque a sí mismo (evita quedarse sin admins).
  if (targetId === auth.userId) {
    return NextResponse.json({ error: 'No puedes revocarte tu propio acceso de admin.' }, { status: 400 })
  }

  const { data: target, error: errTarget } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa, role')
    .eq('id', targetId)
    .eq('role', 'super_admin')
    .maybeSingle()

  if (errTarget) {
    return NextResponse.json({ error: errTarget.message }, { status: 500 })
  }
  if (!target) {
    return NextResponse.json({ error: 'El usuario no es super admin o no existe.' }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'user' })
    .eq('id', targetId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await registrarAuditoria(auth, 'revocar_admin', { targetId, empresa: target.empresa })

  return NextResponse.json({ ok: true })
}