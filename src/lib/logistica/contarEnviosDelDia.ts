import type { SupabaseClient } from '@supabase/supabase-js'

export async function contarEnviosDelDia(

  supabase: SupabaseClient,

  userId: string,

  fecha: string,

) {

  const { count, error } = await supabase

    .from('envios')

    .select('*', {

      count: 'exact',

      head: true,

    })

    .eq('user_id', userId)

    .eq('fecha_programada', fecha)

  if (error) {

    throw error

  }

  return count ?? 0

}