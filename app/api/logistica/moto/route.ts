import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { validarHoraCorte } from '@/lib/logistica/validarHoraCorte'

const DIAS_SEMANA = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

async function contarEnviosDelDia(userId: string, fecha: string): Promise<number> {
  const inicio = new Date(fecha + 'T00:00:00.000Z').toISOString()
  const fin = new Date(fecha + 'T23:59:59.999Z').toISOString()
  const { count } = await supabaseAdmin
    .from('envios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('fecha_programada', inicio)
    .lt('fecha_programada', fin)
  return count ?? 0
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  const { data: perfil, error } = await supabaseAdmin
    .from('profiles')
    .select('logistica_moto_dias, logistica_moto_usa_hora_corte, logistica_moto_hora_corte, logistica_moto_limitar, logistica_moto_cupo')
    .eq('id', userId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const diasDisponibles: string[] = perfil?.logistica_moto_dias ?? ['MONDAY']
  const usaHora = perfil?.logistica_moto_usa_hora_corte ?? false
  const horaCorte = perfil?.logistica_moto_hora_corte ?? '18:00'
  const limitar = perfil?.logistica_moto_limitar ?? false
  const cupo = perfil?.logistica_moto_cupo ?? 0

  // Normalizar a Perú y determinar offset según hora de corte
  const peruStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  const [y, m, d] = peruStr.split('-').map(Number)
  const hoyPeru = new Date(y, m - 1, d, 12, 0, 0, 0)

  const offset = usaHora && validarHoraCorte(horaCorte) ? 2 : 1

  const fechasDisponibles: string[] = []
  const candidata = new Date(hoyPeru)
  candidata.setDate(candidata.getDate() + offset)

  while (fechasDisponibles.length < 3) {
    const nombreDia = DIAS_SEMANA[candidata.getDay()]
    if (diasDisponibles.includes(nombreDia)) {
      const fechaStr = candidata.toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
      const count = limitar ? await contarEnviosDelDia(userId, fechaStr) : 0
      if (!limitar || count < cupo) {
        fechasDisponibles.push(fechaStr)
      }
    }
    candidata.setDate(candidata.getDate() + 1)
  }

  return NextResponse.json({ fechasDisponibles })
}
