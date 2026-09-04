import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin, registrarAuditoria } from '@/lib/adminAuth'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

function generarPassword(longitud = 10): string {
  let out = ''
  const arr = new Uint32Array(longitud)
  crypto.getRandomValues(arr)
  for (let i = 0; i < longitud; i++) {
    out += CHARS[arr[i] % CHARS.length]
  }
  return out
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  // Verificar que el usuario exista.
  const { data: user } = await supabaseAdmin.auth.admin.getUserById(id)
  if (!user?.user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const password = generarPassword()

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    password,
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa')
    .eq('id', id)
    .maybeSingle()

  await registrarAuditoria(auth, 'reset_password', { empresaId: id, empresa: perfil?.empresa })

  return NextResponse.json({ ok: true, password })
}