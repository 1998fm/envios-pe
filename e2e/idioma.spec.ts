import { randomUUID } from 'node:crypto'
import { expect, test } from './support/test'
import { crearPersona, crearProducto, crearVenta } from './support/app'
import { appApi, createUser, uniq } from './support/stack'
import { abrirDashboard } from './support/ui'

// La app es para Perú: todo lo que ve el usuario va en español. Estas pruebas
// fallan si un mensaje de error llega en inglés o con detalles internos de la
// base de datos (nombres de tablas, restricciones, "violates", etc.).

const INGLES =
  /\b(invalid|missing|failed|failure|violates|constraint|relation|column|null value|not found|unauthorized|forbidden|already|credentials|should be|too many|rate limit|duplicate key|permission denied|must be|cannot|could not|unable|expired|does not exist|syntax|undefined|exception|internal server)\b/i

function esEspanol(texto: unknown): boolean {
  return typeof texto === 'string' && texto.length > 0 && !INGLES.test(texto)
}

async function errorDe(res: { status(): number; text(): Promise<string> }): Promise<{ status: number; error: string }> {
  const t = await res.text()
  try {
    return { status: res.status(), error: String((JSON.parse(t) as { error?: unknown }).error ?? t) }
  } catch {
    return { status: res.status(), error: t }
  }
}

