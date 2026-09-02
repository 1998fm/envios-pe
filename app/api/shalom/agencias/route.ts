import { NextResponse } from 'next/server'
import { supabaseServer } from 'app/f/[slug]/lib/supabase/server'
import agenciasFallback from '@/data/agencias-shalom.json'

export const dynamic = 'force-dynamic'

// Devuelve la lista de agencias Shalom para el autocomplete.
// Prioridad:
//   1) Tabla agencias_shalom (sincronizada con Shalom) si tiene datos.
//   2) JSON estático como respaldo automático si la tabla está vacía
//      o la consulta falla (el sistema nunca se queda sin lista).
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('agencias_shalom')
      .select('etiqueta')
      .eq('activa', true)
      .order('etiqueta', { ascending: true })

    if (!error && Array.isArray(data) && data.length > 0) {
      const etiquetas = data.map((r) => r.etiqueta).filter(Boolean)
      return NextResponse.json(
        { origen: 'bd', agencias: etiquetas },
        {
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          },
        }
      )
    }
  } catch (e) {
    console.error('[shalom/agencias] error leyendo BD:', e)
  }

  // Fallback al JSON estático (sin caída).
  return NextResponse.json(
    { origen: 'fallback', agencias: agenciasFallback },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
