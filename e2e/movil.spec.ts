import { expect, test } from './support/test'
import { crearGasto, crearPersona, crearProducto, crearVenta } from './support/app'
import { auditarPantalla } from './support/movil'
import { appApi, createUser, randomIp } from './support/stack'
import { sinTours } from './support/ui'

// Vista de celular: ninguna pestaña se corta ni se desplaza de lado, y todo se puede
// usar con el dedo (barra inferior, tarjetas con sus acciones, toque para abrir detalle).

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': randomIp() })
})

for (const vp of [{ w: 390, h: 844 }, { w: 360, h: 740 }]) {
  test.describe(`celular ${vp.w}px`, () => {
    test.use({ viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true })

    test('ninguna pestaña se corta y la navegación funciona con el dedo', async ({ page }) => {
      test.setTimeout(240_000)
      const u = await createUser({ empresa: 'Distribuidora La Esperanza del Norte SAC' })
      const api = await appApi(u.token)
      const productos = []
      for (const n of ['Vestido largo de gasa estampado floral talla M', 'Polo Basic algodón pima', 'Jean Wide Leg tiro alto celeste']) {
        productos.push(await crearProducto(api, { nombre: n, sku: 'SKU-' + n.slice(0, 3).toUpperCase(), stock_actual: 12, precio_venta: 189.9, precio_compra: 95.5 }))
      }
      const persona = await crearPersona(api, { nombre: 'María Fernanda de los Ángeles Quispe Huamán' })
      for (const p of productos) {
        await crearVenta(api, persona, [{ producto_id: p.id, producto_nombre: p.nombre, cantidad: 2, precio_unitario: 189.9 }])
      }
      await crearGasto(api, { concepto: 'Cajas de cartón corrugado para empaque de pedidos', monto: 120, categoria: 'MATERIALES' })
      await api.post('/api/compras', {
        data: { proveedor: 'Importadora Textil del Sur SAC', items: [{ producto_id: productos[0].id, producto_nombre: productos[0].nombre, cantidad: 10, precio_unitario: 80 }] },
      })
      const pub = await appApi(null)
      await pub.post('/api/envios', {
        data: { user_id: u.id, nombre: 'Cliente con nombre largo Apellido Apellido', dni: '45678123', telefono: '987654321', metodo: 'SHALOM', destino: 'San Juan de Lurigancho', direccion: 'Av. Los Próceres de la Independencia 1234', detalle: '2 vestidos largos de gasa' },
      })

      await sinTours(page)
      await page.goto('/login')
      await page.getByPlaceholder('correo@ejemplo.com').fill(u.email)
      await page.getByPlaceholder('••••••').fill(u.password)
      await page.getByRole('button', { name: 'Ingresar' }).click()
      await page.waitForURL(/dashboard/, { timeout: 30_000 })

      // barra inferior: pasar de pestaña con un toque
      const nav = page.getByRole('navigation', { name: 'Secciones' })
      await expect(nav).toBeVisible()

      const vistas = ['resumen', 'envios', 'ventas', 'productos', 'compras', 'gastos', 'clientes', 'formulario']
      for (const v of vistas) {
        await page.goto(v === 'resumen' ? '/dashboard' : `/dashboard?v=${v}`)
        await page.waitForTimeout(2500)
        expect(await auditarPantalla(page), `pestaña ${v}`).toEqual([])
      }
      for (const ruta of ['/login', '/register', `/f/${u.slug}`]) {
        await page.goto(ruta)
        await page.waitForTimeout(1500)
        expect(await auditarPantalla(page), ruta).toEqual([])
      }

      // productos: las acciones están al alcance (antes quedaban fuera de la pantalla)
      await page.goto('/dashboard?v=productos')
      await page.getByRole('button', { name: 'Vista individual y etiquetas', exact: true }).click()
      const editar = page.getByRole('button', { name: 'Editar' }).first()
      await editar.scrollIntoViewIfNeeded({ timeout: 15_000 })
      await expect(editar).toBeInViewport()
      await expect(page.getByRole('button', { name: 'Eliminar' }).first()).toBeVisible()

      // envíos: un toque abre el detalle
      await page.goto('/dashboard?v=envios')
      await page.getByText('Cliente con nombre largo').first().tap()
      await expect(page.getByText('Detalle del pedido')).toBeVisible({ timeout: 10_000 })
      await expect(page.getByRole('button', { name: 'Cerrar', exact: true }).last()).toBeInViewport()
    })
  })
}
