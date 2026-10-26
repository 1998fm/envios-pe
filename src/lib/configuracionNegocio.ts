import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { computeEffectivePlan } from '@/lib/planGating'
import { obtenerConfiguracionLogistica } from '@/lib/logistica/guardarConfiguracionLogistica'
import { urlHttpSegura } from '@/lib/urlSegura'
import { aProxy, desdeProxy } from '@/lib/mediaUrl'
import type { ConfigState } from '@/types/config'
import { mensajeDb } from '@/lib/erroresEs'

// Guardado de la configuración del negocio, hecho en el servidor: ni los
// archivos ni los datos del formulario van directo a la base desde el navegador.

export type ConfigEntrada = Omit<ConfigState, 'logoFile' | 'redirectMessageImageFile'>
export type ArchivosConfig = { logo?: File | null; mensajeImagen?: File | null }
export type ResultadoConfig = {
  error?: string
  slug?: string
  logoUrl?: string
  redirectMessageImage?: string
}

const TIPOS_IMAGEN: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const MAX_BYTES = 3 * 1024 * 1024

export function generarSlug(empresa: string) {
  return empresa
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Valida y sube una imagen al bucket; devuelve la URL pública canónica. */
export async function subirImagen(
  bucket: 'logos' | 'productos',
  ruta: (ext: string) => string,
  archivo: File,
  maxBytes = MAX_BYTES
): Promise<{ url?: string; ruta?: string; error?: string }> {
  const ext = TIPOS_IMAGEN[archivo.type]
  if (!ext) return { error: 'Solo se aceptan imágenes PNG, JPG, WEBP o GIF.' }
  if (archivo.size > maxBytes) {
    return { error: `La imagen pesa demasiado (máximo ${Math.round(maxBytes / 1024 / 1024)} MB).` }
  }
  const path = ruta(ext)
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, Buffer.from(await archivo.arrayBuffer()), { upsert: true, contentType: archivo.type })
  if (error) return { error: 'No se pudo subir la imagen.' }
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl, ruta: path }
}

async function slugLibre(ownerId: string, slug: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('slug', slug)
    .neq('id', ownerId)
    .maybeSingle()
  return !data
}

const URLS: [keyof ConfigEntrada, string][] = [
  ['redirectUrl', 'La URL de redirección'],
  ['instagramUrl', 'El enlace de Instagram'],
  ['facebookUrl', 'El enlace de Facebook'],
  ['tiktokUrl', 'El enlace de TikTok'],
  ['webUrl', 'El enlace del sitio web'],
  ['whatsappUrl', 'El enlace de WhatsApp'],
]

function validarUrls(config: ConfigEntrada): string | null {
  for (const [campo, nombre] of URLS) {
    const v = config[campo]
    if (typeof v === 'string' && v.trim() !== '' && !urlHttpSegura(v)) {
      return `${nombre} no es válido: debe empezar con http:// o https://`
    }
  }
  return null
}

async function subirImagenesNegocio(ownerId: string, config: ConfigEntrada, archivos: ArchivosConfig) {
  let logoUrl = desdeProxy(config.logoUrl || '')
  let mensajeImagen = desdeProxy(config.redirectMessageImage || '')

  if (archivos.logo) {
    const r = await subirImagen('logos', (ext) => `${ownerId}/logo.${ext}`, archivos.logo)
    if (r.error) return { error: r.error } as const
    logoUrl = r.url!
  }
  if (archivos.mensajeImagen) {
    const r = await subirImagen('logos', (ext) => `${ownerId}/mensaje-exito.${ext}`, archivos.mensajeImagen)
    if (r.error) return { error: r.error } as const
    mensajeImagen = r.url!
  }
  return { logoUrl, mensajeImagen } as const
}

