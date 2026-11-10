import { type Page } from '@playwright/test'
import { expect, test } from './support/test'
import { appApi, createUser, dbSelect, keys, randomIp, supabase, uniq } from './support/stack'

// Cada test usa su propia IP falsa: el límite de registros (5/h por IP) no los mezcla.
test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': randomIp() })
})

async function entrar(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByPlaceholder('correo@ejemplo.com').fill(email)
  await page.getByPlaceholder('••••••').fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
}

test.describe('Registro', () => {
  test('crea la cuenta, el perfil con prueba de 14 días y entra al onboarding', async ({ page }) => {
    const tag = uniq('reg')
    const email = `${tag}@e2e.test`
    const empresa = `Tienda ${tag}`

    await page.goto('/register')
    await page.getByPlaceholder('Ej. Mi Tienda').fill(empresa)
    await page.getByPlaceholder('correo@ejemplo.com').fill(email)
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('ClaveSegura123')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 })

    const [perfil] = await dbSelect<{ empresa: string; slug: string; plan: string; trial_end: string; role: string }>(
      'profiles',
      `empresa=eq.${encodeURIComponent(empresa)}&select=empresa,slug,plan,trial_end,role`
    )
    expect(perfil.slug).toBe(tag.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ? `tienda-${tag}` : perfil.slug)
    expect(perfil.plan).toBe('business_plus')
    expect(perfil.role).toBe('user')
    const dias = (new Date(perfil.trial_end).getTime() - Date.now()) / 864e5
    expect(dias).toBeGreaterThan(13)
    expect(dias).toBeLessThan(15)
  })

  test('el navegador exige contraseña de 8+ caracteres', async ({ page }) => {
    await page.goto('/register')
    await page.getByPlaceholder('Ej. Mi Tienda').fill('Corta SAC')
    await page.getByPlaceholder('correo@ejemplo.com').fill(`${uniq('corta')}@e2e.test`)
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('abc12')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page).toHaveURL(/\/register$/)
    const invalido = await page.getByPlaceholder('Mínimo 8 caracteres').evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(invalido).toBe(true)
  })

  test('la API valida correo, contraseña y nombre, y rechaza duplicados', async () => {
    const api = await appApi(null)
    const ok = { email: `${uniq('dup')}@e2e.test`, password: 'ClaveSegura123', empresa: 'Dup SAC' }

    expect((await api.post('/api/register', { data: { ...ok, email: 'no-es-correo' } })).status()).toBe(400)
    expect((await api.post('/api/register', { data: { ...ok, password: '1234567' } })).status()).toBe(400)
    expect((await api.post('/api/register', { data: { ...ok, empresa: '' } })).status()).toBe(400)
    expect((await api.post('/api/register', { data: { ...ok, empresa: 'x'.repeat(81) } })).status()).toBe(400)

    const primero = await api.post('/api/register', { data: ok })
    expect(primero.status()).toBe(200)
    expect((await primero.json()).ok).toBe(true)

    const repetido = await api.post('/api/register', { data: { ...ok, empresa: 'Otra Empresa' } })
    expect(repetido.status()).toBe(400)
    // y no deja un perfil huérfano de la segunda empresa
    expect(await dbSelect('profiles', `empresa=eq.${encodeURIComponent('Otra Empresa')}&select=id`)).toHaveLength(0)
  })

  test('dos negocios con el mismo nombre reciben slugs distintos', async () => {
    const api = await appApi(null)
    const empresa = `Mismo Nombre ${uniq('s')}`
    const a = await (await api.post('/api/register', { data: { email: `${uniq('a')}@e2e.test`, password: 'ClaveSegura123', empresa } })).json()
    const b = await (await api.post('/api/register', { data: { email: `${uniq('b')}@e2e.test`, password: 'ClaveSegura123', empresa } })).json()
    expect(a.slug).toBeTruthy()
    expect(b.slug).toBeTruthy()
    expect(a.slug).not.toBe(b.slug)
  })

  test('limita los registros por IP (429 a partir del sexto) pero no cuenta los datos mal escritos', async () => {
    const api = await appApi(null)
    // 10 intentos con datos inválidos no gastan el cupo...
    for (let i = 0; i < 10; i++) {
      expect((await api.post('/api/register', { data: { email: 'malo', password: 'x', empresa: '' } })).status()).toBe(400)
    }
    // ...pero seis registros válidos desde la misma IP sí:
    const codigos: number[] = []
    for (let i = 0; i < 6; i++) {
      const r = await api.post('/api/register', { data: { email: `${uniq('rl')}@e2e.test`, password: 'ClaveSegura123', empresa: `RL ${i}` } })
      codigos.push(r.status())
    }
    expect(codigos.slice(0, 5)).toEqual([200, 200, 200, 200, 200])
    expect(codigos[5]).toBe(429)
  })
})

