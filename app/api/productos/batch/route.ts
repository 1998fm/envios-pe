import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

// Archiva o restaura varios productos a la vez (selección múltiple).
export async function PATCH(request: Request) {
  const body = await request.json()
  const ids = body?.ids
  const archivado = body?.archivado

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    typeof archivado !== 'boolean'
  ) {
    return NextResponse.json({ error: 'ids y archivado son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('productos')
    .update({ archivado, updated_at: new Date().toISOString() })
    .in('id', ids)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}