import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireOwner } from '@/lib/ownerAuth'
import { esTablaFaltante } from '@/lib/roles'
import { crearInvitacion, linkDeInvitacion, renovarLink } from '@/lib/invitaciones'

// ============================================================
// INVITACIONES PENDIENTES
//
// El dueño invita a alguien que todavía no tiene cuenta: se genera
// un link y lo comparte a mano (WhatsApp, etc.). No hay correos, así
// no dependen del SMTP ni de los límites de envío de Supabase.
// ============================================================

function originDe(request: Request) {
  const url = new URL(request.url)
  return url.origin
}

export async function GET(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await supabaseAdmin
    .from('business_invites')
    .select('id, email, role_id, token, estado, creado_en, expira_en')
    .eq('owner_id', auth.userId)
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false })

  if (error) {
    const status = esTablaFaltante(error) ? 409 : 400
    return NextResponse.json({ error: error.message }, { status })
  }

  const origin = originDe(request)
  const invitaciones = (data ?? []).map((i) => ({
    ...i,
    link: linkDeInvitacion(i.token, origin),
  }))

  return NextResponse.json({ invitaciones })
}

// Crear invitación (devuelve el link para compartir)
export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const roleId = typeof body?.role_id === 'string' ? body.role_id : ''

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Escribe un correo válido' }, { status: 400 })
  }
  if (!roleId) {
    return NextResponse.json({ error: 'Elige un rol' }, { status: 400 })
  }

  const { data: rol } = await supabaseAdmin
    .from('business_roles')
    .select('id')
    .eq('id', roleId)
    .eq('owner_id', auth.userId)
    .maybeSingle()

  if (!rol) {
    return NextResponse.json({ error: 'El rol no existe' }, { status: 404 })
  }

  try {
    const resultado = await crearInvitacion(
      auth.userId,
      email,
      roleId,
      originDe(request)
    )
    return NextResponse.json(resultado)
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo crear la invitación'
    const status = esTablaFaltante({ message: mensaje }) ? 409 : 400
    return NextResponse.json({ error: mensaje }, { status })
  }
}

// Genera un link nuevo (invalida el anterior)
export async function PATCH(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''

  if (!id) {
    return NextResponse.json({ error: 'id de invitación requerido' }, { status: 400 })
  }

  const { data: invitacion } = await supabaseAdmin
    .from('business_invites')
    .select('*')
    .eq('id', id)
    .eq('owner_id', auth.userId)
    .maybeSingle()

  if (!invitacion) {
    return NextResponse.json({ error: 'La invitación no existe' }, { status: 404 })
  }

  try {
    const resultado = await renovarLink(invitacion, originDe(request))
    return NextResponse.json(resultado)
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo generar el link'
    const status = esTablaFaltante({ message: mensaje }) ? 409 : 400
    return NextResponse.json({ error: mensaje }, { status })
  }
}

// Cancelar una invitación
export async function DELETE(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const id = body?.id ?? new URL(request.url).searchParams.get('id')

  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'id de invitación requerido' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('business_invites')
    .delete()
    .eq('id', id)
    .eq('owner_id', auth.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
