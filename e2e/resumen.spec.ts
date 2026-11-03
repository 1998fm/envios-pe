import { expect, test } from './support/test'
import { crearGasto, crearPersona, crearProducto, crearVenta } from './support/app'
import { appApi, createUser, randomIp } from './support/stack'
import { abrirDashboard } from './support/ui'

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': randomIp() })
})

// El resumen es la primera pantalla: debe contar de un vistazo cuánto se facturó,
// cuánto es ganancia, cómo va el día y qué toca despachar.
test('Resumen: facturado, ganancia, día de hoy y pendientes de envío', async ({ page }) => {
  const u = await createUser({ empresa: 'Negocio Resumen SAC' })
  const api = await appApi(u.token)
  const prod = await crearProducto(api, { precio_compra: 30, precio_venta: 100, stock_actual: 20 })
  await crearVenta(api, await crearPersona(api), [{ producto_id: prod.id, cantidad: 2, precio_unitario: 100 }])
  await crearGasto(api, { monto: 40 })
  const pub = await appApi(null)
  const env = await pub.post('/api/envios', {
    data: { user_id: u.id, nombre: 'Cliente Hoy', dni: '45678123', telefono: '987654321', metodo: 'MOTORIZADO', destino: 'Miraflores', direccion: 'Av. Larco 123', detalle: '1 polo' },
  })
  expect(env.ok()).toBe(true)

  await abrirDashboard(page, u)

  await expect(page.getByText('Facturado este mes')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Tu ganancia')).toBeVisible()
  await expect(page.getByText('S/ 200.00').first()).toBeVisible()
  await expect(page.getByText('S/ 140.00').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible()
  await expect(page.getByText('Vendido hoy')).toBeVisible()
  await expect(page.getByText('Ganancia de hoy')).toBeVisible()
  await expect(page.getByText('Por enviar hoy')).toBeVisible()
  await expect(page.getByText('Pedidos nuevos')).toBeVisible()
})

// Roles y permisos es parte de Business Plus, también durante la prueba gratuita.
test('Roles y permisos aparece en el menú del dueño durante la prueba de Business Plus', async ({ page }) => {
  const u = await createUser({ plan: 'business_plus', trial: true })
  await abrirDashboard(page, u)
  await expect(page.getByRole('button', { name: /Roles y permisos/ })).toBeVisible({ timeout: 15_000 })
})
