import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/adminAuth'

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data: admins, error } = await supabaseAdmin
    .from('profiles')
    .select('id, empresa, slug, role, created_at')
    .eq('role', 'super_admin')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let emails = new Map<string, string>()
  try {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (users?.users) emails = new Map(users.users.map((u) => [u.id, u.email ?? '']))
  } catch (e) {
    console.error('[admin] error listando usuarios (roles):', e)
  }

  const items = (admins ?? []).map((a) => ({
    id: a.id,
    empresa: a.empresa ?? '',
    slug: a.slug ?? '',
    email: emails.get(a.id) ?? '',
    esYo: a.id === auth.userId,
    created_at: a.created_at,
  }))

  return NextResponse.json({ items })
}