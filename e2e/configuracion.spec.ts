import type { Page } from '@playwright/test'
import { expect, test } from './support/test'
import { createUser, dbSelect, randomIp } from './support/stack'
import { abrirDashboard } from './support/ui'

async function abrirConfiguracion(page: Page) {
  // En escritorio la barra lateral está siempre abierta.
  const abrir = page.getByTitle('Abrir menú', { exact: true })
  await abrir.hover()
  await page.locator('[data-tour="configuracion"]').click()
}

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': randomIp() })
})

// El botón Guardar del modal de Configuración debe dejar los cambios en la base y
// volver a mostrarlos al recargar (antes no había ninguna prueba de punta a punta).
test('Configuración: Guardar persiste en la base y se ve al recargar', async ({ page }) => {
  const errores: string[] = []
  page.on('pageerror', (e) => errores.push(e.message))
  const u = await createUser({ empresa: 'Negocio Config SAC' })
  await abrirDashboard(page, u)

  await abrirConfiguracion(page)
  await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible()

  // Empresa: teléfono
  await page.getByPlaceholder('Teléfono', { exact: true }).first().fill('987654321')

  // La ayuda debe reproducirse sin perder el cambio que todavía no se guardó.
  await page.getByRole('button', { name: 'Ver tutorial de configuración', exact: true }).click()
  const ayuda = page.getByRole('dialog', { name: 'Cómo configurar tu negocio', exact: true })
  await expect(ayuda).toBeVisible()
  await expect(ayuda.locator('video source')).toHaveAttribute('src', '/recursos/configuracion/configuracion.mp4')
  await expect.poll(() => ayuda.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(0)
  await page.setViewportSize({ width: 360, height: 740 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(ayuda).toHaveCount(0)
  await expect(page.getByPlaceholder('Teléfono', { exact: true }).first()).toHaveValue('987654321')
  await expect(page.getByRole('button', { name: 'Ver tutorial de configuración', exact: true })).toBeFocused()
  await page.setViewportSize({ width: 1280, height: 720 })

  // Logística: anticipación de 3 días
  await page.getByRole('button', { name: 'Logística' }).click()
  const antic = page.locator('input[inputmode="numeric"]').first()
  await antic.fill('3')

  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.getByText('Configuración guardada')).toBeVisible({ timeout: 10_000 })

  const [perfil] = await dbSelect<{ telefono: string; logistica_moto_anticipacion: number }>(
    'profiles',
    `select=telefono,logistica_moto_anticipacion&id=eq.${u.id}`
  )
  expect(perfil.telefono).toBe('987654321')
  expect(perfil.logistica_moto_anticipacion).toBe(3)

  await page.reload()
  await abrirConfiguracion(page)
  await page.getByRole('button', { name: 'Logística' }).click()
  await expect(page.locator('input[inputmode="numeric"]').first()).toHaveValue('3')
  expect(errores).toEqual([])
})