/** Guardado completo (modal de configuración del dashboard). */
export async function guardarConfiguracion(
  ownerId: string,
  config: ConfigEntrada,
  archivos: ArchivosConfig
): Promise<ResultadoConfig> {
  if (!config.empresa || !config.empresa.trim()) return { error: 'Escribe el nombre de tu negocio.' }
  const errorUrl = validarUrls(config)
  if (errorUrl) return { error: errorUrl }

  // El plan lo decide el servidor, no el navegador.
  const { data: perfil } = await supabaseAdmin.from('profiles').select('plan, trial_end, pro_until').eq('id', ownerId).maybeSingle()
  const basico = computeEffectivePlan(perfil ?? {}).plan === 'basic'

  const slug = generarSlug(config.empresa)
  if (!slug) return { error: 'El nombre del negocio no es válido.' }
  if (!(await slugLibre(ownerId, slug))) {
    return { error: 'Ya existe otro negocio con ese nombre. Elige un nombre diferente.' }
  }

  const img = await subirImagenesNegocio(ownerId, config, archivos)
  if ('error' in img) return { error: img.error }

  const tarifas = Object.fromEntries(
    Object.entries(config.tarifas ?? {})
      .filter(([, precio]) => precio !== '' && precio !== null && precio !== undefined)
      .map(([distrito, precio]) => [distrito, Number(precio)])
      .filter(([, precio]) => Number.isFinite(precio as number))
  )

  const solo = (anticipacion: number, valor: boolean) => (Number(anticipacion) >= 2 ? Boolean(valor) : false)

  const { data, error } = await supabaseAdmin.rpc('guardar_configuracion', {
    p_profile_id: ownerId,
    p_empresa: config.empresa,
    p_telefono: config.telefonoEmpresa,
    p_direccion: config.direccionEmpresa,
    p_slug: slug,
    p_origen_shalom: config.nuevoOrigen,
    p_logo_url: img.logoUrl,
    p_redirect_url: config.redirectUrl,
    p_redirect_message: config.redirectMessage,
    p_redirect_message_image: img.mensajeImagen,
    p_instagram_url: config.instagramUrl,
    p_facebook_url: config.facebookUrl,
    p_tiktok_url: config.tiktokUrl,
    p_web_url: config.webUrl,
    p_whatsapp_url: config.whatsappUrl,
    p_metodo_motorizado: config.metodoMotorizado,
    p_metodo_shalom: config.metodoShalom,
    p_metodo_olva: config.metodoOlva,
    p_metodo_marvisur: config.metodoMarvisur,
    p_metodo_flores: config.metodoFlores,
    p_metodo_otro: config.metodoOtro,
    p_nombre_metodo_otro: config.nombreMetodoOtro,
    p_metodo_recojo: config.metodoRecojo,
    p_mensaje_recojo: config.mensajeRecojo,
    p_logistica_moto_dias: config.logisticaMotoDias,
    p_logistica_moto_usa_hora_corte: basico ? false : config.logisticaMotoUsaHoraCorte,
    p_logistica_moto_hora_corte: basico ? '18:00' : config.logisticaMotoHoraCorte,
    p_logistica_moto_anticipacion: basico ? 1 : config.logisticaMotoAnticipacion,
    p_logistica_moto_anticipacion_solo_habiles: basico ? false : solo(config.logisticaMotoAnticipacion, config.logisticaMotoAnticipacionSoloHabiles),
    p_logistica_moto_limitar: basico ? false : config.logisticaMotoLimitar,
    p_logistica_moto_cupo: basico ? 0 : config.logisticaMotoCupo,
    p_logistica_agencias_dias: config.logisticaAgenciasDias,
    p_logistica_agencias_usa_hora_corte: basico ? false : config.logisticaAgenciasUsaHoraCorte,
    p_logistica_agencias_hora_corte: basico ? '18:00' : config.logisticaAgenciasHoraCorte,
    p_logistica_agencias_anticipacion: basico ? 1 : config.logisticaAgenciasAnticipacion,
    p_logistica_agencias_anticipacion_solo_habiles: basico ? false : solo(config.logisticaAgenciasAnticipacion, config.logisticaAgenciasAnticipacionSoloHabiles),
    p_logistica_agencias_limitar: basico ? false : config.logisticaAgenciasLimitar,
    p_logistica_agencias_cupo: basico ? 0 : config.logisticaAgenciasCupo,
    p_solicitar_cantidad_productos: config.solicitarCantidadProductos,
    p_mostrar_escoger_fecha: config.mostrarEscogerFecha,
    p_mostrar_tracking: config.mostrarTracking,
    p_cerrar_formulario: config.cerrarFormulario,
    p_cerrar_formulario_mensaje: config.cerradoFormularioMensaje ?? '',
    p_moto_region: config.motoRegion,
    p_cerrar_formulario_dias: config.cerrarFormularioDias ?? [],
    p_color_formulario_primario: config.colorPrimario ?? '#0284c7',
    p_color_formulario_secundario: config.colorSecundario ?? '#4f46e5',
    p_tarifas: tarifas,
  })

  if (error) return { error: mensajeDb(error) }
  const errorRpc = Array.isArray(data) ? data[0]?.error_text : null
  if (errorRpc) return { error: errorRpc }

  return { slug, logoUrl: aProxy(img.logoUrl) as string, redirectMessageImage: aProxy(img.mensajeImagen) as string }
}

