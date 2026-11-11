// Gateway local estilo Supabase (un solo puerto):
//   /auth/v1/*   -> emulación mínima de GoTrue (esta archivo)
//   /rest/v1/*   -> PostgREST real
//   /storage/v1  -> emulación mínima de Storage (archivos en memoria)
// Solo para desarrollo y pruebas.

import http from 'node:http'
import crypto from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { signApiKey } from './keys.mjs'

const enc = new TextEncoder()

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 32).toString('hex')
  return `scrypt$${salt}$${hash}`
}

function checkPassword(password, stored) {
  if (!stored) return false
  const [, salt, hash] = stored.split('$')
  const test = crypto.scryptSync(password, salt, 32).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'))
}

/** Crea un usuario directo en auth.users (usado por el seed y por /signup). */
export async function createUserDirect(pool, { email, password, confirmed = true, userMeta = {}, appMeta = {} }) {
  const { rows } = await pool.query(
    `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      email.toLowerCase(),
      hashPassword(password),
      confirmed ? new Date() : null,
      JSON.stringify(userMeta),
      JSON.stringify({ provider: 'email', providers: ['email'], ...appMeta }),
    ]
  )
  return rows[0]
}

export function createGateway({ pool, jwtSecret, postgrestPort, port, autoconfirm = true }) {
  const secret = enc.encode(jwtSecret)
  const baseUrl = `http://127.0.0.1:${port}`
  const mailbox = []
  const otps = new Map() // token -> { userId, type, redirectTo, challenge?, method? }
  const authCodes = new Map() // code PKCE -> { userId, challenge, method, type }
  const buckets = new Map([['logos', { id: 'logos', name: 'logos', public: true }], ['productos', { id: 'productos', name: 'productos', public: true }]])
  const files = new Map() // "bucket/path" -> { buffer, type }

  // ---------- JWT ----------
  const signKey = (role) => signApiKey(jwtSecret, role)

  async function accessToken(user) {
    return new SignJWT({
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      phone: '',
      app_metadata: user.raw_app_meta_data,
      user_metadata: user.raw_user_meta_data,
      aal: 'aal1',
      session_id: crypto.randomUUID(),
      is_anonymous: false,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(user.id)
      .setIssuer(`${baseUrl}/auth/v1`)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)
  }

  async function verifyBearer(req) {
    const h = req.headers.authorization || ''
    if (!h.toLowerCase().startsWith('bearer ')) return null
    try {
      const { payload } = await jwtVerify(h.slice(7).trim(), secret)
      return payload
    } catch {
      return null
    }
  }

  // ---------- helpers de respuesta ----------
  function userJson(u) {
    return {
      id: u.id,
      aud: u.aud,
      role: u.role,
      email: u.email,
      phone: '',
      email_confirmed_at: u.email_confirmed_at,
      confirmed_at: u.email_confirmed_at,
      last_sign_in_at: u.last_sign_in_at,
      app_metadata: u.raw_app_meta_data,
      user_metadata: u.raw_user_meta_data,
      identities: [
        {
          id: u.id,
          user_id: u.id,
          identity_data: { email: u.email, sub: u.id },
          provider: 'email',
          created_at: u.created_at,
          updated_at: u.updated_at,
        },
      ],
      created_at: u.created_at,
      updated_at: u.updated_at,
      banned_until: u.banned_until,
      is_anonymous: false,
    }
  }

  async function sessionFor(u) {
    const refresh = crypto.randomBytes(24).toString('base64url')
    await pool.query('INSERT INTO auth.refresh_tokens (token, user_id) VALUES ($1, $2)', [refresh, u.id])
    await pool.query('UPDATE auth.users SET last_sign_in_at = now() WHERE id = $1', [u.id])
    const token = await accessToken(u)
    return {
      access_token: token,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: refresh,
      user: userJson(u),
    }
  }

  const CORS = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-expose-headers': 'content-range,x-total-count,link',
  }

  function send(res, status, body, extra = {}) {
    const data = body === undefined ? '' : JSON.stringify(body)
    res.writeHead(status, { 'content-type': 'application/json', ...CORS, ...extra })
    res.end(data)
  }
  const fail = (res, status, error_code, msg) => send(res, status, { code: status, error_code, msg })

  async function readJson(req) {
    const chunks = []
    for await (const c of req) chunks.push(c)
    const raw = Buffer.concat(chunks).toString('utf8')
    if (!raw) return {}
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }

  async function getUserByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM auth.users WHERE email = $1', [email.toLowerCase()])
    return rows[0]
  }
  async function getUserById(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined
    const { rows } = await pool.query('SELECT * FROM auth.users WHERE id = $1', [id])
    return rows[0]
  }

  function isBanned(u) {
    return u.banned_until && new Date(u.banned_until) > new Date()
  }

  function captureMail(to, type, link) {
    mailbox.push({ to, type, link, at: new Date().toISOString() })
  }

  async function newOtp(user, type, redirectTo, pkce = {}) {
    const token = crypto.randomBytes(16).toString('hex')
    otps.set(token, { userId: user.id, type, redirectTo, ...pkce })
    return token
  }

  // ---------- /auth/v1 ----------
  async function handleAuth(req, res, url) {
    const route = url.pathname.replace(/^\/auth\/v1/, '')
    const m = req.method

    if (route === '/settings' && m === 'GET') {
      return send(res, 200, {
        external: { email: true },
        disable_signup: false,
        mailer_autoconfirm: autoconfirm,
      })
    }
    if (route === '/.well-known/jwks.json') return send(res, 200, { keys: [] })

    if (route === '/signup' && m === 'POST') {
      const b = await readJson(req)
      const email = String(b.email || '').trim().toLowerCase()
      const password = String(b.password || '')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 422, 'validation_failed', 'Unable to validate email address: invalid format')
      if (password.length < 6) return fail(res, 422, 'weak_password', 'Password should be at least 6 characters.')
      const existing = await getUserByEmail(email)
      if (existing) {
        if (autoconfirm) return fail(res, 422, 'user_already_exists', 'User already registered')
        // Con confirmación activa GoTrue no revela si el correo existe.
        return send(res, 200, { ...userJson(existing), id: crypto.randomUUID(), identities: [] })
      }
      const u = await createUserDirect(pool, { email, password, confirmed: autoconfirm, userMeta: b.data || {} })
      if (autoconfirm) return send(res, 200, await sessionFor(u))
      const token = await newOtp(u, 'signup', null)
      captureMail(email, 'signup', `${baseUrl}/auth/v1/verify?token=${token}&type=signup`)
      return send(res, 200, userJson(u))
    }

    if (route === '/token' && m === 'POST') {
      const grant = url.searchParams.get('grant_type')
      const b = await readJson(req)
      if (grant === 'password') {
        const u = await getUserByEmail(String(b.email || ''))
        if (!u || !checkPassword(String(b.password || ''), u.encrypted_password)) {
          return fail(res, 400, 'invalid_credentials', 'Invalid login credentials')
        }
        if (isBanned(u)) return fail(res, 400, 'user_banned', 'User is banned')
        if (!u.email_confirmed_at) return fail(res, 400, 'email_not_confirmed', 'Email not confirmed')
        return send(res, 200, await sessionFor(u))
      }
      if (grant === 'refresh_token') {
        const { rows } = await pool.query(
          'UPDATE auth.refresh_tokens SET revoked = true WHERE token = $1 AND revoked = false RETURNING user_id',
          [String(b.refresh_token || '')]
        )
        if (!rows[0]) return fail(res, 400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found')
        const u = await getUserById(rows[0].user_id)
        if (!u || isBanned(u)) return fail(res, 400, 'user_banned', 'User is banned')
        return send(res, 200, await sessionFor(u))
      }
      if (grant === 'pkce') {
        const entry = authCodes.get(String(b.auth_code || ''))
        authCodes.delete(String(b.auth_code || ''))
        if (!entry) return fail(res, 400, 'flow_state_not_found', 'invalid flow state, no valid flow state found')
        const verifier = String(b.code_verifier || '')
        const computed =
          entry.method === 'plain' ? verifier : crypto.createHash('sha256').update(verifier).digest('base64url')
        if (computed !== entry.challenge) return fail(res, 400, 'bad_code_verifier', 'code challenge does not match previously saved code verifier')
        const u = await getUserById(entry.userId)
        return send(res, 200, await sessionFor(u))
      }
      return fail(res, 400, 'validation_failed', 'unsupported grant_type')
    }

    if (route === '/user') {
      const claims = await verifyBearer(req)
      if (!claims?.sub || claims.role !== 'authenticated') return fail(res, 401, 'bad_jwt', 'invalid JWT')
      const u = await getUserById(claims.sub)
      if (!u || isBanned(u)) return fail(res, 401, 'user_not_found', 'User from sub claim in JWT does not exist')
      if (m === 'GET') return send(res, 200, userJson(u))
      if (m === 'PUT') {
        const b = await readJson(req)
        if (b.password) {
          if (String(b.password).length < 6) return fail(res, 422, 'weak_password', 'Password should be at least 6 characters.')
          await pool.query('UPDATE auth.users SET encrypted_password = $2, updated_at = now() WHERE id = $1', [u.id, hashPassword(String(b.password))])
        }
        if (b.data) {
          await pool.query('UPDATE auth.users SET raw_user_meta_data = $2, updated_at = now() WHERE id = $1', [u.id, JSON.stringify({ ...u.raw_user_meta_data, ...b.data })])
        }
        return send(res, 200, userJson(await getUserById(u.id)))
      }
    }

    if (route === '/logout' && m === 'POST') {
      res.writeHead(204, CORS)
      return res.end()
    }

    if (route === '/recover' && m === 'POST') {
      const b = await readJson(req)
      const u = await getUserByEmail(String(b.email || ''))
      if (u) {
        const token = await newOtp(u, 'recovery', url.searchParams.get('redirect_to'), {
          challenge: b.code_challenge,
          method: b.code_challenge_method,
        })
        captureMail(u.email, 'recovery', `${baseUrl}/auth/v1/verify?token=${token}&type=recovery`)
      }
      return send(res, 200, {})
    }

    if (route === '/verify' && m === 'POST') {
      const b = await readJson(req)
      const token = String(b.token_hash || b.token || '')
      const entry = otps.get(token)
      if (!entry) return fail(res, 403, 'otp_expired', 'Email link is invalid or has expired')
      otps.delete(token)
      const u = await getUserById(entry.userId)
      if (!u.email_confirmed_at) {
        await pool.query('UPDATE auth.users SET email_confirmed_at = now() WHERE id = $1', [u.id])
      }
      return send(res, 200, await sessionFor(await getUserById(u.id)))
    }

    if (route === '/verify' && m === 'GET') {
      const token = url.searchParams.get('token') || ''
      const entry = otps.get(token)
      if (!entry) return fail(res, 400, 'otp_expired', 'Email link is invalid or has expired')
      otps.delete(token)
      const u = await getUserById(entry.userId)
      if (!u.email_confirmed_at) {
        await pool.query('UPDATE auth.users SET email_confirmed_at = now() WHERE id = $1', [u.id])
      }
      const dest = url.searchParams.get('redirect_to') || entry.redirectTo || `${baseUrl}/`
      if (entry.challenge) {
        // Flujo PKCE: se devuelve un código de un solo uso que la app canjea por la sesión.
        const code = crypto.randomBytes(16).toString('hex')
        authCodes.set(code, { userId: u.id, challenge: entry.challenge, method: entry.method, type: entry.type })
        res.writeHead(302, { location: `${dest}${dest.includes('?') ? '&' : '?'}code=${code}`, ...CORS })
        return res.end()
      }
      const s = await sessionFor(await getUserById(u.id))
      const hash = `access_token=${s.access_token}&refresh_token=${s.refresh_token}&expires_in=3600&token_type=bearer&type=${entry.type}`
      res.writeHead(302, { location: `${dest}#${hash}`, ...CORS })
      return res.end()
    }

    // ---- admin (solo service_role) ----
    if (route.startsWith('/admin/')) {
      const claims = await verifyBearer(req)
      if (claims?.role !== 'service_role') return fail(res, 403, 'not_admin', 'User not allowed')

      if (route === '/admin/users' && m === 'POST') {
        const b = await readJson(req)
        const email = String(b.email || '').trim().toLowerCase()
        if (await getUserByEmail(email)) return fail(res, 422, 'email_exists', 'A user with this email address has already been registered')
        const u = await createUserDirect(pool, {
          email,
          password: String(b.password || crypto.randomBytes(12).toString('hex')),
          confirmed: b.email_confirm === true,
          userMeta: b.user_metadata || {},
          appMeta: b.app_metadata || {},
        })
        return send(res, 200, userJson(u))
      }
      if (route === '/admin/users' && m === 'GET') {
        const perPage = Math.min(Number(url.searchParams.get('per_page')) || 50, 1000)
        const page = Math.max(Number(url.searchParams.get('page')) || 1, 1)
        const { rows } = await pool.query('SELECT * FROM auth.users ORDER BY created_at LIMIT $1 OFFSET $2', [perPage, (page - 1) * perPage])
        return send(res, 200, { users: rows.map(userJson), aud: 'authenticated' })
      }
      const mu = route.match(/^\/admin\/users\/([^/]+)$/)
      if (mu) {
        const u = await getUserById(mu[1])
        if (!u) return fail(res, 404, 'user_not_found', 'User not found')
        if (m === 'GET') return send(res, 200, userJson(u))
        if (m === 'DELETE') {
          await pool.query('DELETE FROM auth.users WHERE id = $1', [u.id])
          return send(res, 200, {})
        }
        if (m === 'PUT') {
          const b = await readJson(req)
          if (b.password) await pool.query('UPDATE auth.users SET encrypted_password = $2 WHERE id = $1', [u.id, hashPassword(String(b.password))])
          if (b.email_confirm === true) await pool.query('UPDATE auth.users SET email_confirmed_at = coalesce(email_confirmed_at, now()) WHERE id = $1', [u.id])
          if (b.email) await pool.query('UPDATE auth.users SET email = $2 WHERE id = $1', [u.id, String(b.email).toLowerCase()])
          if (b.user_metadata) await pool.query('UPDATE auth.users SET raw_user_meta_data = $2 WHERE id = $1', [u.id, JSON.stringify({ ...u.raw_user_meta_data, ...b.user_metadata })])
          if (b.app_metadata) await pool.query('UPDATE auth.users SET raw_app_meta_data = $2 WHERE id = $1', [u.id, JSON.stringify({ ...u.raw_app_meta_data, ...b.app_metadata })])
          if (b.ban_duration) {
            const sql = b.ban_duration === 'none' ? 'UPDATE auth.users SET banned_until = NULL WHERE id = $1' : "UPDATE auth.users SET banned_until = now() + interval '100 years' WHERE id = $1"
            await pool.query(sql, [u.id])
          }
          await pool.query('UPDATE auth.users SET updated_at = now() WHERE id = $1', [u.id])
          return send(res, 200, userJson(await getUserById(u.id)))
        }
      }
      if (route === '/admin/generate_link' && m === 'POST') {
        const b = await readJson(req)
        const u = await getUserByEmail(String(b.email || ''))
        if (!u) return fail(res, 404, 'user_not_found', 'User not found')
        const type = b.type || 'magiclink'
        const redirectTo = b.redirectTo || b.options?.redirectTo || b.redirect_to || `${baseUrl}/`
        const token = await newOtp(u, type, redirectTo)
        const link = `${baseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`
        return send(res, 200, {
          ...userJson(u),
          action_link: link, email_otp: token.slice(0, 6), hashed_token: token, redirect_to: redirectTo, verification_type: type,
        })
      }
    }

    return fail(res, 404, 'not_found', `Ruta de auth no emulada: ${m} ${route}`)
  }

  // ---------- /storage/v1 (en memoria) ----------
  async function handleStorage(req, res, url) {
    const route = url.pathname.replace(/^\/storage\/v1/, '')
    const claims = await verifyBearer(req)
    const service = claims?.role === 'service_role'
    const bucketGet = route.match(/^\/bucket\/([^/]+)$/)
    if (bucketGet && req.method === 'GET') {
      if (!service) return fail(res, 403, 'forbidden', 'Not authorized')
      const bucket = buckets.get(bucketGet[1])
      return bucket ? send(res, 200, bucket) : fail(res, 404, 'not_found', 'Bucket not found')
    }
    if (route === '/bucket' && req.method === 'POST') {
      if (!service) return fail(res, 403, 'forbidden', 'Not authorized')
      const b = await readJson(req)
      if (buckets.has(b.id ?? b.name)) return fail(res, 409, 'Duplicate', 'Bucket already exists')
      buckets.set(b.id ?? b.name, { ...b, id: b.id ?? b.name })
      return send(res, 200, { name: b.name })
    }
    const listing = route.match(/^\/object\/list\/([^/]+)$/)
    if (listing && req.method === 'POST') {
      const bucket = buckets.get(listing[1])
      if (!bucket) return fail(res, 404, 'not_found', 'Bucket not found')
      if (!bucket.public && !service) return fail(res, 403, 'forbidden', 'Not authorized')
      const b = await readJson(req)
      const prefix = `${listing[1]}/${b.prefix ? b.prefix + '/' : ''}`
      const result = [...files.entries()].filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes('/')).map(([key, f]) => ({ name: key.slice(prefix.length), id: key, created_at: f.created_at, updated_at: f.created_at, metadata: { size: f.buffer.length } }))
      result.sort((a, b) => a.name.localeCompare(b.name))
      if (b.sortBy?.order === 'desc') result.reverse()
      return send(res, 200, result.slice(b.offset || 0, (b.offset || 0) + (b.limit || 100)))
    }
    const objectMatch = route.match(/^\/object\/(?:(public|authenticated)\/)?([^/]+)\/(.+)$/)

    if (objectMatch && req.method === 'GET') {
      const [, kind, bucket, path] = objectMatch
      if (buckets.get(bucket)?.public === false && !service) return fail(res, 403, 'forbidden', 'Not authorized')
      const f = files.get(`${bucket}/${decodeURIComponent(path)}`)
      if (!f) return fail(res, 404, 'not_found', 'Object not found')
      res.writeHead(200, { 'content-type': f.type, ...CORS })
      return res.end(f.buffer)
    }
    if (!claims) return fail(res, 401, 'bad_jwt', 'invalid JWT')

    if (objectMatch && (req.method === 'POST' || req.method === 'PUT')) {
      const [, , bucket, path] = objectMatch
      if (buckets.get(bucket)?.public === false && !service) return fail(res, 403, 'forbidden', 'Not authorized')
      const chunks = []
      for await (const c of req) chunks.push(c)
      const key = `${bucket}/${decodeURIComponent(path)}`
      if (files.has(key) && req.method === 'POST' && req.headers['x-upsert'] !== 'true') {
        return fail(res, 400, 'Duplicate', 'The resource already exists')
      }
      files.set(key, { buffer: Buffer.concat(chunks), type: req.headers['content-type'] || 'application/octet-stream', created_at: new Date().toISOString() })
      return send(res, 200, { Key: key, Id: crypto.randomUUID() })
    }
    if (route.match(/^\/object\/([^/]+)$/) && req.method === 'DELETE') {
      const bucket = route.split('/')[2]
      if (buckets.get(bucket)?.public === false && !service) return fail(res, 403, 'forbidden', 'Not authorized')
      const b = await readJson(req)
      for (const p of b.prefixes || []) files.delete(`${bucket}/${p}`)
      return send(res, 200, (b.prefixes || []).map((name) => ({ name })))
    }
    return fail(res, 404, 'not_found', `Storage no emulado: ${req.method} ${route}`)
  }

  // ---------- proxy a PostgREST ----------
  function proxyRest(req, res, url) {
    const path = url.pathname.replace(/^\/rest\/v1/, '') || '/'
    const headers = { ...req.headers, host: `127.0.0.1:${postgrestPort}` }
    delete headers.connection
    const up = http.request(
      { host: '127.0.0.1', port: postgrestPort, method: req.method, path: path + url.search, headers },
      (r) => {
        res.writeHead(r.statusCode || 502, { ...r.headers, ...CORS })
        r.pipe(res)
      }
    )
    up.on('error', (e) => fail(res, 502, 'postgrest_down', `PostgREST no responde: ${e.message}`))
    req.pipe(up)
  }

  // ---------- servidor ----------
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, baseUrl)
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, { ...CORS, 'access-control-allow-headers': req.headers['access-control-request-headers'] || '*', 'access-control-max-age': '86400' })
        return res.end()
      }
      if (url.pathname.startsWith('/auth/v1')) return await handleAuth(req, res, url)
      if (url.pathname.startsWith('/rest/v1')) return proxyRest(req, res, url)
      if (url.pathname.startsWith('/storage/v1')) return await handleStorage(req, res, url)
      if (url.pathname === '/__dev/mailbox') return send(res, 200, mailbox)
      if (url.pathname === '/__dev/health') return send(res, 200, { ok: true })
      return fail(res, 404, 'not_found', `No emulado en el stack local: ${url.pathname}`)
    } catch (e) {
      console.error('[gateway]', e)
      return fail(res, 500, 'unexpected_failure', String(e?.message || e))
    }
  })

  return {
    server,
    mailbox,
    signKey,
    listen: () => new Promise((ok) => server.listen(port, '127.0.0.1', ok)),
    close: () => new Promise((ok) => server.close(ok)),
  }
}
