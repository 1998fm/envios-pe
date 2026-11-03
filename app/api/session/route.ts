import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { getSessionUser } from '@/lib/ownerAuth'
import { resolverNegocioActual } from '@/lib/rolesClient'
import { conImagenesProxy } from '@/lib/mediaUrl'

// Quién soy y de qué negocio es lo que veo. Reemplaza las consultas que el
// navegador hacía directo a la base (perfil, tarifas, rol).
export async function GET() {
  const sesion = await getSessionUser()
  if (!sesion) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const negocio = await resolverNegocioActual(supabaseAdmin, sesion.id)

  // Un dueño sin perfil todavía (primer ingreso) lo recibe aquí, con los valores
  // por defecto de la base (plan básico, sin vigencias).
  if (negocio.esOwner) {
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: sesion.id }, { onConflict: 'id', ignoreDuplicates: true })
  }

  const [{ data: perfil }, { data: tarifas }] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', negocio.ownerId).maybeSingle(),
    supabaseAdmin.from('tarifas_moto').select('tarifas').eq('profile_id', negocio.ownerId).maybeSingle(),
  ])

  if (perfil?.disabled && negocio.esOwner) {
    return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 })
  }

  return NextResponse.json({
    user: { id: sesion.id, email: sesion.email ?? null },
    negocio,
    profile: perfil ? conImagenesProxy(perfil, ['logo_url', 'redirect_message_image']) : null,
    tarifas: tarifas?.tarifas ?? {},
  })
}
