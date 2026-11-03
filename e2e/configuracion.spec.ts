import type { Page } from '@playwright/test'
import { expect, test } from './support/test'
import { createUser, dbSelect, randomIp } from './support/stack'
import { abrirDashboard } from './support/ui'

async function abrirConfiguracion(page: Page) {
  // En escritorio la barra lateral está siempre abierta.
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
