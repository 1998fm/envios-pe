import { randomUUID } from 'node:crypto'
import { expect, test } from './support/test'
import { appApi, createUser, dbSelect, supabase } from './support/stack'
import { computeEffectivePlan, DIAS_PRUEBA_PLUS, featureLocked, PRECIOS_PLUS } from '../src/lib/planGating'

 test('catálogo de dos planes y compatibilidad de Pro vigente', () => {
  expect(DIAS_PRUEBA_PLUS).toBe(14)
  expect(PRECIOS_PLUS.mensual).toEqual({ valor: 49.9, meses: 1 })
  expect(PRECIOS_PLUS.trimestral).toEqual({ valor: 129.9, meses: 3 })
  expect(computeEffectivePlan({ plan: 'pro', pro_until: '2099-01-01' }).plan).toBe('business_plus')
  expect(computeEffectivePlan({ plan: 'business_plus', trial_end: '2000-01-01' }).plan).toBe('basic')
  for (const key of ['copiar', 'etiquetas', 'shalom', 'cambio_masivo', 'productos', 'ventas', 'compras', 'gastos', 'resumen']) {
    expect(featureLocked(key, 'basic')).toBe(true)
    expect(featureLocked(key, 'business_plus')).toBe(false)
  }
})

test('Básico bloquea las herramientas de operación incluso para el dueño', async () => {
  const u = await createUser({ plan: 'basic' })
  const api = await appApi(u.token)
  const id = randomUUID()
  for (const ruta of ['/api/productos', '/api/ventas', '/api/compras', '/api/gastos', '/api/clientes', '/api/personas', '/api/dashboard', '/api/roles', '/api/envios/export', '/api/envios/productos', `/api/envios/${id}/ventas`]) {
    expect((await api.get(ruta)).status(), ruta).toBe(403)
  }
  expect((await api.patch('/api/envios/bulk', { data: { ids: [id], estado: 'ENVIADO' } })).status()).toBe(403)
  expect((await api.post('/api/productos', { data: { nombre: 'No permitido' } })).status()).toBe(403)
  expect((await api.post('/api/mercadopago/create-subscription', { data: { plan: 'pro', periodo: 'mensual' } })).status()).toBe(400)
  const features = await (await api.get('/api/plan/features')).json()
  expect(features.max_envios).toBeNull()
  expect(features.max_productos).toBe(0)
  expect(features.max_metodos).toBe(2)
})

test('Básico recibe el pedido 56 y permite validarlo individualmente', async () => {
  const u = await createUser({ plan: 'basic' })
  const db = await supabase('service')
  const rows = Array.from({ length: 55 }, (_, i) => ({ user_id: u.id, nombre: `Pedido ${i}`, dni: String(10000000+i), telefono: String(900000000+i), metodo: 'MOTORIZADO', destino: 'Miraflores', direccion: 'Calle 1', estado: 'NO_EMPACADO' }))
  const insert = await db.post('/rest/v1/envios', { data: rows })
  expect(insert.status(), await insert.text()).toBe(201)
  await db.dispose()
  const publico = await appApi(null)
  const r = await publico.post('/api/envios', { data: { user_id: u.id, nombre: 'Pedido 56', dni: '87654321', telefono: '987654321', metodo: 'MOTORIZADO', destino: 'Miraflores', direccion: 'Calle Nueva 2', detalle: 'Un pedido' } })
  expect(r.status(), await r.text()).toBe(200)
  const pedido = (await r.json()).envio
  const api = await appApi(u.token)
  const lista = await (await api.get('/api/envios?limit=100')).json()
  expect(lista.data).toHaveLength(56)
  expect((await api.patch(`/api/envios/${pedido.id}`, { data: { estado: 'EMPACADO', observaciones: 'Validado individualmente' } })).status()).toBe(200)
  expect((await dbSelect('envios', `user_id=eq.${u.id}&select=id`)).length).toBe(56)
})

test('bajar a Básico conserva datos y renovar Plus recupera el acceso', async () => {
  const u = await createUser()
  const api = await appApi(u.token)
  const r = await api.post('/api/productos', { data: { nombre: 'Se conserva', precio_venta: 25.5 } })
  expect(r.status()).toBe(200)
  const id = (await r.json()).data.id
  const db = await supabase('service')
  expect((await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, { data: { plan: 'basic', trial_end: null, pro_until: null } })).ok()).toBe(true)
  expect((await api.get('/api/productos')).status()).toBe(403)
  expect(await dbSelect('productos', `id=eq.${id}&select=id`)).toHaveLength(1)
  expect((await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, { data: { plan: 'business_plus', pro_until: '2099-01-01' } })).ok()).toBe(true)
  expect((await api.get('/api/productos')).status()).toBe(200)
  await db.dispose()
})

test('Básico mantiene formulario y configuración, y redirige las vistas Plus', async ({ page }) => {
  const { abrirDashboard } = await import('./support/ui')
  const u = await createUser({ plan: 'basic' })
  await abrirDashboard(page, u, 'envios')
  await expect(page.getByText('Básico · solicitudes ilimitadas y gestión individual.', { exact: false })).toBeVisible()
  await page.goto('/dashboard?v=productos')
  await expect(page).toHaveURL(/v=envios/)
  await expect(page.getByRole('button', { name: 'Nuevo producto', exact: true })).toHaveCount(0)
  await page.goto('/dashboard?v=formulario')
  await page.getByTitle('Abrir menú', { exact: true }).hover()
  await expect(page.locator('[data-tour="configuracion"]')).toBeVisible()
  await page.locator('[data-tour="topbar"]').getByRole('button', { name: 'Ver planes', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Básico · Plan actual', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Plus', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pro', exact: true })).toHaveCount(0)
})
