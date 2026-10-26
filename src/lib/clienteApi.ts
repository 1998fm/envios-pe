'use client'

import type { ResolucionNegocio } from '@/lib/roles'

// Acceso del navegador a los datos: TODO pasa por las rutas /api de la propia
// app. El navegador no conoce la dirección de la base de datos ni tiene llaves.

export type SesionApp = {
  user: { id: string; email: string | null }
  negocio: ResolucionNegocio
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: Record<string, any> | null
  tarifas: Record<string, unknown>
}

export class ErrorApi extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

/** fetch JSON con manejo de errores uniforme. Lanza ErrorApi si la respuesta no es 2xx. */
export async function api<T = unknown>(ruta: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...resto } = init
  const res = await fetch(ruta, {
    ...resto,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : resto.body,
  })
  const texto = await res.text()
  let datos: unknown = null
  try {
    datos = texto ? JSON.parse(texto) : null
  } catch {
    datos = null
  }
  if (!res.ok) {
    const msg = (datos as { error?: string } | null)?.error || `Error del servidor (código ${res.status}). Intenta de nuevo.`
    throw new ErrorApi(msg, res.status)
  }
  return datos as T
}

/** Quién soy y de qué negocio es lo que veo. null si no hay sesión. */
export async function obtenerSesion(): Promise<SesionApp | null> {
  try {
    return await api<SesionApp>('/api/session')
  } catch (e) {
    if (e instanceof ErrorApi && (e.status === 401 || e.status === 403)) return null
    throw e
  }
}

export async function cerrarSesion(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
}
