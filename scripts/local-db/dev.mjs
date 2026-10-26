// Levanta el stack local (base en memoria) y la app apuntando a él.
//
//   npm run dev:local              -> next dev
//   npm run dev:local -- --prod    -> next build + next start (para los e2e antes de desplegar)
//   npm run dev:local -- --no-seed -> sin usuario demo
//
// Las variables del stack pisan las de .env.local: nunca toca la base real.

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensurePostgrest } from './setup.mjs'
import { startStack } from './stack.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)
const prod = args.includes('--prod')
const seed = !args.includes('--no-seed')
const appPort = process.env.APP_PORT || process.env.PORT || '3000'

export const DEMO = { email: 'demo@tori.local', password: 'Demo1234!', empresa: 'Demo Tori', slug: 'demo-tori' }

await ensurePostgrest()
const stack = await startStack({ autoconfirm: process.env.LOCAL_DB_AUTOCONFIRM !== '0' })

if (seed) {
  const u = await stack.createUser({ email: DEMO.email, password: DEMO.password, confirmed: true })
  await stack.pool.query(
    `INSERT INTO profiles (id, empresa, slug, plan, trial_end, metodo_motorizado, metodo_shalom, logistica_moto_dias)
     VALUES ($1, $2, $3, 'business_plus', now() + interval '30 days', true, true, '{MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY}')`,
    [u.id, DEMO.empresa, DEMO.slug]
  )
  await stack.pool.query(
    `INSERT INTO productos (profile_id, nombre, precio_venta, precio_compra, stock_actual, stock_minimo)
     VALUES ($1, 'Vestido Luna', 89, 40, 24, 3), ($1, 'Polo Basic', 45, 18, 7, 3), ($1, 'Jean Wide', 99, 50, 18, 3)`,
    [u.id]
  )
  console.log(`[local-db] usuario demo: ${DEMO.email} / ${DEMO.password}  (formulario: /f/${DEMO.slug})`)
}

// Secretos de prueba (solo este proceso): los e2e los usan para probar cron y webhook.
export const TEST_SECRETS = { CRON_SECRET: 'local-cron-secret', MP_WEBHOOK_SECRET: 'local-webhook-secret' }
// La app lee la base solo con variables PRIVADAS del servidor. Las NEXT_PUBLIC_*
// se dejan vacías a propósito: así, si algún componente de navegador volviera a
// referenciarlas, el e2e de "no leaks" lo detecta (y nada real se filtra).
const env = {
  ...process.env,
  SUPABASE_URL: stack.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: stack.anonKey,
  SUPABASE_SERVICE_ROLE_KEY: stack.serviceKey,
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
  ...TEST_SECRETS,
  MP_ACCESS_TOKEN: '',
  NEXT_DIST_DIR: '.next-local',
}
const next = (...a) => spawn(process.execPath, [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), ...a], { cwd: root, env, stdio: 'inherit' })

let child
async function shutdown(code = 0) {
  child?.kill()
  await stack.stop()
  process.exit(code)
}
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

if (prod) {
  console.log('[local-db] next build…')
  const build = next('build')
  const code = await new Promise((r) => build.on('exit', r))
  if (code !== 0) await shutdown(code ?? 1)
  child = next('start', '-p', appPort)
} else {
  child = next('dev', '-p', appPort)
}
child.on('exit', (c) => shutdown(c ?? 0))
