// =============================================================
// Adaptador a la fuente oficial de agencias de Olva courier
// (la misma que usa olvacourier.com en su página "Ubícanos").
//
// La página carga la lista vía un endpoint AJAX público de
// WordPress (action=get_olva_stores) que devuelve todas las
// tiendas con departamento, provincia, distrito, dirección y
// horarios en JSON. No requiere token ni cifrado.
//
// IMPORTANTE: el sitio tiene un WAF (nginx) que responde 403 a
// peticiones con firma de "bot" o en ráfaga. Por eso este adaptador
// imita a un navegador:
//   1) Primero "calienta" cargando la página /ubicanos/.
//   2) Captura cookies si el sitio las emite.
//   3) Llama al AJAX con headers de navegador y con espacios entre
//      reintentos (2s / 6s / 12s).
//
// Si aún así falla (por ejemplo, si el WAF bloquea IPs de datacenter),
// se conserva la lista previa; el sistema nunca se cae.
// =============================================================

const PAGE_URL = 'https://www.olvacourier.com/ubicanos/'
const BASE_URL =
  'https://www.olvacourier.com/wp-admin/admin-ajax.php?action=get_olva_stores'

const TIMEOUT_MS = 30000

const INTENTOS = 3
const ESPERAS_MS = [2000, 6000, 12000]

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const HEADERS_NAVEGADOR = {
  'User-Agent': UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
}

const HEADERS_AJAX = {
  'User-Agent': UA,
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
  Referer: PAGE_URL,
  'X-Requested-With': 'XMLHttpRequest',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
}

export type AgenciaOlva = {
  office_id: string
  nombres: string
  direccion: string
  department: string
  province: string
  district: string
  office_type: string
  lat: string
  lng: string
}

type RawAgencia = {
  office_id?: number | string
  nombres?: string
  direccion?: string
  department?: string
  province?: string
  district?: string
  office_type?: string
  lat?: string
  lng?: string
}

// Carga la página una vez (crea contexto/sesión en el WAF) y devuelve
// la cookie que el sitio emita (si emite alguna). Nunca lanza.
async function calentarYCookies(): Promise<string> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(PAGE_URL, {
        headers: HEADERS_NAVEGADOR,
        redirect: 'follow',
        signal: controller.signal,
      })
      const sc = res.headers.get('set-cookie') || ''
      if (!sc) return ''
      const pares: string[] = []
      sc.split(/,\s*(?=[A-Za-z_][A-Za-z0-9_]*=)/).forEach((c) => {
        const m = c.match(/^([^=]+)=([^;]*)/)
        if (m) pares.push(`${m[1]}=${m[2]}`)
      })
      return pares.join('; ')
    } finally {
      clearTimeout(timer)
    }
  } catch (e) {
    console.warn('[olva] warm-up de página falló (se sigue intentando el AJAX):', e)
    return ''
  }
}

export async function obtenerAgenciasOlva(): Promise<{
  ok: boolean
  agencias?: AgenciaOlva[]
  error?: string
}> {
  let ultimoError: string | null = null

  // Calentamiento previo (una sola vez por llamada).
  const cookie = await calentarYCookies()

  for (let intento = 1; intento <= INTENTOS; intento++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(BASE_URL, {
        headers: cookie ? { ...HEADERS_AJAX, Cookie: cookie } : HEADERS_AJAX,
        redirect: 'follow',
        signal: controller.signal,
      })
      if (!res.ok) {
        ultimoError = `HTTP ${res.status} (intento ${intento}/${INTENTOS})`
        console.error(`[olva] ${ultimoError}`)
        await esperar(intento)
        continue
      }
      const json = (await res.json()) as {
        success?: boolean
        data?: { data?: RawAgencia[] }
      }

      const filas = json?.data?.data
      if (!json?.success || !Array.isArray(filas)) {
        ultimoError = 'respuesta sin lista de agencias'
        console.error(`[olva] ${ultimoError}`)
        await esperar(intento)
        continue
      }

      const agencias: AgenciaOlva[] = filas.map((raw) => ({
        office_id: String(raw.office_id ?? ''),
        nombres: (raw.nombres || '').trim(),
        direccion: (raw.direccion || '').trim(),
        department: (raw.department || '').trim(),
        province: (raw.province || '').trim(),
        district: (raw.district || '').trim(),
        office_type: (raw.office_type || '').trim(),
        lat: (raw.lat || '').trim(),
        lng: (raw.lng || '').trim(),
      }))

      return { ok: agencias.length > 0, agencias }
    } catch (e) {
      ultimoError = e instanceof Error ? e.message : 'error desconocido'
      console.error(`[olva] error obteniendo agencias (intento ${intento}):`, e)
      await esperar(intento)
    } finally {
      clearTimeout(timer)
    }
  }

  return { ok: false, error: ultimoError ?? 'error desconocido' }
}

function esperar(intento: number): Promise<void> {
  const ms = ESPERAS_MS[Math.min(intento, ESPERAS_MS.length) - 1] ?? 5000
  return new Promise((resolve) => setTimeout(resolve, ms))
}