import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { buscarUsuarioPorEmail, requireOwner } from '@/lib/ownerAuth'
import { esTablaFaltante } from '@/lib/roles'
import { crearInvitacion } from '@/lib/invitaciones'
import { checkRolesLimit } from '@/lib/planLimits'

// ============================================================
// Miembros del negocio: qué usuarios tienen acceso y con qué rol.
// ============================================================

// Agrega un usuario al negocio por email.
export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // Validar límite de miembros del plan
  const limitCheck = await checkRolesLimit(auth.userId)
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const roleId = typeof body?.role_id === 'string' ? body.role_id : ''

  if (!email || !roleId) {
    return NextResponse.json(
      { error: 'email y role_id son obligatorios' },
      { status: 400 }
    )
  }

  // El rol debe pertenecer al negocio del dueño.
  const { data: rol, error: rolError } = await supabaseAdmin
    .from('business_roles')
    .select('id')
    .eq('id', roleId)
    .eq('owner_id', auth.userId)
    .maybeSingle()

  if (rolError) {
    const status = esTablaFaltante(rolError) ? 409 : 400
    return NextResponse.json(
      {
        error: esTablaFaltante(rolError)
          ? 'Falta ejecutar supabase/roles-negocio.sql en Supabase'
          : rolError.message,
      },
      { status }
    )
  }

  if (!rol) {
    return NextResponse.json({ error: 'El rol no existe' }, { status: 404 })
  }

  const usuario = await buscarUsuarioPorEmail(email)
  const origen = new URL(request.url).origin

  // Si la persona todavía no tiene cuenta, se genera un link de
  // invitación: lo abre, crea su contraseña y entra con el rol asignado.
  if (!usuario) {
    try {
      const resultado = await crearInvitacion(auth.userId, email, roleId, origen)
      return NextResponse.json({ ok: true, ...resultado })
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'No se pudo crear la invitación'
      const status = esTablaFaltante({ message: mensaje }) ? 409 : 400
      return NextResponse.json({ error: mensaje }, { status })
    }
  }

  if (usuario.id === auth.userId) {
    return NextResponse.json(
      { error: 'Eres el dueño: no te agregues como miembro' },
      { status: 400 }
    )
  }

  // El usuario debe tener perfil (se crea al registrarse en la app).
  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', usuario.id)
    .maybeSingle()

  if (!perfil) {
    // Tiene cuenta pero nunca entró a la app: se le genera un link para
    // que cree su perfil y su contraseña.
    try {
      const resultado = await crearInvitacion(auth.userId, email, roleId, origen)
      return NextResponse.json({ ok: true, ...resultado })
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'No se pudo crear la invitación'
      const status = esTablaFaltante({ message: mensaje }) ? 409 : 400
      return NextResponse.json({ error: mensaje }, { status })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('business_members')
    .upsert(
      { owner_id: auth.userId, user_id: usuario.id, role_id: roleId },
      { onConflict: 'owner_id,user_id' }
    )
    .select('user_id, role_id')
    .single()

  if (error) {
    const status = esTablaFaltante(error) ? 409 : 400
    return NextResponse.json(
      {
        error: esTablaFaltante(error)
          ? 'Falta ejecutar supabase/roles-negocio.sql en Supabase'
          : error.message,
      },
      { status }
    )
  }

  return NextResponse.json({ member: data, email: usuario.email })
}

// Cambia el rol de un miembro.
export async function PATCH(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const userId = typeof body?.user_id === 'string' ? body.user_id : ''
  const roleId = typeof body?.role_id === 'string' ? body.role_id : ''

  if (!userId || !roleId) {
    return NextResponse.json(
      { error: 'user_id y role_id son obligatorios' },
      { status: 400 }
    )
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

  const { data, error } = await supabaseAdmin
    .from('business_members')
    .update({ role_id: roleId })
    .eq('owner_id', auth.userId)
    .eq('user_id', userId)
    .select('user_id, role_id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ member: data })
}

// Quita a un miembro del negocio.
export async function DELETE(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const userId = body?.user_id ?? new URL(request.url).searchParams.get('user_id')

  if (typeof userId !== 'string' || !userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('business_members')
    .delete()
    .eq('owner_id', auth.userId)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
