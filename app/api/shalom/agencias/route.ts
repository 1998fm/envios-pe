import { NextResponse } from 'next/server'
import { leerAgenciasShalom } from '@/lib/cacheServidor'

// Lista de agencias Shalom. Se sincroniza una vez por semana, así que el servidor
// la lee de la base solo cuando cambia (caché de datos, se invalida al
// sincronizar) y el navegador/CDN la reutilizan un día. Si la tabla está vacía
// o falla, se sirve el JSON empaquetado como respaldo.
export async function GET() {
  const datos = await leerAgenciasShalom()
  return NextResponse.json(datos, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
