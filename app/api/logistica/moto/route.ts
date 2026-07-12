import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

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

function calcularProximasFechas(dias: string[], limite = 3): Date[] {
  const fechas: Date[] = []
  const candidata = new Date()
  candidata.setDate(candidata.getDate() + 1)
  while (fechas.length < limite) {
    const nombreDia = DIAS_SEMANA[candidata.getDay()]
    if (dias.includes(nombreDia)) {
      fechas.push(new Date(candidata))
    }
    candidata.setDate(candidata.getDate() + 1)
  }
  return fechas
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  const { data: perfil, error } = await supabaseAdmin
    .from('profiles')
    .select('logistica_moto_dias, logistica_moto_limitar, logistica_moto_cupo')
    .eq('id', userId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const diasDisponibles: string[] = perfil?.logistica_moto_dias ?? ['MONDAY']
  const limitar = perfil?.logistica_moto_limitar ?? false
  const cupo = perfil?.logistica_moto_cupo ?? 0

  // Calcular fechas respetando cupo diario
  const fechasDisponibles: string[] = []
  const candidata = new Date()
  candidata.setDate(candidata.getDate() + 1)

  while (fechasDisponibles.length < 3) {
    const nombreDia = DIAS_SEMANA[candidata.getDay()]
    if (diasDisponibles.includes(nombreDia)) {
      const fechaStr = candidata.toISOString().split('T')[0]
      const count = limitar ? await contarEnviosDelDia(userId, fechaStr) : 0
      if (!limitar || count < cupo) {
        fechasDisponibles.push(fechaStr)
      }
    }
    candidata.setDate(candidata.getDate() + 1)
  }

  return NextResponse.json({ fechasDisponibles })
}
