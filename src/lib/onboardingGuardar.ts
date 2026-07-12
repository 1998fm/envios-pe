import { obtenerConfiguracionLogistica } from '@/lib/logistica/guardarConfiguracionLogistica'
import type { ConfigState } from '@/types/config'

function generarSlug(empresa: string) {
  return empresa
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function guardarPasoEmpresa(
  supabase: any,
  userId: string,
  config: ConfigState
) {
  let nuevaLogoUrl = config.logoUrl

  if (config.logoFile) {
    const extension = config.logoFile.name.split('.').pop()
    const filePath = `${userId}/logo.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, config.logoFile, { upsert: true })

    if (uploadError) return { error: uploadError.message }

    const { data } = supabase.storage.from('logos').getPublicUrl(filePath)
    nuevaLogoUrl = data.publicUrl
  }

  const slug = generarSlug(config.empresa)
  const { data: slugExistente } = await supabase
    .from('profiles')
    .select('slug')
    .eq('slug', slug)
    .neq('id', userId)
    .maybeSingle()

  if (slugExistente) return { error: 'Ya existe otro negocio con ese nombre.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      empresa: config.empresa,
      telefono: config.telefonoEmpresa,
      direccion: config.direccionEmpresa,
      slug,
      origen_shalom: config.nuevoOrigen,
      logo_url: nuevaLogoUrl,
      redirect_url: config.redirectUrl,
      redirect_message: config.redirectMessage,
      instagram_url: config.instagramUrl,
      facebook_url: config.facebookUrl,
      tiktok_url: config.tiktokUrl,
      web_url: config.webUrl,
      whatsapp_url: config.whatsappUrl,
    })
    .eq('id', userId)

  return { error: error?.message }
}

export async function guardarPasoMetodos(
  supabase: any,
  userId: string,
  config: ConfigState
) {
  const { error } = await supabase
    .from('profiles')
    .update({
      metodo_motorizado: config.metodoMotorizado,
      metodo_shalom: config.metodoShalom,
      metodo_olva: config.metodoOlva,
      metodo_marvisur: config.metodoMarvisur,
      metodo_flores: config.metodoFlores,
      metodo_otro: config.metodoOtro,
      nombre_metodo_otro: config.nombreMetodoOtro,
    })
    .eq('id', userId)

  return { error: error?.message }
}

export async function guardarPasoLogistica(
  supabase: any,
  userId: string,
  config: ConfigState
) {
  const { error } = await supabase
    .from('profiles')
    .update(obtenerConfiguracionLogistica({
      logisticaMotoDias: config.logisticaMotoDias,
      logisticaMotoUsaHoraCorte: config.logisticaMotoUsaHoraCorte,
      logisticaMotoHoraCorte: config.logisticaMotoHoraCorte,
      logisticaMotoLimitar: config.logisticaMotoLimitar,
      logisticaMotoCupo: config.logisticaMotoCupo,
      logisticaAgenciasDias: config.logisticaAgenciasDias,
      logisticaAgenciasUsaHoraCorte: config.logisticaAgenciasUsaHoraCorte,
      logisticaAgenciasHoraCorte: config.logisticaAgenciasHoraCorte,
      logisticaAgenciasLimitar: config.logisticaAgenciasLimitar,
      logisticaAgenciasCupo: config.logisticaAgenciasCupo,
    }))
    .eq('id', userId)

  return { error: error?.message }
}

export async function guardarPasoTarifas(
  supabase: any,
  userId: string,
  config: ConfigState
) {
  const tarifasParaGuardar = Object.entries(config.tarifas)
    .filter(([, precio]) => precio !== '')
    .map(([distrito, precio]) => ({
      profile_id: userId,
      distrito,
      precio: Number(precio),
    }))

  if (tarifasParaGuardar.length === 0) return { error: null }

  const { error } = await supabase
    .from('tarifas_moto')
    .upsert(tarifasParaGuardar, { onConflict: 'profile_id,distrito' })

  return { error: error?.message }
}
