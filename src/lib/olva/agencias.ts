// =============================================================
// Adaptador a la fuente oficial de agencias de Olva courier
// (la misma que usa olvacourier.com en su página "Ubícanos").
//
// La página carga la lista vía un endpoint AJAX público de
// WordPress (action=get_olva_stores) que devuelve todas las
// tiendas con departamento, provincia, distrito, dirección y
// horarios en JSON. No requiere token ni cifrado.
//
// Si Olva cambia el endpoint, solo hay que actualizar BASE_URL.
//
// IMPORTANTE: cualquier fallo (red, parse) NO lanza excepción:
// devuelve { ok: false } para que el llamante conserve los datos
// previos y el sistema nunca se caiga (fallback automático).
// =============================================================

const BASE_URL =
  'https://www.olvacourier.com/wp-admin/admin-ajax.php?action=get_olva_stores'

const TIMEOUT_MS = 30000

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

export async function obtenerAgenciasOlva(): Promise<{
  ok: boolean
  agencias?: AgenciaOlva[]
}> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(BASE_URL, {
      headers: {
        Referer: 'https://www.olvacourier.com/ubicanos/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      },
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error(`[olva] HTTP ${res.status} en endpoint de agencias`)
      return { ok: false }
    }
    const json = (await res.json()) as {
      success?: boolean
      data?: { data?: RawAgencia[] }
    }

    const filas = json?.data?.data
    if (!json?.success || !Array.isArray(filas)) {
      console.error('[olva] respuesta sin lista de agencias')
      return { ok: false }
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
    console.error('[olva] error obteniendo agencias:', e)
    return { ok: false }
  } finally {
    clearTimeout(timer)
  }
}