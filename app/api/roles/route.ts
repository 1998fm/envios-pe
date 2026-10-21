import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireOwner } from '@/lib/ownerAuth'
import { esTablaFaltante, esVistaValida, normalizarPermisos } from '@/lib/roles'
import { checkRolesLimit } from '@/lib/planLimits'

// ============================================================
// Roles del negocio del usuario autenticado.
// El owner_id SIEMPRE es el id del usuario autenticado: el cliente
// nunca puede administrar los roles de otro negocio.
// ============================================================

export async function GET() {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from('business_roles')
    .select('id, nombre, vista_default, permisos, creado_en')
    .eq('owner_id', auth.userId)
    .order('creado_en', { ascending: true })

  if (rolesError) {
    const status = esTablaFaltante(rolesError) ? 409 : 400
    return NextResponse.json(
      {
        error: esTablaFaltante(rolesError)
          ? 'Falta ejecutar supabase/roles-negocio.sql en Supabase'
          : rolesError.message,
        code: rolesError.code,
      },
      { status }
    )
  }

  const { data: members, error: membersError } = await supabaseAdmin
    .from('business_members')
    .select('user_id, role_id, creado_en')
    .eq('owner_id', auth.userId)

  if (membersError) {
    const status = esTablaFaltante(membersError) ? 409 : 400
    return NextResponse.json(
      {
        error: esTablaFaltante(membersError)
          ? 'Falta ejecutar supabase/roles-negocio.sql en Supabase'
          : membersError.message,
        code: membersError.code,
      },
      { status }
    )
  }

  const lista = members ?? []
  const membersDetallados = await Promise.all(
    lista.map(async (m) => {
      const [authRes, profileRes] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(m.user_id),
        supabaseAdmin
          .from('profiles')
          .select('empresa, disabled')
          .eq('id', m.user_id)
          .maybeSingle(),
      ])
      return {
        user_id: m.user_id,
        role_id: m.role_id,
        email: authRes.data?.user?.email ?? null,
        empresa: profileRes.data?.empresa ?? null,
        disabled: profileRes.data?.disabled ?? false,
      }
    })
  )

  return NextResponse.json({ roles: roles ?? [], members: membersDetallados })
}

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // Validar límite de miembros/roles del plan
  const limitCheck = await checkRolesLimit(auth.userId)
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.nombre !== 'string' || !body.nombre.trim()) {
    return NextResponse.json({ error: 'El nombre del rol es obligatorio' }, { status: 400 })
  }

  const nombre = body.nombre.trim()
  const vista = esVistaValida(body.vista_default) ? body.vista_default : 'resumen'
  const permisos = normalizarPermisos(body.permisos)

  const { data, error } = await supabaseAdmin
    .from('business_roles')
    .insert({ owner_id: auth.userId, nombre, vista_default: vista, permisos })
    .select('id, nombre, vista_default, permisos, creado_en')
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

  return NextResponse.json({ role: data })
}

export async function PATCH(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.id !== 'string') {
    return NextResponse.json({ error: 'id del rol requerido' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.nombre === 'string' && body.nombre.trim()) {
    updates.nombre = body.nombre.trim()
  }
  if (body.vista_default !== undefined) {
    updates.vista_default = esVistaValida(body.vista_default) ? body.vista_default : 'resumen'
  }
  if (body.permisos !== undefined) {
    updates.permisos = normalizarPermisos(body.permisos)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('business_roles')
    .update(updates)
    .eq('id', body.id)
    .eq('owner_id', auth.userId)
    .select('id, nombre, vista_default, permisos, creado_en')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ role: data })
}

export async function DELETE(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const id = body?.id ?? new URL(request.url).searchParams.get('id')
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'id del rol requerido' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('business_roles')
    .delete()
    .eq('id', id)
    .eq('owner_id', auth.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
