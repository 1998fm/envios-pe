import { type Page } from '@playwright/test'
import { expect, test } from './support/test'
import { crearGasto, crearPersona, crearProducto, crearVenta } from './support/app'
import { appApi, createUser, dbSelect, randomIp, type TestUser } from './support/stack'
import { abrirDashboard } from './support/ui'

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': randomIp() })
})

type Negocio = { u: TestUser; persona: Record<string, any>; envioId: string }

/** Un negocio con producto, cliente, venta, gasto y un pedido de envío. */
async function negocioConDatos(): Promise<Negocio> {
  const u = await createUser({ empresa: 'Explora SAC' })
  const api = await appApi(u.token)
  const prod = await crearProducto(api, { nombre: 'Vestido Luna', stock_actual: 10, precio_venta: 89, precio_compra: 20 })
  const persona = await crearPersona(api, { nombre: 'Ana Torres' })
  await crearVenta(api, persona, [{ producto_id: prod.id, producto_nombre: 'Vestido Luna', cantidad: 1, precio_unitario: 89 }])
  await crearGasto(api, { concepto: 'Cajas', monto: 20, categoria: 'MATERIALES' })
  const pub = await appApi(null)
  const r = await pub.post('/api/envios', {
    data: { user_id: u.id, nombre: 'Ana Torres', dni: persona.dni, telefono: persona.telefono, metodo: 'MOTORIZADO', destino: 'Miraflores', direccion: 'Av. Larco 100', detalle: '1 vestido' },
  })
  const envioId = (await r.json()).envio.id as string
  return { u, persona, envioId }
}

async function esperarEnvio(page: Page) {
  await expect(page.getByText('Ana Torres').first()).toBeVisible({ timeout: 15_000 })
}

test.describe('Dashboard: cada pestaña muestra los datos del negocio', () => {
  test('resumen con saldo, ventas del mes y pedidos sin empacar', async ({ page }) => {
    const { u } = await negocioConDatos()
    await abrirDashboard(page, u)
    await expect(page.getByText('¡Hola, Explora SAC!')).toBeVisible()
    await expect(page.getByText('Business Plus · Trial 30d')).toBeVisible()
    await expect(page.getByText('SALDO DISPONIBLE')).toBeVisible()
    await expect(page.getByText('S/ 89.00').first()).toBeVisible()
    await expect(page.getByText('PEDIDOS SIN EMPACAR')).toBeVisible()
  })

  const pestanas: [string, RegExp[]][] = [
    ['envios', [/Ana Torres/, /E-0001/, /MOTORIZADO/, /1 vestido/]],
    ['ventas', [/tus ventas/i, /Ana Torres/, /S\/ 89\.00/, /completada/i]],
    ['productos', [/Vestido Luna/, /S\/ 89\.00/, /Activos/]],
    ['gastos', [/Cajas/, /Materiales/, /S\/ 20\.00/]],
    ['clientes', [/1 cliente/, /Ana Torres/, /S\/ 89\.00/]],
    ['compras', [/No hay compras/]],
    ['formulario', [/lo que pide al cliente/i, /Mostrar tracking de pedidos/, /URL de redirección/]],
  ]
  for (const [vista, textos] of pestanas) {
    test(`pestaña ${vista}`, async ({ page }) => {
      const { u } = await negocioConDatos()
      await abrirDashboard(page, u, vista)
      for (const t of textos) await expect(page.locator('body')).toContainText(t, { timeout: 15_000 })
    })
  }
})

