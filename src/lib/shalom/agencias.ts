import { createDecipheriv, randomBytes } from 'node:crypto'

// =============================================================
// Adaptador a la fuente oficial de agencias de Shalom.
//
// Shalom cambió su protocolo: ya no acepta el token Bearer directo a
// `serviceswebapi.shalomcontrol.com`. Su web actual es un SPA en
// `shalom.com.pe` que usa un proxy con sesión:
//   1. Genera una clave AES aleatoria (P7) por sesión.
//   2. Pide un CSRF a `/api/local/session` pasando P7 como `X-Session-Key`.
//   3. Llama a `/api/v1/web/agencias/listar` con `X-Proxy-Token` (CSRF)
//      y `X-Session-Key` (P7); la respuesta llega cifrada con P7.
//
// Todo esto es reproducible desde el servidor (mismo bundle público).
// Si Shalom cambia algo, basta con actualizar las constantes de abajo.
//
// IMPORTANTE: cualquier fallo (red, token, cifrado) NO lanza excepción:
// devuelve { ok: false } para que el llamante conserve los datos previos
// y el sistema nunca se caiga (fallback automático).
// =============================================================

const BASE_URL = 'https://shalom.com.pe'
const SESSION_PATH = '/api/local/session'
const LISTAR_PATH = '/api/v1/web/agencias/listar'
const VERSION_PATH = '/api/v1/web/agencias/version'

const TIMEOUT_MS = 30000

const HEADERS_BASE = {
  Origin: BASE_URL,
  Referer: `${BASE_URL}/agencias`,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

export type AgenciaShalom = {
  ter_id: number
  etiqueta: string
  departamento: string
  provincia: string
  lugar: string
  direccion: string
  telefono: string
  latitud: string
  longitud: string
  // false = la agencia NO recibe paquetes (centro de acopio interno,
  // solo-envío, pendiente, etc.). Se deriva de `ter_categoria_recibe`.
  recibe: boolean
}

type RawAgencia = {
  ter_id?: number | string
  nombre?: string
  departamento?: string
  provincia?: string
  lugar?: string
  lugar_over?: string
  direccion?: string
  telefono?: string
  latitud?: string
  longitud?: string
  ter_categoria_recibe?: string
}

type Sesion = { csrf: string | null; p7: string }

// Abre una sesión: genera la clave AES aleatoria y pide el CSRF.
async function abrirSesion(): Promise<Sesion | null> {
  const p7 = Buffer.from(randomBytes(32)).toString('base64')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE_URL}${SESSION_PATH}`, {
      headers: {
        ...HEADERS_BASE,
        'X-Requested-With': 'XMLHttpRequest',
        'X-Session-Key': p7,
      },
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error(`[shalom] session HTTP ${res.status}`)
      return null
    }
    const json = (await res.json()) as { csrf?: string }
    return { csrf: json?.csrf ?? null, p7 }
  } catch (e) {
    console.error('[shalom] error abriendo sesión:', e)
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Descifra la respuesta AES-256-CBC con la clave de sesión (P7).
function descifrar(dataB64: string, p7B64: string): string | null {
  try {
    const key = Buffer.from(p7B64, 'base64')
    const dataBytes = Buffer.from(dataB64, 'base64')
    const hex = dataBytes.toString('hex')
    const iv = Buffer.from(hex.substring(0, 32), 'hex')
    const ct = Buffer.from(hex.substring(32), 'hex')
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
  } catch (e) {
    console.error('[shalom] error descifrando respuesta:', e)
    return null
  }
}

// Petición al proxy con la sesión abierta. Devuelve el JSON descifrado o null.
async function peticion(
  path: string,
  sesion: Sesion
): Promise<unknown | null> {
  if (!sesion.csrf) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        ...HEADERS_BASE,
        'Content-Type': 'application/json',
        'X-Proxy-Token': sesion.csrf,
        'X-Session-Key': sesion.p7,
      },
      body: '{}',
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error(`[shalom] HTTP ${res.status} en ${path}`)
      return null
    }
    const json = (await res.json()) as { encrypted?: boolean; data?: string }
    if (json?.encrypted && json.data) {
      const plain = descifrar(json.data, sesion.p7)
      if (plain === null) return null
      return JSON.parse(plain)
    }
    return json
  } catch (e) {
    console.error(`[shalom] error en ${path}:`, e)
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Devuelve { ok:false } si algo falla; nunca lanza.
export async function obtenerAgenciasShalom(): Promise<{
  ok: boolean
  agencias?: AgenciaShalom[]
  version?: number | null
  error?: string
}> {
  try {
    const sesion = await abrirSesion()
    if (!sesion?.csrf) {
      return {
        ok: false,
        error: 'No se pudo abrir sesión con el proxy de Shalom (sin CSRF)',
      }
    }

    const listado = (await peticion(LISTAR_PATH, sesion)) as
      | { success?: boolean; data?: RawAgencia[] }
      | null

    if (!listado?.success || !Array.isArray(listado.data)) {
      return {
        ok: false,
        error: 'El servicio de Shalom no devolvió un listado válido',
      }
    }

    const agencias: AgenciaShalom[] = listado.data
      .filter((raw) => !!raw.ter_id)
      .map((raw) => ({
        ter_id: Number(raw.ter_id),
        etiqueta: (raw.nombre || '').trim(),
        departamento: (raw.departamento || '').trim(),
        provincia: (raw.provincia || '').trim(),
        lugar: ((raw.lugar_over || raw.lugar) || '').trim(),
        direccion: (raw.direccion || '').trim(),
        telefono: (raw.telefono || '').trim(),
        latitud: (raw.latitud || '').trim(),
        longitud: (raw.longitud || '').trim(),
        recibe: ((raw.ter_categoria_recibe || '').trim() !== ''),
      }))

    // Version opcional (para detectar cambios), sin romper si falla.
    let version: number | null = null
    const v = (await peticion(VERSION_PATH, sesion)) as
      | { success?: boolean; data?: number }
      | null
    if (v?.success && typeof v.data === 'number') version = v.data

    return { ok: agencias.length > 0, agencias, version }
  } catch (e) {
    console.error('[shalom] error obteniendo agencias:', e)
    return { ok: false, error: e instanceof Error ? e.message : 'error desconocido' }
  }
}