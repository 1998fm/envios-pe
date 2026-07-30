export const UNIDADES_MEDIDA = [
  'unidad',
  'kg',
  'g',
  'L',
  'ml',
  'm',
  'cm',
  'par',
  'docena',
  'caja',
  'paquete',
  'bolsa',
  'botella',
  'lata',
  'tarro',
  'rollo',
  'pliego',
] as const

export type Venta = {
  id: string
  profile_id: string
  persona_id: string
  persona_nombre: string
  persona_dni: string
  total: number
  estado: 'COMPLETADA' | 'ANULADA'
  estado_envio: 'PENDIENTE' | 'EMPACADO' | 'ENVIADO' | 'ENTREGADO'
  envio_id: string | null
  created_at: string
  updated_at: string
  items?: VentaItem[]
}

export type EnvioItem = {
  id: string
  envio_id: string
  venta_item_id: string
  cantidad: number
  created_at: string
}

export const ENVIO_TO_VENTA_ESTADO: Record<string, Venta['estado_envio']> = {
  NO_EMPACADO: 'PENDIENTE',
  EMPACADO: 'EMPACADO',
  ENVIADO: 'ENVIADO',
  ENTREGADO: 'ENTREGADO',
}

export type VentaItem = {
  id: string
  venta_id: string
  producto_id: string | null
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export type Compra = {
  id: string
  profile_id: string
  proveedor: string
  total: number
  estado: 'COMPLETADA' | 'ANULADA'
  created_at: string
  updated_at: string
  items?: CompraItem[]
}

export type CompraItem = {
  id: string
  compra_id: string
  producto_id: string | null
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export type Producto = {
  id: string
  profile_id: string
  nombre: string
  sku?: string | null
  descripcion?: string | null
  precio_venta: number
  precio_compra: number
  stock_actual: number
  stock_minimo: number
  unidad: string
  created_at: string
  updated_at: string
}
