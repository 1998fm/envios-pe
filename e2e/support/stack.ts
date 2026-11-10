import { randomUUID } from 'node:crypto'
import { request, type APIRequestContext } from '@playwright/test'
import { localKeys } from '../../scripts/local-db/keys.mjs'

// Acceso a la base local desde los tests: crea usuarios y datos de prueba con la
// service role, y abre sesiones HTTP "como" un usuario (Bearer), sin pasar por la UI.

const appPort = process.env.APP_PORT || '3000'
export const APP_URL = process.env.E2E_BASE_URL || `http://localhost:${appPort}`

type Keys = Awaited<ReturnType<typeof localKeys>>
let keysPromise: Promise<Keys> | undefined
export const keys = () => (keysPromise ??= localKeys())

/** IP falsa única por contexto: cada test tiene su propio cupo de rate limit. */
export const randomIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`

export const uniq = (p = 'e2e') => `${p}-${randomUUID().slice(0, 8)}`

export async function supabase(role: 'service' | 'anon' | { token: string }): Promise<APIRequestContext> {
  const k = await keys()
  const bearer = role === 'service' ? k.serviceKey : role === 'anon' ? k.anonKey : role.token
  return request.newContext({
    baseURL: k.url,
    extraHTTPHeaders: { apikey: k.anonKey, Authorization: `Bearer ${bearer}`, 'content-type': 'application/json', Prefer: 'return=representation' },
  })
}

export type TestUser = {
  id: string
  email: string
  password: string
  empresa: string
  slug: string
  token: string
}

export async function login(email: string, password: string): Promise<string> {
  const k = await keys()
  const ctx = await request.newContext({ baseURL: k.url, extraHTTPHeaders: { apikey: k.anonKey } })
  const res = await ctx.post('/auth/v1/token?grant_type=password', { data: { email, password } })
  if (!res.ok()) throw new Error(`login ${email}: ${res.status()} ${await res.text()}`)
  const j = await res.json()
  await ctx.dispose()
  return j.access_token
}

/** Crea un usuario confirmado con su perfil. Por defecto: dueño con Business Plus en prueba. */
export async function createUser(opts: { empresa?: string; plan?: 'basic' | 'pro' | 'business_plus'; trial?: boolean } = {}): Promise<TestUser> {
  const k = await keys()
  const tag = uniq('u')
  const email = `${tag}@e2e.test`
  const password = 'E2e-Pass-123!'
  const empresa = opts.empresa ?? `Negocio ${tag}`
  const slug = tag
  const plan = opts.plan ?? 'business_plus'

  const admin = await request.newContext({
    baseURL: k.url,
    extraHTTPHeaders: { apikey: k.anonKey, Authorization: `Bearer ${k.serviceKey}`, 'content-type': 'application/json' },
  })
  const created = await admin.post('/auth/v1/admin/users', { data: { email, password, email_confirm: true } })
  if (!created.ok()) throw new Error(`crear usuario: ${created.status()} ${await created.text()}`)
  const id = (await created.json()).id as string
  await admin.dispose()

  const db = await supabase('service')
  const trialEnd = plan !== 'basic' && opts.trial !== false ? new Date(Date.now() + 14 * 864e5).toISOString() : null
  const prof = await db.post('/rest/v1/profiles', {
    data: { id, empresa, slug, plan, trial_end: trialEnd, metodo_motorizado: true, metodo_shalom: true, logistica_moto_dias: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] },
  })
  if (!prof.ok()) throw new Error(`crear perfil: ${prof.status()} ${await prof.text()}`)
  await db.dispose()

  return { id, email, password, empresa, slug, token: await login(email, password) }
}

/** Cliente HTTP hacia la app autenticado como `token` (null = sin sesión). */
export async function appApi(token: string | null): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: APP_URL,
    extraHTTPHeaders: { 'x-forwarded-for': randomIp(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
}

export async function dbInsert<T = Record<string, unknown>>(table: string, row: Record<string, unknown>): Promise<T> {
  const db = await supabase('service')
  const res = await db.post(`/rest/v1/${table}`, { data: row })
  if (!res.ok()) throw new Error(`insert ${table}: ${res.status()} ${await res.text()}`)
  const out = (await res.json())[0] as T
  await db.dispose()
  return out
}

export async function dbSelect<T = Record<string, unknown>>(table: string, query: string): Promise<T[]> {
  const db = await supabase('service')
  const res = await db.get(`/rest/v1/${table}?${query}`)
  if (!res.ok()) throw new Error(`select ${table}: ${res.status()} ${await res.text()}`)
  const out = (await res.json()) as T[]
  await db.dispose()
  return out
}
