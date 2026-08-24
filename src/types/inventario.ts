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

export type MetodoPago = 'EFECTIVO' | 'YAPE_PLIN' | 'TARJETA'

export type Venta = {
  id: string
  profile_id: string
  persona_id: string
  persona_nombre: string
  persona_dni: string
  total: number
  estado: 'COMPLETADA' | 'ANULADA' | 'PENDIENTE'
  metodo_pago: MetodoPago
  estado_envio: 'PENDIENTE' | 'EMPACADO' | 'ENVIADO' | 'ENTREGADO' | 'COMPLETADO'
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
  ENVIADO: 'COMPLETADO',
  ENTREGADO: 'COMPLETADO',
}

export type VentaItem = {
  id: string
  venta_id: string
  producto_id: string | null
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  costo_unitario?: number
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

export const CATEGORIAS_GASTO = [
  'MATERIALES',
  'PASAJES',
  'DELIVERY',
  'PUBLICIDAD',
  'SERVICIOS',
  'OTROS',
] as const

export const CATEGORIA_GASTO_LABEL: Record<string, string> = {
  MATERIALES: 'Materiales',
  PASAJES: 'Pasajes',
  DELIVERY: 'Delivery',
  PUBLICIDAD: 'Publicidad',
  SERVICIOS: 'Servicios',
  OTROS: 'Otros',
}

export const CATEGORIA_GASTO_STYLE: Record<string, string> = {
  MATERIALES: 'bg-sky-100 text-sky-700',
  PASAJES: 'bg-amber-100 text-amber-700',
  DELIVERY: 'bg-indigo-100 text-indigo-700',
  PUBLICIDAD: 'bg-purple-100 text-purple-700',
  SERVICIOS: 'bg-emerald-100 text-emerald-700',
  OTROS: 'bg-slate-100 text-slate-600',
}

export type Gasto = {
  id: string
  profile_id: string
  categoria: string
  concepto: string
  monto: number
  fecha: string
  notas?: string | null
  created_at: string
  updated_at: string
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
  imagen_url?: string | null
  created_at: string
  updated_at: string
}
