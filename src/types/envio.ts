export type Envio = {
  id: string
  codigo?: string | null
  user_id: string
  nombre: string
  dni: string
  telefono: string
  metodo: string
  nombre_metodo?: string | null
  tipo_entrega?: 'AGENCIA' | 'DOMICILIO' | null
  destino: string
  direccion: string
  referencia?: string
  detalle: string
  observaciones?: string | null
  cantidad_productos?: number | null
  tamano?: string
  estado: 'NO_EMPACADO' | 'EMPACADO' | 'ENVIADO' | 'EN_OBSERVACION'
  fecha_registro: string
  fecha_programada: string
  created_at?: string
}
