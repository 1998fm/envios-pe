import { NextResponse } from 'next/server'
import { leerOlvaPublico } from '@/lib/agenciasPublicas'
import agenciasFallback from '@/data/agencias-olva.json'

export const dynamic = 'force-dynamic'

// Devuelve la lista de tiendas/agencias Olva para el selector del formulario.
// Prioridad:
//   1) Tabla agencias_olva (sincronizada con Olva) si tiene datos.
//   2) JSON estático como respaldo automático si la tabla está vacía
//      o la consulta falla (el sistema nunca se queda sin lista).
export async function GET() {
  try {
    const data = await leerOlvaPublico()
    if (data.length > 0) {
      return NextResponse.json(
        { origen: 'bd', agencias: data },
        {
          headers: {
            'Cache-Control': 's-maxage=60, stale-while-revalidate=3600',
          },
        }
      )
    }
  } catch (e) {
    console.error('[olva/agencias] error leyendo BD:', e)
  }

  // Fallback al JSON estático (sin caída).
  return NextResponse.json(
    { origen: 'fallback', agencias: agenciasFallback },
    {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=3600',
      },
    }
  )
}