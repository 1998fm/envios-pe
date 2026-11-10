import { expect, test } from './support/test'

test.describe('Landing', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/') })

  test('explica el formulario desde el inicio y mantiene acceso a registro', async ({ page }) => {
    const hero = page.locator('#inicio')
    await expect(hero.getByRole('heading', { level: 1 })).toContainText('Vende por WhatsApp.')
    await expect(hero.getByRole('heading', { level: 1 })).toHaveCSS('opacity', '1')
    await expect(hero).toContainText('Comparte tu formulario')
    await expect(hero.getByRole('link', { name: 'Probar Plus gratis' })).toHaveAttribute('href', '/register')
    await expect(hero.getByText('14 días gratis', { exact: true })).toBeVisible()
    await expect(hero.getByText('Después, Básico gratis', { exact: true })).toBeVisible()
    for (const label of ['Cómo funciona', 'Soluciones', 'Historias', 'Precios']) {
      await expect(page.getByRole('navigation').getByRole('link', { name: label })).toBeVisible()
    }
  })

  test('la demostración permite recibir, validar y reiniciar un pedido sin enviar datos', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (r) => { if (r.method() === 'POST') requests.push(r.url()) })
    const hero = page.locator('#inicio')
    await hero.getByRole('button', { name: 'Simular envío del formulario' }).click()
    await expect(hero.getByText('Pedido recibido', { exact: true })).toBeVisible()
    await expect(hero.getByText('Av. Larco 100', { exact: false })).toBeVisible()
    await hero.getByRole('button', { name: 'Revisar y marcar como empacado' }).click()
    await expect(hero.getByText('Revisado y empacado', { exact: true })).toBeVisible()
    await expect(hero.getByRole('button', { name: 'Pedido listo' })).toBeDisabled()
    await hero.getByRole('button', { name: 'Ver de nuevo' }).click()
    await expect(hero.getByRole('button', { name: 'Simular envío del formulario' })).toBeVisible()
    expect(requests).toEqual([])
  })

  test('el recorrido muestra tres pasos sin exigir inventario y siete secciones', async ({ page }) => {
    const section = page.locator('#solucion')
    await section.scrollIntoViewIfNeeded()
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(3)
    await expect(section).toContainText('No necesitas cargar todo tu inventario')
    const sections = await page.locator('section').evaluateAll((nodes) => nodes.filter((n) => n.getBoundingClientRect().height > 0).length)
    expect(sections).toBe(7)
    await expect(page.getByText('Es como mi Excel, pero en orden.', { exact: false })).toHaveCount(1)
  })

  test('las tres demos de funciones conservan sus interacciones', async ({ page }) => {
    const sec = page.locator('#funciones')
    await sec.scrollIntoViewIfNeeded()
    await sec.getByRole('button', { name: 'Preparar envío' }).click()
    await expect(sec.getByText('Envío listo con Shalom')).toBeVisible()
    await sec.getByRole('tab', { name: 'Ventas + Dinero' }).click()
    await expect(sec.getByText('S/ 764.00')).toBeVisible()
    await sec.getByRole('button', { name: /Registrar venta/ }).click()
    await expect(sec.getByText('S/ 809.00')).toBeVisible()
    await sec.getByRole('tab', { name: 'Inventario + Productos' }).click()
    await sec.getByRole('button', { name: 'Vender 1 Polo Basic' }).click()
    await expect(sec.getByText('Poco stock')).toBeVisible()
  })

  test('los planes conservan sus precios mensual y trimestral', async ({ page }) => {
    const sec = page.locator('#precios')
    await sec.scrollIntoViewIfNeeded()
    await expect(sec.getByRole('heading', { name: 'Básico', exact: true })).toBeVisible()
    await expect(sec.getByRole('heading', { name: 'Plus', exact: true })).toBeVisible()
    await expect(sec.getByRole('heading', { name: 'Pro', exact: true })).toHaveCount(0)
    await expect(sec.getByText('S/ 49.90').first()).toBeVisible()
    await sec.getByRole('button', { name: 'trimestral' }).click()
    await expect(sec.getByText('S/ 129.90').first()).toBeVisible()
    await sec.getByRole('button', { name: 'mensual' }).click()
    await expect(sec.getByText('S/ 49.90').first()).toBeVisible()
  })

  test('las preguntas frecuentes explican WhatsApp, prueba y plan gratuito', async ({ page }) => {
    const q = page.getByRole('button', { name: '¿Qué pasa después de los 14 días de prueba?' })
    await q.scrollIntoViewIfNeeded()
    await q.click()
    await expect(page.getByText('La prueba no te cobra automáticamente', { exact: false })).toBeVisible()
    await q.click()
    await expect(page.getByText('La prueba no te cobra automáticamente', { exact: false })).toBeHidden()
    await page.getByRole('button', { name: '¿Qué puedo hacer con el plan Básico?' }).click()
    await expect(page.getByText('Recibir solicitudes sin límite mensual', { exact: false })).toBeVisible()
  })

  test('los CTA y el menú móvil mantienen enlaces válidos', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    await page.goto('/')
    await page.getByRole('button', { name: /menú/i }).click()
    await page.getByRole('link', { name: 'Precios', exact: true }).first().click()
    await expect(page).toHaveURL(/#precios$/)
    await page.locator('#inicio').getByRole('link', { name: 'Probar Plus gratis' }).click()
    await expect(page).toHaveURL(/\/register$/)
    await expect(page.getByRole('button', { name: 'Crear cuenta', exact: true })).toBeVisible()
    await ctx.close()
  })

  for (const width of [360, 390, 1440]) {
    test(`sin errores ni desbordamiento a ${width}px`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 844 } })
      const page = await ctx.newPage()
      const errores: string[] = []
      page.on('pageerror', (e) => errores.push(e.message))
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const size = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }))
      expect(size.scroll).toBeLessThanOrEqual(size.width + 1)
      if (width === 390) expect(size.height).toBeLessThan(11000)
      expect(errores).toEqual([])
      await ctx.close()
    })
  }
})
