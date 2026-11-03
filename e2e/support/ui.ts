import type { Page } from '@playwright/test'
import type { TestUser } from './stack'

/** Marca como vistos los tours guiados para que no tapen la pantalla. */
export async function sinTours(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('tori_trayecto_done', 'true')
    for (const id of ['resumen', 'envios', 'ventas', 'productos', 'compras', 'gastos', 'clientes', 'formulario']) {
      localStorage.setItem(`tori_tour_tab-${id}_done`, 'true')
    }
  })
}

/** Inicia sesión por la pantalla de login y abre una pestaña del dashboard. */
export async function abrirDashboard(page: Page, user: Pick<TestUser, 'email' | 'password'>, vista = 'resumen') {
  await sinTours(page)
  await page.goto('/login')
  await page.getByPlaceholder('correo@ejemplo.com').fill(user.email)
  await page.getByPlaceholder('••••••').fill(user.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
  if (vista !== 'resumen') await page.goto(`/dashboard?v=${vista}`)
}
