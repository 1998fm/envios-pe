import { supabaseServer } from 'app/f/[slug]/lib/supabase/server'
import PublicForm from '@/components/PublicForm'
import { computeEffectivePlan } from '@/lib/planGating'
import { validarHoraCorte } from '@/lib/logistica/validarHoraCorte'

export default async function FormPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: profile } = await supabaseServer
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

  const formularioDeshabilitado =
    (profile.cerrar_formulario ?? false) &&
    (superaCorteMoto || superaCorteAgencias)

  // Para usuarios de PROVINCIA, el formulario lista SOLO los distritos que
  // configuró (las claves de sus tarifas). Para LIMA se usa la lista de
  // distritos-metropolitanos precargada.
  let distritosMotorizado: string[] | undefined
  if ((profile.moto_region ?? 'lima') === 'provincia') {
    const { data: tarifas } = await supabaseServer
      .from('tarifas_moto')
      .select('tarifas')
      .eq('profile_id', profile.id)
      .maybeSingle()
    if (tarifas?.tarifas) {
      distritosMotorizado = Object.keys(tarifas.tarifas)
    }
  }

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
        logoUrl={profile.logo_url}
        redirectMessage={profile.redirect_message}
        redirectMessageImage={profile.redirect_message_image}
        redirectUrl={profile.redirect_url}

        instagramUrl={profile.instagram_url}
        facebookUrl={profile.facebook_url}
        tiktokUrl={profile.tiktok_url}
        webUrl={profile.web_url}
        whatsappUrl={profile.whatsapp_url}
        metodoMotorizado={profile.metodo_motorizado}

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
        formularioDeshabilitado={formularioDeshabilitado}
        cerrarFormularioMensaje={profile.cerrar_formulario_mensaje ?? ''}
        distritosMotorizado={distritosMotorizado}
      />

    </div>

  </main>

)
}