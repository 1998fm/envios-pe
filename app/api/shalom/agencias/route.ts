import { NextResponse } from 'next/server'
import { leerShalomPublico } from '@/lib/agenciasPublicas'
import agenciasFallback from '@/data/agencias-shalom.json'

export const dynamic = 'force-dynamic'

// Devuelve la lista de agencias Shalom para el autocomplete.
// Prioridad:
//   1) Tabla agencias_shalom (sincronizada con Shalom) si tiene datos.
//   2) JSON estático como respaldo automático si la tabla está vacía
//      o la consulta falla (el sistema nunca se queda sin lista).
// IMPORTANTE: solo se muestran agencias con `recibe = true`. Las agencias
// sin categoría de recepción (centros de acopio internos, terminales
// aeroportuarias, solo-envío, pendientes...) NO aceptan paquetes, por eso
// se ocultan del formulario.
export async function GET() {
  try {
    const etiquetas = await leerShalomPublico()
    if (etiquetas.length > 0) {
      return NextResponse.json(
        { origen: 'bd', agencias: etiquetas },
        {
          headers: {
            'Cache-Control': 's-maxage=60, stale-while-revalidate=3600',
          },
        }
      )
    }
  } catch (e) {
    console.error('[shalom/agencias] error leyendo BD:', e)
  }

  // Fallback al JSON estático (sin caída). El JSON ya viene filtrado.
  return NextResponse.json(
    { origen: 'fallback', agencias: agenciasFallback },
    {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=3600',
      },
    }
  )
}