test.describe('Inicio y cierre de sesión', () => {
  test('entra al dashboard con credenciales correctas', async ({ page }) => {
    const u = await createUser({ empresa: 'Login SAC' })
    await entrar(page, u.email, u.password)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
  })

  test('muestra error con contraseña incorrecta y no entra', async ({ page }) => {
    const u = await createUser()
    await entrar(page, u.email, 'otra-clave-123')
    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('una cuenta desactivada no puede iniciar sesión', async ({ page }) => {
    const u = await createUser()
    const k = await keys()
    const r = await (await appApi(null)).fetch(`${k.url}/auth/v1/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { apikey: k.anonKey, Authorization: `Bearer ${k.serviceKey}`, 'content-type': 'application/json' },
      data: { ban_duration: '876000h' },
    })
    expect(r.ok()).toBe(true)
    await entrar(page, u.email, u.password)
    await expect(page.getByText(/cuenta está desactivada/i)).toBeVisible()
  })

  test('las rutas privadas redirigen a /login sin sesión', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/register$/)
  })

  test('con sesión, /login y /register mandan al dashboard', async ({ page }) => {
    const u = await createUser()
    await entrar(page, u.email, u.password)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard/)
    await page.goto('/register')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('cerrar sesión devuelve a /login y bloquea el dashboard', async ({ page }) => {
    const u = await createUser()
    await entrar(page, u.email, u.password)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
    await page.getByTitle('Cerrar sesión').click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('un usuario normal no ve el panel /admin: lo devuelve al dashboard y la API responde 403', async ({ page }) => {
    const u = await createUser()
    await entrar(page, u.email, u.password)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.getByText('Panel Super Admin')).toBeHidden()
    // con la cookie de sesión del navegador (así llama el panel real)
    const r = await page.request.get('/api/admin/overview')
    expect(r.status(), 'la API de administración debe negar a un usuario normal').toBe(403)
  })

  test('un super admin sí ve el panel /admin', async ({ page }) => {
    const u = await createUser()
    const db = await supabase('service')
    const r = await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, { data: { role: 'super_admin' } })
    expect(r.ok(), 'se asigna el rol desde el servidor').toBe(true)
    await entrar(page, u.email, u.password)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
    await page.goto('/admin')
    await expect(page.getByText('Panel Super Admin')).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/admin/)
  })
})

test.describe('Recuperar contraseña', () => {
  test('pide el enlace, entra con él y cambia la clave', async ({ page }) => {
    const u = await createUser()
    const k = await keys()

    await page.goto('/login')
    await page.getByText('¿Olvidaste tu contraseña?').click()
    await page.getByPlaceholder('correo@ejemplo.com').last().fill(u.email)
    await page.getByRole('button', { name: 'Enviar enlace' }).click()
    await expect(page.getByText('Revisa tu correo')).toBeVisible()

    const buzon = (await (await fetch(`${k.url}/__dev/mailbox`)).json()) as { to: string; type: string; link: string }[]
    const correo = buzon.filter((m) => m.to === u.email && m.type === 'recovery').pop()
    expect(correo, 'debe llegar un correo de recuperación').toBeTruthy()

    // El enlace del correo pasa por /auth/callback (canje del código en el servidor)
    await page.goto(correo!.link)
    await expect(page).toHaveURL(/\/reset-password$/)
    const nueva = 'NuevaClave-456!'
    await page.getByPlaceholder('••••••').first().fill(nueva)
    await page.getByPlaceholder('••••••').last().fill(nueva)
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click()
    await expect(page.getByText('Contraseña actualizada').first()).toBeVisible({ timeout: 15_000 })

    // la clave vieja ya no sirve y la nueva sí
    const api = await appApi(null)
    const viejo = await fetch(`${k.url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: k.anonKey, 'content-type': 'application/json' }, body: JSON.stringify({ email: u.email, password: u.password }) })
    const nuevo = await fetch(`${k.url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: k.anonKey, 'content-type': 'application/json' }, body: JSON.stringify({ email: u.email, password: nueva }) })
    expect(viejo.status).toBe(400)
    expect(nuevo.status).toBe(200)
    await api.dispose()
  })
})
