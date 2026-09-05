import {
  createHmac,
  createDecipheriv,
  randomUUID,
} from 'node:crypto'

// =============================================================
// Adaptador a la fuente oficial de agencias de Shalom
// (la misma que usa shalom.com.pe en su página de agencias).
//
// El endpoint está protegido con:
//   - Token Bearer: HMAC-SHA256 firmado con un secreto que Shalom
//     expone en su bundle público.
//   - Respuesta cifrada AES-256-CBC con una clave también expuesta.
//
// Estos valores están hardcodeados en el JS público de Shalom, así
// que son reproducibles desde el servidor. Si algún día Shalom los
// cambia, basta con actualizar las constantes de abajo.
//
// IMPORTANTE: cualquier fallo (red, token, cifrado) NO lanza excepción:
// devuelve { ok: false } para que el llamante conserve los datos previos
// y el sistema nunca se caiga (fallback automático).
// =============================================================

const BASE_URL = 'https://serviceswebapi.shalomcontrol.com'
const LISTAR_PATH = '/api/v1/web/agencias/listar'
const VERSION_PATH = '/api/v1/web/agencias/version'

// Secretos/token (públicos en el bundle de Shalom, ver docs)
const HMAC_SECRET = '.Ov3rsku112024l4r43l.'
const AES_KEY_B64 = 'uQn/bQ94PXBEfId70zjN+VE1hSU7kh9VBXTOUd68Ssc='

const TIMEOUT_MS = 30000

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

function generarToken(): string {
  const s = `web-${randomUUID()}`
  const o = Math.floor(Date.now() / 1000) + 300
  const t = `${s}@${o}`
  const a = createHmac('sha256', HMAC_SECRET).update(t).digest('hex')
  return `${t}@${a}`
}

// Descifra la respuesta AES-256-CBC (mismo algoritmo que el bundle de Shalom).
function descifrar(dataB64: string): string | null {
  try {
    const key = Buffer.from(AES_KEY_B64, 'base64')
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

async function peticion(path: string): Promise<unknown | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${generarToken()}`,
        'Content-Type': 'application/json',
        Origin: 'https://shalom.com.pe',
        Referer: 'https://shalom.com.pe/agencias',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
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
      const plain = descifrar(json.data)
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
}> {
  try {
    const listado = (await peticion(LISTAR_PATH)) as
      | { success?: boolean; data?: RawAgencia[] }
      | null

    if (!listado?.success || !Array.isArray(listado.data)) {
      return { ok: false }
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
    const v = (await peticion(VERSION_PATH)) as
      | { success?: boolean; data?: number }
      | null
    if (v?.success && typeof v.data === 'number') version = v.data

    return { ok: agencias.length > 0, agencias, version }
  } catch (e) {
    console.error('[shalom] error obteniendo agencias:', e)
    return { ok: false }
  }
}
