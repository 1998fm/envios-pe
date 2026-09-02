import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin, registrarAuditoria } from '@/lib/adminAuth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  let blocked: boolean
  try {
    const body = (await request.json()) as { blocked?: boolean }
    blocked = !!body.blocked
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  // Verificar que la empresa existe primero.
  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa, slug')
    .eq('id', id)
    .maybeSingle()

  if (perfilError) {
    return NextResponse.json({ error: perfilError.message }, { status: 500 })
  }
  if (!perfil) {
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
  }

  // No permitir bloquear al propio admin.
  if (id === auth.userId && blocked) {
    return NextResponse.json({ error: 'No puedes bloquear tu propia cuenta' }, { status: 400 })
  }

  // Actualizar la marca en profiles.
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ disabled: blocked })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Bloquear/desbloquear el login en Supabase Auth (impedir/habilitar sesión).
  // ban_duration 'none' = nunca / sin baneo; otro valor = baneado ese lapso.
  let authError: string | null = null
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: blocked ? '30d' : 'none',
    })
    authError = error?.message ?? null
  } catch (e) {
    authError = e instanceof Error ? e.message : 'Error de auth'
  }

  await registrarAuditoria(auth, blocked ? 'bloquear_empresa' : 'desbloquear_empresa', {
    empresaId: id,
    empresa: perfil.empresa,
    slug: perfil.slug,
    authError,
  })

  if (authError) {
    return NextResponse.json(
      { ok: true, aviso: `Cuenta marcada pero hubo error de auth: ${authError}`, blocked },
      { status: 200 }
    )
  }

  return NextResponse.json({ ok: true, blocked })
}
