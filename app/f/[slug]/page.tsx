import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { urlHttpSegura } from '@/lib/urlSegura'
import { aProxy } from '@/lib/mediaUrl'
import PublicForm from '@/components/PublicForm'
import { computeEffectivePlan } from '@/lib/planGating'
import { validarHoraCorte } from '@/lib/logistica/validarHoraCorte'
import { esDiaDeshabilitado } from '@/lib/logistica/esDiaDeshabilitado'

export default async function FormPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!profile) {
    return (
      <div className="p-10">
        No se encontró el perfil para el slug: {slug}
      </div>
    )
  }

  const planEfectivo = computeEffectivePlan(profile)
  const isPro = planEfectivo.plan !== 'basic'
  const isBusinessPlus = planEfectivo.plan === 'business_plus'

  const superaCorteMoto =
    (profile.logistica_moto_usa_hora_corte ?? false) &&
    validarHoraCorte(profile.logistica_moto_hora_corte ?? '18:00')

  const superaCorteAgencias =
    (profile.logistica_agencias_usa_hora_corte ?? false) &&
    validarHoraCorte(profile.logistica_agencias_hora_corte ?? '18:00')

  const cerradoPorDia = esDiaDeshabilitado(profile.cerrar_formulario_dias ?? [])

  const formularioDeshabilitado =
    (profile.cerrar_formulario ?? false) &&
    (superaCorteMoto || superaCorteAgencias || cerradoPorDia)

  // Para usuarios de PROVINCIA, el formulario lista SOLO los distritos que
  // configuró (las claves de sus tarifas). Para LIMA se usa la lista de
  // distritos-metropolitanos precargada.
  let distritosMotorizado: string[] | undefined
  if ((profile.moto_region ?? 'lima') === 'provincia') {
    const { data: tarifas } = await supabaseAdmin
      .from('tarifas_moto')
      .select('tarifas')
      .eq('profile_id', profile.id)
      .maybeSingle()
    if (tarifas?.tarifas) {
      distritosMotorizado = Object.keys(tarifas.tarifas)
    }
  }

  // Motorizado solo aparece en el formulario si el negocio marcó al menos un
  // día de entrega. Sin días configurados, es como si no lo hubiera elegido.
  const motorizadoActivo =
    (profile.metodo_motorizado ?? false) &&
    Array.isArray(profile.logistica_moto_dias) &&
    profile.logistica_moto_dias.length > 0

  return (

  <main
    className="
      min-h-screen
      bg-gray-50
      flex
      items-center
      justify-center
      p-4
    "
  >

    <div
      className="
        w-full
        max-w-2xl
      "
    >

      <PublicForm
        userId={profile.id}
        isPro={isPro}
        isBusinessPlus={isBusinessPlus}
        logoUrl={aProxy(profile.logo_url) ?? undefined}
        redirectMessage={profile.redirect_message}
        redirectMessageImage={aProxy(profile.redirect_message_image) ?? undefined}
        redirectUrl={urlHttpSegura(profile.redirect_url)}

        instagramUrl={urlHttpSegura(profile.instagram_url)}
        facebookUrl={urlHttpSegura(profile.facebook_url)}
        tiktokUrl={urlHttpSegura(profile.tiktok_url)}
        webUrl={urlHttpSegura(profile.web_url)}
        whatsappUrl={urlHttpSegura(profile.whatsapp_url)}
        metodoMotorizado={motorizadoActivo}

metodoShalom={profile.metodo_shalom}

metodoOlva={profile.metodo_olva}

metodoMarvisur={profile.metodo_marvisur}

metodoFlores={profile.metodo_flores}

metodoOtro={profile.metodo_otro}

nombreMetodoOtro={profile.nombre_metodo_otro}

        metodoRecojo={profile.metodo_recojo}

        mensajeRecojo={profile.mensaje_recojo}

        solicitarCantidadProductos={profile.solicitar_cantidad_productos ?? false}
        mostrarEscogerFecha={profile.mostrar_escoger_fecha ?? true}
        mostrarTracking={profile.mostrar_tracking ?? true}
        formularioDeshabilitado={formularioDeshabilitado}
        cerrarFormularioMensaje={profile.cerrar_formulario_mensaje ?? ''}
        distritosMotorizado={distritosMotorizado}
        colorPrimario={profile.color_formulario_primario ?? '#0284c7'}
        colorSecundario={profile.color_formulario_secundario ?? '#4f46e5'}
      />

    </div>

  </main>

)
}