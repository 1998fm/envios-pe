import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { getSessionUser } from '@/lib/ownerAuth'
import { esTablaFaltante } from '@/lib/roles'

// ============================================================
// ACEPTAR INVITACIÓN
//
// El link /invitacion/<token> llega aquí. La persona todavía no es
// parte del negocio: se le crea (o recupera) la cuenta, se le crea su
// perfil y se le agrega al negocio con el rol que el dueño asignó.
//
// No requiere sesión previa: el token es la credencial.
// ============================================================

function slugUnico(base: string) {
  const limpio = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return limpio || 'negocio'
}

async function asegurarSlug(empresa: string) {
  const base = slugUnico(empresa)
  let slug = base
  let intentos = 0
  while (intentos < 20) {
    const { data: existente } = await supabaseAdmin
      .from('profiles')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()
    if (!existente) break
    intentos++
    slug = `${base}-${intentos}`
  }
  return slug
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? ''

  if (!token) {
    return NextResponse.json({ error: 'Falta el token' }, { status: 400 })
  }

  const { data: invitacion, error: inviteError } = await supabaseAdmin
    .from('business_invites')
    .select('email, role_id, owner_id, estado, expira_en')
    .eq('token', token)
    .maybeSingle()

  if (inviteError) {
    const status = esTablaFaltante(inviteError) ? 409 : 400
    return NextResponse.json(
      {
        error: esTablaFaltante(inviteError)
          ? 'Falta ejecutar supabase/roles-negocio.sql en Supabase'
          : inviteError.message,
      },
      { status }
    )
  }

  if (!invitacion) {
    return NextResponse.json(
      { error: 'Esta invitación no es válida' },
      { status: 404 }
    )
  }

  const { data: rol } = await supabaseAdmin
    .from('business_roles')
    .select('nombre')
    .eq('id', invitacion.role_id)
    .maybeSingle()

  const { data: dueno } = await supabaseAdmin
    .from('profiles')
    .select('empresa')
    .eq('id', invitacion.owner_id)
    .maybeSingle()

  const correo = invitacion.email
  const [nombre] = correo.split('@')

  return NextResponse.json({
    email: `${nombre.slice(0, 2)}***@${correo.split('@')[1] ?? ''}`,
    empresa: dueno?.empresa ?? 'un negocio',
    rol: rol?.nombre ?? null,
    expirada: new Date(invitacion.expira_en).getTime() < Date.now(),
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const empresa = typeof body?.empresa === 'string' ? body.empresa.trim() : ''

  if (!token) {
    return NextResponse.json({ error: 'Falta el token de invitación' }, { status: 400 })
  }

  const { data: invitacion, error: inviteError } = await supabaseAdmin
    .from('business_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (inviteError) {
    const status = esTablaFaltante(inviteError) ? 409 : 400
    return NextResponse.json(
      {
        error: esTablaFaltante(inviteError)
          ? 'Falta ejecutar supabase/roles-negocio.sql en Supabase'
          : inviteError.message,
      },
      { status }
    )
  }

  if (!invitacion) {
    return NextResponse.json(
      { error: 'Esta invitación no es válida' },
      { status: 404 }
    )
  }

  if (invitacion.estado === 'aceptado') {
    return NextResponse.json({ ok: true, yaAceptada: true, email: invitacion.email })
  }

  if (new Date(invitacion.expira_en).getTime() < Date.now()) {
    return NextResponse.json(
      { error: 'Esta invitación expiró. Pide al dueño que te la reenvíe.' },
      { status: 410 }
    )
  }

  // 1. Usuario de autenticación
  const sesion = await getSessionUser()
  let userId: string | null = null
  let requiereLogin = false

  if (sesion && (sesion.email ?? '').toLowerCase() === invitacion.email.toLowerCase()) {
    userId = sesion.id
    // Ya tiene cuenta (o llegó con sesión): solo se le fija la contraseña.
    if (password.length >= 6) {
      const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      })
      if (passError) {
        return NextResponse.json({ error: passError.message }, { status: 400 })
      }
    }
  } else if (password.length >= 6) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: invitacion.email,
      password,
      email_confirm: true,
    })
    if (error) {
      // Si ya tenía cuenta, se busca su id y seguirá con el login normal.
      if (/already|registered|exists/i.test(error.message)) {
        const { data: lista } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        })
        const encontrado = lista?.users?.find(
          (u) => (u.email ?? '').toLowerCase() === invitacion.email.toLowerCase()
        )
        if (!encontrado) {
          return NextResponse.json(
            { error: 'Esta cuenta ya existe. Inicia sesión con tu contraseña.' },
            { status: 409 }
          )
        }
        userId = encontrado.id
        requiereLogin = true
      } else {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    } else {
      userId = data.user.id
    }
  } else {
    return NextResponse.json(
      { error: 'Crea tu contraseña para completar la invitación' },
      { status: 400 }
    )
  }

  if (!userId) {
    return NextResponse.json({ error: 'No se pudo identificar al usuario' }, { status: 400 })
  }

  // 2. Perfil (si no existe)
  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!perfil) {
    const nombre = empresa || invitacion.email.split('@')[0] || 'Mi negocio'
    const slug = await asegurarSlug(nombre)
    const { error: perfilError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      empresa: nombre,
      slug,
      plan: 'basic',
    })
    if (perfilError) {
      return NextResponse.json({ error: perfilError.message }, { status: 400 })
    }
  }

  // 3. Membresía con el rol que eligió el dueño
  const { error: miembroError } = await supabaseAdmin
    .from('business_members')
    .upsert(
      {
        owner_id: invitacion.owner_id,
        user_id: userId,
        role_id: invitacion.role_id,
      },
      { onConflict: 'owner_id,user_id' }
    )

  if (miembroError) {
    return NextResponse.json({ error: miembroError.message }, { status: 400 })
  }

  // 4. Marcar la invitación como aceptada
  await supabaseAdmin
    .from('business_invites')
    .update({ estado: 'aceptado' })
    .eq('id', invitacion.id)

  return NextResponse.json({
    ok: true,
    email: invitacion.email,
    requiereLogin,
  })
}
