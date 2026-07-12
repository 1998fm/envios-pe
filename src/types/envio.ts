export type Envio = {
  id: string
  user_id: string
  nombre: string
  dni: string
  telefono: string
  metodo: string
  nombre_metodo?: string | null
  destino: string
  direccion: string
  referencia?: string
  detalle: string
  observaciones?: string
  tamano?: string
  estado: 'NO_EMPACADO' | 'EMPACADO' | 'ENVIADO'
  fecha_registro: string
  fecha_programada: string
  created_at?: string
}
