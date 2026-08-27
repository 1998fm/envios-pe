import agencias from '../data/agencias-shalom.json'

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
  aereo?: boolean
  origen?: boolean
  destino?: boolean
  estado?: string
  ter_id?: number
  zona?: string
  provincia?: string
  departamento?: string
  categoria?: string
}

export function obtenerAgenciasShalom(): AgenciaShalom[] {
  return agencias as AgenciaShalom[]
}