/** Pasos del asistente de onboarding (1 empresa, 2 métodos, 3 horarios, 4 tarifas). */
export async function guardarPasoOnboarding(
  ownerId: string,
  paso: number,
  config: ConfigEntrada,
  archivos: ArchivosConfig
): Promise<ResultadoConfig> {
  if (paso === 1) {
    if (!config.empresa || !config.empresa.trim()) return { error: 'Escribe el nombre de tu negocio.' }
    const errorUrl = validarUrls(config)
    if (errorUrl) return { error: errorUrl }
    const slug = generarSlug(config.empresa)
    if (!slug) return { error: 'El nombre del negocio no es válido.' }
    if (!(await slugLibre(ownerId, slug))) return { error: 'Ya existe otro negocio con ese nombre.' }

    const img = await subirImagenesNegocio(ownerId, config, archivos)
    if ('error' in img) return { error: img.error }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        empresa: config.empresa,
        telefono: config.telefonoEmpresa,
        direccion: config.direccionEmpresa,
        slug,
        origen_shalom: config.nuevoOrigen,
        logo_url: img.logoUrl,
        redirect_url: config.redirectUrl,
        redirect_message: config.redirectMessage,
        redirect_message_image: img.mensajeImagen,
        instagram_url: config.instagramUrl,
        facebook_url: config.facebookUrl,
        tiktok_url: config.tiktokUrl,
        web_url: config.webUrl,
        whatsapp_url: config.whatsappUrl,
      })
      .eq('id', ownerId)
    if (error) return { error: mensajeDb(error) }
    return { slug }
  }

  if (paso === 2) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        metodo_motorizado: config.metodoMotorizado,
        metodo_shalom: config.metodoShalom,
        metodo_olva: config.metodoOlva,
        metodo_marvisur: config.metodoMarvisur,
        metodo_flores: config.metodoFlores,
        metodo_otro: config.metodoOtro,
        nombre_metodo_otro: config.nombreMetodoOtro,
        metodo_recojo: config.metodoRecojo,
        mensaje_recojo: config.mensajeRecojo,
        origen_shalom: config.nuevoOrigen,
      })
      .eq('id', ownerId)
    return error ? { error: mensajeDb(error) } : {}
  }

  if (paso === 3) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(
        obtenerConfiguracionLogistica({
          logisticaMotoDias: config.logisticaMotoDias,
          logisticaMotoUsaHoraCorte: config.logisticaMotoUsaHoraCorte,
          logisticaMotoHoraCorte: config.logisticaMotoHoraCorte,
          logisticaMotoAnticipacion: config.logisticaMotoAnticipacion,
          logisticaMotoAnticipacionSoloHabiles: config.logisticaMotoAnticipacionSoloHabiles,
          logisticaMotoLimitar: config.logisticaMotoLimitar,
          logisticaMotoCupo: config.logisticaMotoCupo,
          logisticaAgenciasDias: config.logisticaAgenciasDias,
          logisticaAgenciasUsaHoraCorte: config.logisticaAgenciasUsaHoraCorte,
          logisticaAgenciasHoraCorte: config.logisticaAgenciasHoraCorte,
          logisticaAgenciasAnticipacion: config.logisticaAgenciasAnticipacion,
          logisticaAgenciasAnticipacionSoloHabiles: config.logisticaAgenciasAnticipacionSoloHabiles,
          logisticaAgenciasLimitar: config.logisticaAgenciasLimitar,
          logisticaAgenciasCupo: config.logisticaAgenciasCupo,
        })
      )
      .eq('id', ownerId)
    return error ? { error: mensajeDb(error) } : {}
  }

  if (paso === 4) {
    await supabaseAdmin.from('profiles').update({ moto_region: config.motoRegion }).eq('id', ownerId)
    const tarifas = Object.fromEntries(
      Object.entries(config.tarifas ?? {})
        .filter(([, precio]) => precio !== '')
        .map(([distrito, precio]) => [distrito, Number(precio)])
        .filter(([, precio]) => Number.isFinite(precio as number))
    )
    if (Object.keys(tarifas).length === 0) return {}
    const { error } = await supabaseAdmin.from('tarifas_moto').upsert({ profile_id: ownerId, tarifas })
    return error ? { error: mensajeDb(error) } : {}
  }

  return { error: 'Paso no válido' }
}
