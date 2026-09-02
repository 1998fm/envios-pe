import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/adminAuth'

export async function GET(request: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('perPage') ?? 20)))

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, error, count } = await supabaseAdmin
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
  })
}