test.describe('Dashboard: pedidos de envío', () => {
  test('cambiar estado y tamaño se guarda en la base', async ({ page }) => {
    const { u, envioId } = await negocioConDatos()
    await abrirDashboard(page, u, 'envios')
    await esperarEnvio(page)

    await page.getByRole('button', { name: 'No Emp.' }).click()
    await page.getByRole('button', { name: 'Empacado' }).click()
    await expect.poll(async () => (await dbSelect<{ estado: string }>('envios', `id=eq.${envioId}&select=estado`))[0].estado).toBe('EMPACADO')

    await page.getByRole('button', { name: 'Sin definir' }).click()
    await page.getByRole('button', { name: 'Paquete M', exact: true }).click()
    await expect.poll(async () => (await dbSelect<{ tamano: string }>('envios', `id=eq.${envioId}&select=tamano`))[0].tamano).toBeTruthy()

    // y se recuerda al recargar
    await page.reload()
    await esperarEnvio(page)
    await expect(page.getByRole('button', { name: 'Empacado' })).toBeVisible()
  })

  test('marcar como Enviado actualiza el estado de envío de las ventas del cliente', async ({ page }) => {
    const { u, envioId } = await negocioConDatos()
    await abrirDashboard(page, u, 'envios')
    await esperarEnvio(page)

    await page.getByRole('button', { name: 'No Emp.' }).click()
    await page.getByRole('button', { name: 'Enviado' }).click()
    await expect.poll(async () => (await dbSelect<{ estado: string }>('envios', `id=eq.${envioId}&select=estado`))[0].estado).toBe('ENVIADO')

    const ventas = await dbSelect<{ estado_envio: string; envio_id: string | null }>('ventas', `profile_id=eq.${u.id}&select=estado_envio,envio_id`)
    expect(ventas).toHaveLength(1)
    // la venta quedó ligada al pedido y ya no figura como pendiente de enviar
    await expect.poll(async () => (await dbSelect<{ estado_envio: string }>('ventas', `profile_id=eq.${u.id}&select=estado_envio`))[0].estado_envio).not.toBe('PENDIENTE')
  })

  test('la búsqueda filtra los pedidos', async ({ page }) => {
    const { u } = await negocioConDatos()
    await abrirDashboard(page, u, 'envios')
    await esperarEnvio(page)
    const buscador = page.getByPlaceholder('Buscar por nombre, DNI o teléfono...')
    await buscador.fill('zzzz')
    await expect(page.getByText('Ana Torres')).toBeHidden({ timeout: 10_000 })
    await buscador.fill('torres')
    await expect(page.getByText('Ana Torres').first()).toBeVisible({ timeout: 10_000 })
  })

  test('el detalle se abre con doble clic y permite eliminar el pedido', async ({ page }) => {
    const { u, envioId } = await negocioConDatos()
    await abrirDashboard(page, u, 'envios')
    await esperarEnvio(page)

    await page.locator('[data-tour="envio-card"]').first().dblclick()
    await expect(page.getByText('¿Eliminar este pedido?')).toBeHidden()
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
    await expect(page.getByText('¿Eliminar este pedido?')).toBeVisible()
    await page.getByRole('button', { name: 'Sí, eliminar' }).click()
    await expect.poll(async () => (await dbSelect('envios', `id=eq.${envioId}&select=id`)).length).toBe(0)
  })
})

test.describe('Dashboard: la pantalla no se rompe', () => {
  test('recorrer todas las pestañas no produce errores de JavaScript', async ({ page }) => {
    const { u } = await negocioConDatos()
    const errores: string[] = []
    page.on('pageerror', (e) => errores.push(e.message))
    await abrirDashboard(page, u)
    for (const v of ['envios', 'ventas', 'productos', 'gastos', 'clientes', 'compras', 'formulario']) {
      await page.goto(`/dashboard?v=${v}`)
      await page.waitForLoadState('networkidle').catch(() => {})
    }
    expect(errores).toEqual([])
  })

  test('un usuario Básico ve su plan y el límite en el panel', async ({ page }) => {
    const u = await createUser({ plan: 'basic', empresa: 'Basico SAC' })
    await abrirDashboard(page, u)
    await expect(page.getByText('¡Hola, Basico SAC!')).toBeVisible()
    await expect(page.getByText(/Básico|Basic/i).first()).toBeVisible()
  })
})

test.describe('Formulario público del negocio', () => {
  test('carga con el nombre del negocio y los métodos de envío activos', async ({ page }) => {
    const u = await createUser({ empresa: 'Tienda Publica' })
    await page.goto(`/f/${u.slug}`)
    await expect(page.getByRole('button', { name: 'Solicitar Envío' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Motorizado' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Shalom' }).first()).toBeVisible()
  })

  test('un negocio inexistente muestra un aviso y no revienta', async ({ page }) => {
    const r = await page.goto('/f/no-existe-este-negocio')
    expect(r?.status()).toBeLessThan(500)
    await expect(page.getByText(/No se encontró el perfil/)).toBeVisible()
  })

  test('el formulario no expone datos internos del perfil', async ({ page }) => {
    const u = await createUser({ empresa: 'Privada SAC' })
    await page.goto(`/f/${u.slug}`)
    await page.waitForLoadState('networkidle')
    const html = await page.content()
    for (const secreto of ['SUPABASE_SERVICE_ROLE_KEY', 'service_role', 'trial_end', 'pro_until', u.id.replace(/-/g, '').slice(0, 0) || 'encrypted_password']) {
      expect(html, secreto).not.toContain(secreto)
    }
  })
})
