import { supabaseServer } from '@/lib/supabase/server'
import PublicForm from '@/components/PublicForm'

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
        logoUrl={profile.logo_url}
        redirectMessage={profile.redirect_message}
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
      />

    </div>

  </main>

)
}