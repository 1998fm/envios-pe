/**
 *PRESENTACION DE UNA VENTA
 * =========================================================================
 * Todo lo que es "cómo se ve" una venta vive acá, separado de la lógica de
 * negocio. Son funciones puras: reciben datos y devuelven texto y clases, sin
 * React ni estado. Eso permite verificar de un vistazo que ninguna etiqueta
 * vuelva a mostrar un valor crudo de la base como "COMPLETADA".
 */

import type { Venta, VentaItem } from '@/types/inventario'

const r2 = (n: number) => Math.round(n * 100) / 100

/* --------------------------------------------------------------------- */
/* Etiquetas y tonos                                                      */
/* --------------------------------------------------------------------- */

export type Tono = 'ok' | 'aviso' | 'malo' | 'neutro' | 'info'

/**
 * Clases de un badge. Se eligen por tono, no por valor, para que todas las
 * filas de la tabla se vean iguales: si el color dependiera del dato, la
 * tabla se volvería un mosaico.
 */
export const TONO_BADGE: Record<Tono, string> = {
  ok: 'bg-success-50 text-success-700 border-success-200',
  aviso: 'bg-warning-50 text-warning-700 border-warning-200',
  malo: 'bg-error-50 text-error-700 border-error-200',
  neutro: 'bg-slate-100 text-slate-600 border-slate-200',
  info: 'bg-tori-50 text-tori-700 border-tori-200',
}

export const TONO_PUNTO: Record<Tono, string> = {
  ok: 'bg-success-500',
  aviso: 'bg-warning-500',
  malo: 'bg-error-500',
  neutro: 'bg-slate-400',
  info: 'bg-tori-500',
}

/** Glifo por tono. Se usa en la tarjeta de móvil, donde no cabe un badge. */
export const TONO_ICONO: Record<Tono, string> = {
  ok: '✓',
  aviso: '⏳',
  malo: '✕',
  neutro: '•',
  info: 'ℹ',
}

const ETIQUETA_ESTADO: Record<string, string> = {
  COMPLETADA: 'Completada',
  PENDIENTE: 'Pendiente',
  ANULADA: 'Anulada',
}

const TONO_ESTADO: Record<string, Tono> = {
  COMPLETADA: 'ok',
  PENDIENTE: 'aviso',
  ANULADA: 'malo',
}

const ETIQUETA_ENVIO: Record<string, string> = {
  PENDIENTE: 'Sin enviar',
  NO_EMPACADO: 'Sin empacar',
  EMPACADO: 'Empacado',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  COMPLETADO: 'Completado',
}

const TONO_ENVIO: Record<string, Tono> = {
  PENDIENTE: 'neutro',
  NO_EMPACADO: 'neutro',
  EMPACADO: 'aviso',
  ENVIADO: 'info',
  ENTREGADO: 'ok',
  COMPLETADO: 'ok',
}

const ETIQUETA_PAGO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  YAPE_PLIN: 'Yape / Plin',
  TARJETA: 'Tarjeta',
}

const TONO_PAGO: Record<string, Tono> = {
  EFECTIVO: 'neutro',
  YAPE_PLIN: 'info',
  TARJETA: 'ok',
}

export const etiquetaEstado = (estado?: string | null) =>
  ETIQUETA_ESTADO[estado || ''] ?? 'Sin estado'
export const tonoEstado = (estado?: string | null): Tono => TONO_ESTADO[estado || ''] ?? 'neutro'

export const etiquetaEnvio = (estado?: string | null) =>
  ETIQUETA_ENVIO[estado || 'PENDIENTE'] ?? 'Sin enviar'
export const tonoEnvio = (estado?: string | null): Tono =>
  TONO_ENVIO[estado || 'PENDIENTE'] ?? 'neutro'

export const etiquetaPago = (metodo?: string | null) =>
  ETIQUETA_PAGO[metodo || 'EFECTIVO'] ?? 'Otro'
export const tonoPago = (metodo?: string | null): Tono => TONO_PAGO[metodo || 'EFECTIVO'] ?? 'neutro'

/** Los tres chips de filtro, en el orden en que un vendedor los necesita. */
export const FILTROS = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'COMPLETADA', etiqueta: 'Completadas' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'ANULADA', etiqueta: 'Anuladas' },
] as const

/* --------------------------------------------------------------------- */
/* Cálculos por venta                                                     */
/* --------------------------------------------------------------------- */

export type ResumenVenta = {
  unidades: number
  items: number
  /** Costo de lo vendido, según el costo congelado al momento de la venta. */
  costo: number
  ganancia: number
  pctGanancia: number
  /** Lo que falta cobrar. 0 si está pagada o anulada. */
  debe: number
  pagado: boolean
}

export function resumenVenta(venta: Pick<Venta, 'items' | 'total' | 'estado' | 'monto_pagado'>): ResumenVenta {
  const items = venta.items ?? []
  const costo = r2(items.reduce((s, it) => s + (it.costo_unitario ?? 0) * it.cantidad, 0))
  const unidades = items.reduce((s, it) => s + it.cantidad, 0)
  const ganancia = r2(venta.total - costo)
  const pagado = venta.estado === 'COMPLETADA' || (venta.monto_pagado ?? 0) >= venta.total
  const debe = venta.estado === 'ANULADA' || pagado ? 0 : r2(venta.total - (venta.monto_pagado ?? 0))

  return {
    unidades,
    items: items.length,
    costo,
    ganancia,
    pctGanancia: venta.total > 0 ? (ganancia / venta.total) * 100 : 0,
    debe,
    pagado,
  }
}

