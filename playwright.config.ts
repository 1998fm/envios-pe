import { defineConfig, devices } from '@playwright/test'
import { headless, slowMo } from './e2e/support/modo'

// Pruebas e2e contra el stack local (base en memoria + app). No tocan la base real.
//
//   npm run test:e2e           # navegador VISIBLE, a velocidad normal (por defecto)
//   npm run test:e2e:headless  # sin ventana (lo que usa CI)
//   npm run test:e2e:prod      # next build + next start (lo que se despliega)
//   npm run test:e2e:ui        # panel interactivo de Playwright
//
// Variables:
//   E2E_HEADLESS=1   sin ventana (por defecto se activa solo cuando CI=true)
//   E2E_SLOWMO=ms    pausa entre acciones en modo visible (por defecto 550; 0 = sin pausa)
//   E2E_END_PAUSE=ms cuánto queda abierta la ventana al terminar cada test (por defecto 5 x slowMo)
//   E2E_BASE_URL     probar contra una app ya levantada en vez de arrancar la local
//
// Si ya hay una app corriendo en la URL base (npm run dev:local) se reutiliza.

const port = process.env.APP_PORT || '3000'
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${port}`
const prod = process.env.E2E_PROD === '1'
const ci = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Con ventana visible se corre de a un test: así se puede seguir lo que pasa
  // (los tests de API no abren navegador y siguen siendo rápidos).
  fullyParallel: headless,
  workers: headless ? (ci ? 2 : 3) : 1,
  retries: ci ? 1 : 0,
  forbidOnly: ci,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    headless,
    launchOptions: { slowMo, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `node scripts/local-db/dev.mjs${prod ? ' --prod' : ''}`,
        url: `${baseURL}/login`,
        reuseExistingServer: !ci,
        timeout: prod ? 600_000 : 240_000,
        env: { APP_PORT: port },
        stdout: 'pipe',
      },
})
