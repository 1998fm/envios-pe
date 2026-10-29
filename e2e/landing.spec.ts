import { expect, test } from './support/test'

test.describe('Landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('muestra el mensaje principal, la navegación y los CTA', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Vender por WhatsApp debería darte')
    for (const label of ['¿Te pasa?', 'Cómo funciona', 'Soluciones', 'Historias', 'Precios']) {
      await expect(page.getByRole('navigation').getByRole('link', { name: label })).toBeVisible()
    }
    await expect(page.getByRole('link', { name: 'Quiero ordenar mi negocio' })).toHaveAttribute('href', '/register')
    await expect(page.getByText('30 días gratis').first()).toBeVisible()
  })

  test('el héroe cuenta la historia sola: el vaivén de hoy y luego Tori', async ({ page }) => {
    test.slow() // la animación completa dura ~30 s
    const hero = page.locator('#inicio')
    // Antes: la conversación se desarrolla mensaje a mensaje
    await expect(hero.getByText('Hola, quiero que me envíen mi pedido')).toBeVisible({ timeout: 15_000 })
    await expect(hero.getByText('Pero en Arequipa hay varias agencias')).toBeVisible({ timeout: 30_000 })
    await expect(hero.getByText('Agencia sin definir')).toBeVisible({ timeout: 10_000 })
    // ...y pasa sola a "Con Tori": el cliente pide agendar y llena el formulario
    await expect(hero.getByText('Hola, quiero agendar mi envío')).toBeVisible({ timeout: 25_000 })
    await expect(hero.getByText('Para agendarlo llena este formulario')).toBeVisible({ timeout: 15_000 })
    await expect(hero.getByText('Listo, ya lo llené')).toBeVisible({ timeout: 15_000 })
    // sus datos aparecen ordenados en Tori
    await expect(hero.getByText('Nuevo pedido')).toBeVisible({ timeout: 15_000 })
    await expect(hero.getByText('Arequipa · Cayma · Av. Charcani')).toBeVisible({ timeout: 15_000 })
    await expect(hero.getByText('No empacado')).toBeVisible({ timeout: 15_000 })
  })

  test('las pestañas Antes / Con Tori cambian la escena a mano y se puede repetir', async ({ page }) => {
    const hero = page.locator('#inicio')
    await hero.getByRole('tab', { name: 'Con Tori' }).click()
    await expect(hero.getByRole('tab', { name: 'Con Tori' })).toHaveAttribute('aria-selected', 'true')
    await expect(hero.getByText('Listo, ya lo llené')).toBeVisible({ timeout: 20_000 })
    await expect(hero.getByText('987 654 321')).toBeVisible({ timeout: 15_000 })

    await hero.getByRole('tab', { name: 'Antes' }).click()
    await expect(hero.getByText('Pero en Arequipa hay varias agencias')).toBeVisible({ timeout: 30_000 })
    await expect(hero.getByText('Nuevo pedido')).toBeHidden()

    await hero.getByRole('button', { name: 'Repetir' }).click()
    await expect(hero.getByText('Hola, quiero que me envíen mi pedido')).toBeVisible({ timeout: 10_000 })
  })

  test('es una landing clara con el azul de Tori y el título no usa degradado de dos colores', async ({ page }) => {
    const info = await page.evaluate(() => {
      const raiz = document.querySelector('div.relative.min-h-screen') as HTMLElement
      const h1 = document.querySelector('h1') as HTMLElement
      const conClip = [h1, ...Array.from(h1.querySelectorAll('*'))].filter((e) => {
        const cs = getComputedStyle(e as HTMLElement)
        return (cs.backgroundClip === 'text' || (cs as unknown as { webkitBackgroundClip: string }).webkitBackgroundClip === 'text') && cs.color === 'rgba(0, 0, 0, 0)'
      })
      return { fondo: getComputedStyle(raiz).backgroundColor, color: getComputedStyle(h1).color, textoDegradado: conClip.length, garabato: h1.querySelectorAll('svg path').length }
    })
    expect(info.fondo, 'fondo de la página').toBe('rgb(255, 255, 255)')
    expect(info.color, 'color del título = azul oscuro de Tori').toBe('rgb(10, 53, 82)')
    expect(info.textoDegradado, 'ninguna palabra del título con degradado').toBe(0)
    expect(info.garabato, 'la palabra tachada a mano se dibuja').toBeGreaterThan(0)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('desorden')
  })

  test('"El problema real" arranca solo al llegar a esa parte y recorre los 8 pasos', async ({ page }) => {
    const sec = page.locator('#problema')
    const boton = sec.getByRole('button', { name: /Reproducir|Pausar|Repetir/ })
    // todavía no llegó: no se ha reproducido nada
    await expect(boton).toHaveText(/Reproducir/)
    await sec.scrollIntoViewIfNeeded()
    // al llegar se pone en marcha sin tocar nada
    await expect(boton).toHaveText(/Pausar/, { timeout: 8_000 })
    // termina el recorrido por sí mismo y los errores se encienden
    await expect(boton).toHaveText(/Repetir/, { timeout: 25_000 })
    await expect(sec.getByText('Inventario incierto')).toHaveClass(/amber/)
    await expect(sec.getByText('Y ahí comienzan los errores.')).toBeVisible()

    // y se puede repetir
    await boton.click()
    await expect(boton).toHaveText(/Pausar/)
  })

  test('el autodiagnóstico cuenta lo marcado y da un mensaje según el nivel', async ({ page }) => {
    const items = page.locator('#diagnostico').getByRole('button').filter({ hasText: /Olvidé|Busqué|Vendí|Mandé|Copié|Tengo|Después|Siento/ })
    await expect(items).toHaveCount(9)

    await items.nth(0).click()
    await expect(page.getByText('Parece que todavía tienes varias cosas bajo control.')).toBeVisible()
    for (let i = 1; i < 4; i++) await items.nth(i).click()
    await expect(page.getByText('Ya estás sintiendo el costo de trabajar con todo separado.')).toBeVisible()
    for (let i = 4; i < 9; i++) await items.nth(i).click()
    await expect(page.getByText('Tori probablemente fue hecho pensando en un negocio como el tuyo.')).toBeVisible()

    await items.nth(0).click() // desmarcar baja el contador
    await expect(page.locator('#diagnostico svg text').first()).toHaveText('8')
  })

  test('"Hoy / Con Tori" conecta las piezas', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Hoy\s*Con Tori/ })
    await toggle.scrollIntoViewIfNeeded()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Todo trabaja junto')).toBeVisible()
  })

  test('las pestañas de soluciones cambian el contenido y las demos responden', async ({ page }) => {
    const sec = page.locator('#funciones')
    await sec.scrollIntoViewIfNeeded()

    await expect(sec.getByText('Tus pedidos dejan de estar perdidos.')).toBeVisible()
    await sec.getByRole('button', { name: 'Preparar envío' }).click()
    await expect(sec.getByText('Envío listo con Shalom')).toBeVisible()

    await sec.getByRole('tab', { name: 'Ventas + Dinero' }).click()
    await expect(sec.getByText('Deja de hacer cuentas para saber cómo va el negocio.')).toBeVisible()
    await expect(sec.getByText('S/ 764.00')).toBeVisible()
    await sec.getByRole('button', { name: /Registrar venta/ }).click()
    await expect(sec.getByText('S/ 809.00')).toBeVisible()

    await sec.getByRole('tab', { name: 'Inventario + Productos' }).click()
    await expect(sec.getByText('Sabes qué tienes antes de prometer lo que no tienes.')).toBeVisible()
    await sec.getByRole('button', { name: 'Vender 1 Polo Basic' }).click()
    await expect(sec.getByText('Poco stock')).toBeVisible()
  })

  test('el selector de precios alterna mensual y trimestral', async ({ page }) => {
    const sec = page.locator('#precios')
    await sec.scrollIntoViewIfNeeded()
    await expect(sec.getByText('S/ 29.90').first()).toBeVisible()
    await sec.getByRole('button', { name: 'trimestral' }).click()
    await expect(sec.getByText('S/ 79.90').first()).toBeVisible()
    await expect(sec.getByText('S/ 129.90').first()).toBeVisible()
    await sec.getByRole('button', { name: 'mensual' }).click()
    await expect(sec.getByText('S/ 49.90').first()).toBeVisible()
  })

  test('el acordeón de preguntas abre y cierra', async ({ page }) => {
    const q = page.getByRole('button', { name: '¿Tori reemplaza WhatsApp?' })
    await q.scrollIntoViewIfNeeded()
    await q.click()
    await expect(page.getByText('Tori organiza la información que genera tu negocio')).toBeVisible()
    await q.click()
    await expect(page.getByText('Tori organiza la información que genera tu negocio')).toBeHidden()
  })

  test('"¿Es para ti?" alterna entre encaja y no encaja', async ({ page }) => {
    await page.getByRole('button', { name: 'Quizá no sea lo que buscas si...' }).click()
    await expect(page.getByText('Buscas un ERP empresarial extremadamente complejo.')).toBeVisible()
    await page.getByRole('button', { name: 'Tori puede encajar contigo si...' }).click()
    await expect(page.getByText('Vendes principalmente por WhatsApp.')).toBeVisible()
  })

  test('los CTA llevan a registro e inicio de sesión', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Probar Tori' }).click()
    await expect(page).toHaveURL(/\/register$/)
    await page.goBack()
    await page.getByRole('navigation').getByRole('link', { name: 'Iniciar sesión' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('no hay errores de consola ni desbordamiento horizontal en móvil', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    const errores: string[] = []
    page.on('pageerror', (e) => errores.push(e.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const ancho = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    expect(ancho.sw).toBeLessThanOrEqual(ancho.cw + 1)
    expect(errores).toEqual([])
    await ctx.close()
  })
})