test.describe('Mensajes en español', () => {
  test('sin sesión y sin permisos: todas las respuestas de error están en español', async () => {
    const anon = await appApi(null)
    const rutas: [string, string, object?][] = [
      ['GET', '/api/ventas'], ['GET', '/api/productos'], ['GET', '/api/gastos'], ['GET', '/api/clientes'], ['GET', '/api/compras'],
      ['GET', '/api/dashboard'], ['GET', '/api/envios'], ['GET', '/api/session'], ['GET', '/api/personas?busqueda=1'],
      ['POST', '/api/gastos', { concepto: 'x' }], ['PUT', `/api/gastos/${randomUUID()}`, {}], ['DELETE', `/api/productos/${randomUUID()}`],
      ['PATCH', `/api/envios/${randomUUID()}`, { estado: 'ENVIADO' }], ['PATCH', '/api/envios/bulk', { ids: [], estado: 'ENVIADO' }],
      ['POST', '/api/configuracion', {}], ['POST', '/api/onboarding', {}], ['POST', '/api/uploads/producto', {}],
      ['POST', '/api/auth/password', { password: 'ClaveNueva123' }], ['POST', '/api/mercadopago/create-subscription', { plan: 'pro', periodo: 'mensual' }],
      ['GET', '/api/admin/overview'], ['GET', '/api/cron/downgrade-plans'], ['POST', '/api/webhooks/mercadopago', {}],
    ]
    for (const [metodo, ruta, cuerpo] of rutas) {
      const r = await errorDe(await anon.fetch(ruta, { method: metodo, data: cuerpo }))
      expect(r.status, `${metodo} ${ruta}`).toBeGreaterThanOrEqual(400)
      expect(esEspanol(r.error), `${metodo} ${ruta} respondió «${r.error}»`).toBe(true)
    }
  })

  test('validaciones y errores de la base de datos llegan en español y sin detalles internos', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const prod = await crearProducto(api, { stock_actual: 1 })
    const persona = await crearPersona(api)

    const casos: [string, ReturnType<typeof api.fetch>][] = [
      ['gasto sin concepto', api.post('/api/gastos', { data: { monto: 5 } })],
      ['gasto con categoría inventada', api.post('/api/gastos', { data: { concepto: 'x', categoria: 'ZZZ' } })],
      ['venta con stock insuficiente', crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 99 }])],
      ['venta con cantidad inválida', crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 0 }])],
      ['compra vacía', api.post('/api/compras', { data: { proveedor: '', items: [] } })],
      ['pedido: estado inválido', api.patch(`/api/envios/${randomUUID()}`, { data: { estado: 'XYZ' } })],
      ['pedido inexistente', api.patch(`/api/envios/${randomUUID()}`, { data: { estado: 'ENVIADO' } })],
      ['borrar pedido inexistente', api.delete(`/api/envios/${randomUUID()}`)],
      ['venta inexistente', api.put(`/api/ventas/${randomUUID()}`, { data: { estado: 'ANULADA' } })],
      ['producto inexistente', api.put(`/api/productos/${randomUUID()}`, { data: { nombre: 'x' } })],
      ['rol sin permiso (sin ver_gastos no aplica al dueño): configuración vacía', api.post('/api/configuracion', { data: 'no-multipart' })],
      ['imagen que no es imagen', api.post('/api/uploads/producto', { multipart: { file: { name: 'x.html', mimeType: 'text/html', buffer: Buffer.from('<b>x</b>') } } })],
      ['contraseña corta', api.post('/api/auth/password', { data: { password: 'abc' } })],
    ]
    for (const [nombre, llamada] of casos) {
      const r = await errorDe(await llamada)
      expect(r.status, nombre).toBeGreaterThanOrEqual(400)
      expect(esEspanol(r.error), `${nombre} respondió «${r.error}»`).toBe(true)
    }
  })

  test('un error de la base (valor fuera de rango) no filtra el texto técnico', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    // precio imposible para numeric(10,2): lo rechaza Postgres, no la validación de la app
    const r = await errorDe(await api.post('/api/productos', { data: { nombre: 'x', precio_venta: 99999999999999, stock_actual: 0 } }))
    expect(r.status).toBeGreaterThanOrEqual(400)
    expect(esEspanol(r.error), `respondió «${r.error}»`).toBe(true)
    expect(r.error).not.toMatch(/numeric|overflow|field|precision|productos|public\./i)
  })

  test('autenticación: login, registro, recuperación y contraseña en español', async () => {
    const u = await createUser()
    const anon = await appApi(null)
    const respuestas = [
      await anon.post('/api/auth/login', { data: { email: u.email, password: 'incorrecta' } }),
      await anon.post('/api/auth/login', { data: { email: '', password: '' } }),
      await anon.post('/api/auth/forgot', { data: { email: 'no-es-correo' } }),
      await anon.post('/api/register', { data: { email: 'no-es-correo', password: 'ClaveSegura123', empresa: 'X' } }),
      await anon.post('/api/register', { data: { email: u.email, password: 'ClaveSegura123', empresa: 'Repetida' } }),
      await anon.post('/api/register', { data: { email: `${uniq('p')}@e2e.test`, password: '123', empresa: 'X' } }),
    ]
    for (const res of respuestas) {
      const r = await errorDe(res)
      expect(r.status).toBeGreaterThanOrEqual(400)
      expect(esEspanol(r.error), `respondió «${r.error}»`).toBe(true)
    }
    const mala = await errorDe(await anon.post('/api/auth/login', { data: { email: u.email, password: 'incorrecta' } }))
    expect(mala.error).toBe('Correo o contraseña incorrectos.')
  })

  test('en pantalla: login con clave mala y enlace de recuperación inválido, en español', async ({ page }) => {
    const u = await createUser()
    await page.goto('/login')
    await page.getByPlaceholder('correo@ejemplo.com').fill(u.email)
    await page.getByPlaceholder('••••••').fill('clave-equivocada')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible()

    await page.goto('/reset-password')
    await expect(page.getByText(/El enlace venció o no es válido/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Volver al inicio de sesión' })).toBeVisible()
  })

  test('el dashboard no muestra textos en inglés al fallar una acción', async ({ page }) => {
    const u = await createUser()
    await abrirDashboard(page, u, 'gastos')
    // se corta la API: el aviso que ve el usuario debe estar en español
    await page.route('**/api/gastos**', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'No se pudo completar la operación. Intenta de nuevo.' }) }))
    await page.reload()
    const cuerpo = await page.locator('body').innerText()
    expect(cuerpo).not.toMatch(INGLES)
  })
})
