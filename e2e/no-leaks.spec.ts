import { type Page } from '@playwright/test'
import { expect, test } from './support/test'
import { crearGasto, crearPersona, crearProducto, crearVenta } from './support/app'
import { appApi, createUser, keys, randomIp } from './support/stack'
import { abrirDashboard } from './support/ui'

// Garantía: ni el HTML ni el JavaScript que recibe el navegador contienen la
// dirección de la base de datos o sus llaves, el navegador nunca le habla
// directo, y la sesión no está al alcance del JavaScript de la página.

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': randomIp() })
})

async function recorrer(page: Page, rutas: string[]) {
  for (const r of rutas) {
    await page.goto(r)
    await page.waitForLoadState('networkidle').catch(() => {})
  }
}

test.describe('El navegador no conoce la base de datos', () => {
  test('páginas públicas: sin dirección, llaves ni llamadas a la base', async ({ page }) => {
    const k = await keys()
    const host = new URL(k.url).host
    const cuerpos: { url: string; texto: string }[] = []
    const alBackend: string[] = []

    page.on('request', (r) => {
      if (r.url().includes(host)) alBackend.push(r.url())
    })
    page.on('websocket', (ws) => {
      if (ws.url().includes(host)) alBackend.push(`WS ${ws.url()}`)
    })
    page.on('response', async (r) => {
      const tipo = r.request().resourceType()
      if (!['script', 'document', 'xhr', 'fetch', 'stylesheet'].includes(tipo)) return
      try {
        cuerpos.push({ url: r.url(), texto: await r.text() })
      } catch {
        // respuestas sin cuerpo (redirecciones)
      }
    })

    const negocio = await createUser({ empresa: 'Tienda Publica' })
    await recorrer(page, ['/', '/login', '/register', '/reset-password', `/f/${negocio.slug}`])

    expect(cuerpos.length).toBeGreaterThan(5)
    expect(alBackend, 'el navegador habló con la base').toEqual([])
    for (const c of cuerpos) {
      for (const prohibido of [host, k.anonKey, k.serviceKey, k.jwtSecret, 'supabase.co', 'SUPABASE_URL', 'SUPABASE_ANON', 'SUPABASE_SERVICE', 'service_role', '/rest/v1', '/auth/v1', '/storage/v1']) {
        expect(c.texto.includes(prohibido), `${c.url} contiene ${prohibido}`).toBe(false)
      }
    }
  })

  test('dashboard completo (todas las pestañas): nada de la base en el navegador', async ({ page }) => {
    const k = await keys()
    const host = new URL(k.url).host
    const cuerpos: { url: string; texto: string }[] = []
    const alBackend: string[] = []
    const errores: string[] = []

    page.on('request', (r) => {
      if (r.url().includes(host)) alBackend.push(r.url())
    })
    page.on('websocket', (ws) => {
      if (ws.url().includes(host)) alBackend.push(`WS ${ws.url()}`)
    })
    page.on('pageerror', (e) => errores.push(e.message))
    page.on('response', async (r) => {
      const tipo = r.request().resourceType()
      if (!['script', 'document'].includes(tipo)) return
      try {
        cuerpos.push({ url: r.url(), texto: await r.text() })
      } catch {
        // sin cuerpo
      }
    })

    const u = await createUser({ empresa: 'Sin Fugas SAC' })
    const api = await appApi(u.token)
    const prod = await crearProducto(api, { nombre: 'Vestido', stock_actual: 5 })
    const per = await crearPersona(api)
    await crearVenta(api, per, [{ producto_id: prod.id, cantidad: 1 }])
    await crearGasto(api)

    await abrirDashboard(page, u)
    await recorrer(page, ['/dashboard?v=envios', '/dashboard?v=ventas', '/dashboard?v=productos', '/dashboard?v=compras', '/dashboard?v=gastos', '/dashboard?v=clientes', '/dashboard?v=formulario', '/onboarding'])

    expect(errores).toEqual([])
    expect(alBackend, 'el navegador habló con la base').toEqual([])
    for (const c of cuerpos) {
      for (const prohibido of [host, k.anonKey, k.serviceKey, 'supabase.co', 'SUPABASE_', '/rest/v1', '/auth/v1', '/storage/v1']) {
        expect(c.texto.includes(prohibido), `${c.url} contiene ${prohibido}`).toBe(false)
      }
    }
  })

  test('la sesión vive en cookies httpOnly: el JavaScript de la página no puede leerla', async ({ page, context }) => {
    const u = await createUser()
    await abrirDashboard(page, u)

    const cookies = (await context.cookies()).filter((c) => c.name.startsWith('sb-'))
    expect(cookies.length).toBeGreaterThan(0)
    for (const c of cookies) {
      expect(c.httpOnly, `${c.name} debería ser httpOnly`).toBe(true)
      expect(c.sameSite).toBe('Lax')
    }

    const visibleParaJs = await page.evaluate(() => ({
      cookie: document.cookie,
      local: Object.keys(localStorage).filter((k) => /supabase|sb-|auth|token/i.test(k)),
      session: Object.keys(sessionStorage).filter((k) => /supabase|sb-|auth|token/i.test(k)),
    }))
    expect(visibleParaJs.cookie).not.toMatch(/sb-/)
    expect(visibleParaJs.local).toEqual([])
    expect(visibleParaJs.session).toEqual([])
  })

  test('las imágenes salen por /media del propio dominio', async ({ page }) => {
    const u = await createUser()
    const api = await appApi(u.token)
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    const subida = await api.post('/api/uploads/producto', { multipart: { file: { name: 'a.png', mimeType: 'image/png', buffer: png } } })
    const { url } = await subida.json()
    expect(url.startsWith('/media/')).toBe(true)
    await crearProducto(api, { nombre: 'Con foto', imagen_url: url })

    const k = await keys()
    const imagenes: string[] = []
    page.on('request', (r) => {
      if (r.resourceType() === 'image') imagenes.push(r.url())
    })
    await abrirDashboard(page, u, 'productos')
    await page.waitForLoadState('networkidle').catch(() => {})
    expect(imagenes.some((i) => i.includes('/media/productos/'))).toBe(true)
    expect(imagenes.filter((i) => i.includes(new URL(k.url).host))).toEqual([])
  })
})