/** Fecha corta para la tabla: "12 mar" y, si es de hoy, la hora. */
export function fechaVenta(iso: string): { dia: string; Relative: string; esHoy: boolean } {
  const d = new Date(iso)
  const hoy = new Date()
  const mismoDia =
    d.getDate() === hoy.getDate() &&
    d.getMonth() === hoy.getMonth() &&
    d.getFullYear() === hoy.getFullYear()

  const dia = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
  return {
    dia: mismoDia ? d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : dia,
    Relative: d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
    esHoy: mismoDia,
  }
}

/** Subtotal de un item, tolerante a datos viejos sin subtotal guardado. */
export const subtotalItem = (it: VentaItem) =>
  r2(it.subtotal ?? (it.precio_unitario ?? 0) * it.cantidad)

/* --------------------------------------------------------------------- */
/* Resumen de la lista completa                                          */
/* --------------------------------------------------------------------- */

export type FilaResumen = {
  total: number | null
  monto_pagado: number | null
  estado: string
  /** Solo hace falta para la ganancia: el costo congelado de lo vendido. */
  items?: { cantidad: number; costo_unitario?: number | null }[] | null
}

export type ResumenVentas = {
  ventas: number
  porEstado: Record<string, number>
  /* --- Facturación: cuánto vendiste y cuánto te falta cobrar --- */
  monto: number
  cobrado: number
  porCobrar: number
  ticketPromedio: number
  /* --- Ganancia: lo que realmente te queda --- */
  costo: number
  ganancia: number
  pctGanancia: number
  /** Ganancia de las ventas que todavía no te pagaron. */
  gananciaPorCobrar: number
  /** Ventas cuyo costo se desconoce, para no mostrar una ganancia inventada. */
  ventasSinCosto: number
  truncado: boolean
}

/** Costo congelado de lo vendido. Null si el item nunca tuvo costo registrado. */
function costoDeFila(f: FilaResumen): number | null {
  if (!f.items || f.items.length === 0) return null
  let total = 0
  for (const it of f.items) {
    if (it.costo_unitario == null) return null
    total += it.costo_unitario * it.cantidad
  }
  return r2(total)
}

/**
 * Agrega las cifras de TODAS las ventas, no de la página visible.
 *
 * Tres decisiones que importan:
 * 1. Las anuladas quedan fuera de monto, cobrado, porCobrar y ganancia: una
 *    venta anulada no es ni facturación ni ganancia. Sí cuentan en `ventas` y
 *    en `porEstado`, porque el usuario quiere saber que existen.
 * 2. `porEstado` no depende de ningún filtro. Así los botones de filtro
 *    pueden mostrar siempre cuántos hay de cada tipo, que es justo lo que
 *    hace falta para notar que hay ventas pendientes sin revisarlas una a una.
 * 3. La ganancia se calcula solo con las ventas cuyo costo se conoce. Un
 *    producto creado antes de que existiera el costo no puede restarse, así
 *    que se cuenta aparte en `ventasSinCosto` en vez de tratarlo como costo
 *    cero (eso mostraría una ganancia inflada y sería una mentira).
 */
export function calcularResumenVentas(filas: FilaResumen[], tope = 5000): ResumenVentas {
  const porEstado: Record<string, number> = { COMPLETADA: 0, PENDIENTE: 0, ANULADA: 0 }
  for (const f of filas) {
    if (f.estado in porEstado) porEstado[f.estado] += 1
  }

  const activas = filas.filter((f) => f.estado !== 'ANULADA')
  const suma = (campo: 'total' | 'monto_pagado') =>
    r2(activas.reduce((s, f) => s + (Number(f[campo]) || 0), 0))

  const monto = suma('total')
  const porCobrar = r2(
    activas
      .filter((f) => (f.monto_pagado ?? 0) < (f.total ?? 0))
      .reduce((s, f) => s + (Number(f.total) || 0) - (Number(f.monto_pagado) || 0), 0)
  )

  // Ganancia: total menos el costo de lo vendido. Se acumulan aparte las
  // ventas sin costo conocido para poder avisar "esto no es exacto" en vez de
  // mostrar una cifra optimista.
  let costo = 0
  let ganancia = 0
  let gananciaPorCobrar = 0
  let ventasSinCosto = 0

  for (const f of activas) {
    const c = costoDeFila(f)
    if (c == null) {
      ventasSinCosto += 1
      continue
    }
    costo = r2(costo + c)
    const g = r2((Number(f.total) || 0) - c)
    ganancia = r2(ganancia + g)
    if ((f.monto_pagado ?? 0) < (f.total ?? 0)) gananciaPorCobrar = r2(gananciaPorCobrar + g)
  }

  return {
    ventas: filas.length,
    porEstado,
    monto,
    // Nunca "cobrado" por encima de lo facturado: un abono de más no genera
    // crédito, solo un dato inconsistente que la UI terminaría mostrando mal.
    cobrado: r2(Math.min(monto, suma('monto_pagado'))),
    porCobrar,
    ticketPromedio: activas.length > 0 ? r2(monto / activas.length) : 0,
    costo,
    ganancia,
    pctGanancia: monto > 0 ? r2((ganancia / monto) * 100) : 0,
    gananciaPorCobrar,
    ventasSinCosto,
    truncado: filas.length >= tope,
  }
}
