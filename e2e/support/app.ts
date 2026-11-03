import { expect, type APIRequestContext } from '@playwright/test'
import { uniq } from './stack'

// Atajos para armar datos de negocio a través de la API real de la app.

export type Json = Record<string, any>

export async function crearProducto(api: APIRequestContext, over: Json = {}): Promise<Json> {
  const res = await api.post('/api/productos', {
    data: { nombre: `Producto ${uniq('p')}`, precio_venta: 50, precio_compra: 20, stock_actual: 10, stock_minimo: 2, ...over },
  })
  expect(res.status(), await res.text()).toBe(200)
  return (await res.json()).data
}

export async function crearPersona(api: APIRequestContext, over: Json = {}): Promise<Json> {
  const n = Math.floor(10_000_000 + Math.random() * 89_999_999)
  const datos = { nombre: `Cliente ${uniq('c')}`, dni: String(n), telefono: `9${String(n).slice(0, 8)}`, ...over }
  const res = await api.post('/api/personas', { data: datos })
  expect(res.status(), await res.text()).toBe(200)
  return { ...datos, ...(await res.json()).data }
}

export async function crearVenta(api: APIRequestContext, persona: Json, items: Json[], over: Json = {}) {
  const res = await api.post('/api/ventas', {
    data: {
      persona_id: persona.id,
      persona_nombre: persona.nombre ?? 'Cliente',
      persona_dni: persona.dni ?? null,
      persona_telefono: persona.telefono ?? null,
      metodo_pago: 'EFECTIVO',
      items: items.map((it) => ({
        producto_id: it.producto_id,
        producto_nombre: it.producto_nombre ?? 'Item',
        cantidad: it.cantidad ?? 1,
        precio_unitario: it.precio_unitario ?? 50,
      })),
      ...over,
    },
  })
  return res
}

export async function stockDe(api: APIRequestContext, productoId: string): Promise<number> {
  const res = await api.get('/api/productos?limit=1000')
  expect(res.status()).toBe(200)
  const p = ((await res.json()).data as Json[]).find((x) => x.id === productoId)
  if (!p) throw new Error(`producto ${productoId} no aparece en el listado`)
  return p.stock_actual
}

export async function crearGasto(api: APIRequestContext, over: Json = {}): Promise<Json> {
  const res = await api.post('/api/gastos', { data: { concepto: `Gasto ${uniq('g')}`, monto: 12.5, categoria: 'OTROS', ...over } })
  expect(res.status(), await res.text()).toBe(200)
  return (await res.json()).data
}
