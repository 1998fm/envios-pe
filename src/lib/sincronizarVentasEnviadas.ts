'use client'

import { createClient } from 'app/f/[slug]/lib/supabase/client'

export async function sincronizarVentasEnviadas(envioIds: string[]) {
  if (!envioIds.length) return
  const supabase = createClient()
  await supabase
    .from('ventas')
    .update({ estado_envio: 'COMPLETADO' })
    .in('envio_id', envioIds)
}
