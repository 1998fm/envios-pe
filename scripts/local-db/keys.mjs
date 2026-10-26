import { SignJWT } from 'jose'

const enc = new TextEncoder()

/** Secreto fijo del stack local (solo desarrollo; no protege nada real). */
export const LOCAL_JWT_SECRET = 'tori-local-jwt-secret-solo-para-desarrollo-0123456789'

/** Claves anon / service_role deterministas: mismo secreto => mismas llaves. */
export function signApiKey(jwtSecret, role) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('supabase-local')
    .setIssuedAt(1700000000)
    .setExpirationTime(4102444800)
    .sign(enc.encode(jwtSecret))
}

/** Llaves y URL del stack local, calculables sin arrancarlo (para los tests). */
export async function localKeys() {
  const secret = process.env.LOCAL_DB_JWT_SECRET || LOCAL_JWT_SECRET
  const port = Number(process.env.LOCAL_DB_PORT || 54321)
  return {
    url: `http://127.0.0.1:${port}`,
    anonKey: await signApiKey(secret, 'anon'),
    serviceKey: await signApiKey(secret, 'service_role'),
    jwtSecret: secret,
  }
}
