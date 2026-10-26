'use client'

import type { ConfigState } from '@/types/config'

// Envío de la configuración al servidor (los archivos y los datos viajan juntos
// por multipart; el servidor valida, sube las imágenes y guarda).

type Respuesta = {
  error?: string
  slug?: string
  logoUrl?: string
  redirectMessageImage?: string
}

function armarFormulario(config: ConfigState, extra: Record<string, string> = {}) {
  const { logoFile, redirectMessageImageFile, ...resto } = config
  const form = new FormData()
  for (const [k, v] of Object.entries(extra)) form.append(k, v)
  form.append('config', JSON.stringify(resto))
  if (logoFile) form.append('logo', logoFile)
  if (redirectMessageImageFile) form.append('mensajeImagen', redirectMessageImageFile)
  return form
}

async function enviar(ruta: string, form: FormData): Promise<Respuesta> {
  try {
    const res = await fetch(ruta, { method: 'POST', body: form })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { error: json.error || 'No se pudo guardar' }
    return json as Respuesta
  } catch {
    return { error: 'No se pudo conectar con el servidor' }
  }
}

/** Guardado completo desde el modal de configuración del dashboard. */
export function guardarConfiguracionServidor(config: ConfigState): Promise<Respuesta> {
  return enviar('/api/configuracion', armarFormulario(config))
}

/** Un paso (1 a 4) del asistente de configuración inicial. */
export function guardarPasoServidor(paso: number, config: ConfigState): Promise<Respuesta> {
  return enviar('/api/onboarding', armarFormulario(config, { paso: String(paso) }))
}
