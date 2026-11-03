import { NextResponse } from 'next/server'
import { clienteAuth } from '@/lib/authServidor'

export async function POST() {
  const supabase = await clienteAuth()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
