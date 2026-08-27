const SHALOM_API_BASE = 'https://serviceapp2.shalomcontrol.com'

export interface AgenciaShalom {
  codigo: string
  nombre: string
  direccion: string
  telefono: string
  horario: string
  horario_domingo: string
  lat: number
  lng: number
  reparto: boolean
}

interface ShalomApiAgency {
  ter_abrebiatura: string
  nombre: string
  direccion: string
  telefono: string
  hora_atencion: string
  hora_domingo: string
  latitud: string
  longitud: string
  ter_reparto_habilitado: string
  web: number
}

let cache: { data: AgenciaShalom[]; ts: number } | null = null
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function obtenerAgenciasShalom(): Promise<AgenciaShalom[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.data

  const res = await fetch(`${SHALOM_API_BASE}/api/v1/web/agencias/listar`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 86400 },
  })

  if (!res.ok) throw new Error(`Shalom API ${res.status}`)

  const json = await res.json()
  if (!json.success || !json.data) throw new Error('Shalom API devolvió data null (rate limit)')

  const agencias: AgenciaShalom[] = (json.data as ShalomApiAgency[])
    .filter((a) => a.web === 1)
    .map((a) => ({
      codigo: a.ter_abrebiatura,
      nombre: a.nombre,
      direccion: a.direccion || '',
      telefono: a.telefono || '',
      horario: a.hora_atencion || '',
      horario_domingo: a.hora_domingo || '',
      lat: parseFloat(a.latitud) || 0,
      lng: parseFloat(a.longitud) || 0,
      reparto: a.ter_reparto_habilitado === '1',
    }))

  cache = { data: agencias, ts: Date.now() }
  return agencias
}
