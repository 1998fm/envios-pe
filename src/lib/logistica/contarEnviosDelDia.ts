import type { SupabaseClient } from '@supabase/supabase-js'

export async function contarEnviosDelDia(
  supabase: SupabaseClient,
  userId: string,
  fecha: string,
) {
  const inicio = new Date(fecha + 'T00:00:00.000Z').toISOString()
  const fin = new Date(fecha + 'T23:59:59.999Z').toISOString()

  const { count, error } = await supabase
    .from('envios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('fecha_programada', inicio)
    .lt('fecha_programada', fin)

  if (error) throw error

  return count ?? 0
}