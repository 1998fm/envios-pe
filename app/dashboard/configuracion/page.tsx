'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ConfiguracionPage() {

  const supabase = createClient()

  const [origen, setOrigen] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
const [tiktok, setTiktok] = useState('')
const [web, setWeb] = useState('')

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  async function cargarConfiguracion() {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select(`
  origen_shalom,
  whatsapp_redireccion,
  tiktok_redireccion,
  web_redireccion
`)
      .eq('id', user.id)
      .single()

    if (data?.origen_shalom) {
      setOrigen(data.origen_shalom)
    }
if (data?.whatsapp_redireccion) {
  setWhatsapp(data.whatsapp_redireccion)
}

if (data?.tiktok_redireccion) {
  setTiktok(data.tiktok_redireccion)
}

if (data?.web_redireccion) {
  setWeb(data.web_redireccion)
}
    setLoading(false)
  }

  async function guardar() {

    setGuardando(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
  origen_shalom: origen,
  whatsapp_redireccion: whatsapp,
  tiktok_redireccion: tiktok,
  web_redireccion: web,
})
      .eq('id', user.id)

    setGuardando(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Configuración guardada')
  }

  if (loading) {
    return <div className="p-10">Cargando...</div>
  }

  return (
    <main className="max-w-2xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-8">
        Configuración
      </h1>

      <div className="space-y-2">

        <label className="font-semibold">
          Agencia de origen Shalom
        </label>

        <input
          type="text"
          value={origen}
          onChange={(e) =>
            setOrigen(e.target.value)
          }
          placeholder="Ej: SHALOM GAMARRA"
          className="w-full border rounded p-3"
        />

      </div>
<div className="space-y-2 mt-6">

  <label className="font-semibold">
    WhatsApp
  </label>

  <input
    type="text"
    value={whatsapp}
    onChange={(e) =>
      setWhatsapp(e.target.value)
    }
    placeholder="https://wa.me/51999999999"
    className="w-full border rounded p-3"
  />

</div>

<div className="space-y-2 mt-6">

  <label className="font-semibold">
    TikTok
  </label>

  <input
    type="text"
    value={tiktok}
    onChange={(e) =>
      setTiktok(e.target.value)
    }
    placeholder="https://tiktok.com/@miempresa"
    className="w-full border rounded p-3"
  />

</div>

<div className="space-y-2 mt-6">

  <label className="font-semibold">
    Página Web
  </label>

  <input
    type="text"
    value={web}
    onChange={(e) =>
      setWeb(e.target.value)
    }
    placeholder="https://miempresa.com"
    className="w-full border rounded p-3"
  />

</div>

      <button
        onClick={guardar}
        disabled={guardando}
        className="mt-6 bg-black text-white px-6 py-3 rounded"
      >
        {guardando
          ? 'Guardando...'
          : 'Guardar'}
      </button>

    </main>
  )
}