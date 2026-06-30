'use client'

import {
  useState,
  useEffect,
} from 'react'

import {
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaWhatsapp,
} from 'react-icons/fa'

import { Globe } from 'lucide-react'

import agenciasShalom
from '@/data/agencias-shalom.json'

import provinciasOlva
from '@/data/provincias-olva.json'

import distritosMoto
from '@/data/distritos-moto.json'

import AutocompleteInput
from '@/components/AutocompleteInput'

type Props = {
  userId: string

  logoUrl?: string

  redirectMessage?: string
  redirectUrl?: string

  instagramUrl?: string
  facebookUrl?: string
  tiktokUrl?: string
  webUrl?: string
  whatsappUrl?: string
}

export default function PublicForm({userId,

  logoUrl,

  redirectMessage,
  redirectUrl,

  instagramUrl,
  facebookUrl,
  tiktokUrl,
  webUrl,
  whatsappUrl,}: Props){
    
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

const [error, setError] = useState('')

  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')

  const [metodo, setMetodo] = useState('SHALOM')

  const [agencia, setAgencia] = useState('')

  const [provincia, setProvincia] = useState('')
  const [distrito, setDistrito] = useState('')
  const [direccion, setDireccion] = useState('')
  const [referencia, setReferencia] = useState('')

  useEffect(() => {

  if (
    enviado &&
    redirectUrl
  ) {

    const timer =
      setTimeout(() => {

        window.location.href =
          redirectUrl

      }, 3000)

    return () =>
      clearTimeout(timer)

  }

}, [
  enviado,
  redirectUrl,
])

async function handleSubmit() {

  setError('')

  setLoading(true)

  if (!nombre.trim()) {

    setError(
      'Ingresa tu nombre.'
    )

    setLoading(false)

    return
  }

  if (!dni.trim()) {

    setError(
      'Ingresa tu documento.'
    )

    setLoading(false)

    return
  }

  if (
    telefono.trim().length < 9
  ) {

    setError(
      'Ingresa un teléfono válido.'
    )

    setLoading(false)

    return
  }

  if (
    metodo === 'SHALOM' &&
    !agencia
  ) {

    setError(
      'Selecciona una agencia.'
    )

    setLoading(false)

    return
  }

  if (
    metodo === 'OLVA' &&
    (
      !provincia ||
      !direccion
    )
  ) {

    setError(
      'Completa los datos de envío.'
    )

    setLoading(false)

    return
  }

  if (
    metodo === 'MOTORIZADO' &&
    (
      !distrito ||
      !direccion
    )
  ) {

    setError(
      'Completa los datos de envío.'
    )

    setLoading(false)

    return
  }

  let detalle = ''

  if (metodo === 'SHALOM') {

    detalle = agencia

  }

  if (metodo === 'OLVA') {

    detalle =
      `Provincia: ${provincia}\n` +
      `Dirección: ${direccion}\n` +
      `Referencia: ${referencia}`

  }

  if (metodo === 'MOTORIZADO') {

    detalle =
      `Distrito: ${distrito}\n` +
      `Dirección: ${direccion}\n` +
      `Referencia: ${referencia}`

  }

  const res = await fetch(
    '/api/envios',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({

  user_id: userId,

  nombre,

  dni,

  telefono,

  metodo,

  destino:

    metodo === 'SHALOM'
      ? agencia

      : metodo === 'OLVA'
      ? provincia

      : distrito,

  direccion:

    metodo === 'SHALOM'

      ? null

      : direccion,

  referencia:

    metodo === 'SHALOM'

      ? null

      : referencia,

  detalle,

  observaciones: '',

})
    }
  )

  setLoading(false)

  if (!res.ok) {

    const errorData =
      await res.json()

    console.log(errorData)

    setError(
      'Ocurrió un error al registrar el pedido.'
    )

    return
  }

  setEnviado(true)
}

  if (enviado) {

  return (

    <div
      className="
        max-w-xl
        mx-auto
        mt-10
      "
    >

      <div
        className="
          bg-white
          border
          rounded-3xl
          shadow-sm
          p-8
          text-center
        "
      >

        {logoUrl && (

          <div
            className="
              flex
              justify-center
              mb-6
            "
          >

            <img
              src={logoUrl}
              alt="Logo"
              className="
                max-h-24
                object-contain
              "
            />

          </div>

        )}

        <div className="text-5xl mb-4">
          ✅
        </div>

        <h2
          className="
            text-2xl
            font-bold
          "
        >
          Pedido registrado correctamente
        </h2>

        <p
          className="
            mt-4
            text-gray-600
            whitespace-pre-line
          "
        >
          {
            redirectMessage ||
            'Gracias por tu solicitud.'
          }
        </p>

        {redirectUrl && (

          <p
            className="
              mt-4
              text-sm
              text-gray-400
            "
          >
            Redireccionando...
          </p>

        )}

      </div>

    </div>

  )
}

  return (

  <div
    className="
      max-w-xl
      mx-auto
      mt-6
    "
  >

   <div
  className="
    bg-white
    rounded-[32px]
    shadow-2xl
    border
    border-gray-100
    p-8
    space-y-8
    relative
    overflow-hidden
  "
>

  <div
    className="
      absolute
      top-0
      left-0
      right-0
      h-2
      bg-gradient-to-r
      from-cyan-500
      via-blue-500
      to-purple-500
    "
  />

      {logoUrl && (

        <div
          className="
            flex
            justify-center
          "
        >
<div
  className="
    flex
    justify-center
    gap-2
    flex-wrap
  "
>


</div>
          <img
            src={logoUrl}
            alt="Logo"
            className="
              max-h-24
              object-contain
            "
          />

        </div>

      )}

      <div className="text-center">

  <h1
    className="
      text-4xl
      font-extrabold
      tracking-tight
      text-gray-900
    "
  >
    Registra tu envío
  </h1>

  <p
    className="
      mt-3
      text-gray-500
    "
  >
    Completa tus datos para coordinar tu entrega.
  </p>

</div>

      <div>

       <h2
  className="
    text-sm
    uppercase
    tracking-wider
    text-gray-500
    font-bold
    mb-4
  "
>
  Datos personales
</h2>

        <input
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="
  w-full
  bg-gray-50
  border
  border-gray-200
  p-4
  rounded-2xl
  focus:outline-none
  focus:ring-2
  focus:ring-cyan-500
  transition
  mb-3
"
        />

        <input
          placeholder="DNI"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          className="
  w-full
  bg-gray-50
  border
  border-gray-200
  p-4
  rounded-2xl
  focus:outline-none
  focus:ring-2
  focus:ring-cyan-500
  transition
  mb-3
"
        />

        <input
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="
  w-full
  bg-gray-50
  border
  border-gray-200
  p-4
  rounded-2xl
  focus:outline-none
  focus:ring-2
  focus:ring-cyan-500
  transition
"
        />

        <p
          className="
            text-xs
            text-amber-600
            mt-2
          "
        >
          Usa el mismo número con el que realizaste tu compra por WhatsApp.
        </p>

      </div>

      <div>

        <h2
  className="
    text-sm
    uppercase
    tracking-wider
    text-gray-500
    font-bold
    mb-4
  "
>
  Información de envío
</h2>

        <select
          value={metodo}
          onChange={(e) => setMetodo(e.target.value)}
         className="
  w-full
  bg-gray-50
  border
  border-gray-200
  p-4
  rounded-2xl
  focus:outline-none
  focus:ring-2
  focus:ring-cyan-500
  transition
"
        >
          <option value="SHALOM">
            Shalom
          </option>

          <option value="OLVA">
            Olva
          </option>

          <option value="MOTORIZADO">
            Motorizado
          </option>

        </select>

      </div>

      {metodo === 'SHALOM' && (

        <AutocompleteInput
          value={agencia}
          onChange={setAgencia}
          options={agenciasShalom}
          placeholder="Buscar agencia"
        />

      )}

      {metodo === 'OLVA' && (

        <div className="space-y-3">

          <AutocompleteInput
            value={provincia}
            onChange={setProvincia}
            options={provinciasOlva}
            placeholder="Provincia"
          />

          <input
            placeholder="Dirección exacta"
            value={direccion}
            onChange={(e) =>
              setDireccion(e.target.value)
            }
            className="
  w-full
  bg-gray-50
  border
  border-gray-200
  p-4
  rounded-2xl
  focus:outline-none
  focus:ring-2
  focus:ring-cyan-500
  transition
"
          />

          <input
            placeholder="Referencia"
            value={referencia}
            onChange={(e) =>
              setReferencia(e.target.value)
            }
           className="
  w-full
  bg-gray-50
  border
  border-gray-200
  p-4
  rounded-2xl
  focus:outline-none
  focus:ring-2
  focus:ring-cyan-500
  transition
"
          />

        </div>

      )}

      {metodo === 'MOTORIZADO' && (

        <div className="space-y-3">

          <AutocompleteInput
            value={distrito}
            onChange={setDistrito}
            options={distritosMoto}
            placeholder="Distrito"
          />

          <input
            placeholder="Dirección exacta"
            value={direccion}
            onChange={(e) =>
              setDireccion(e.target.value)
            }
            className="
              w-full
              border
              p-3
              rounded-xl
            "
          />

          <input
            placeholder="Referencia"
            value={referencia}
            onChange={(e) =>
              setReferencia(e.target.value)
            }
            className="
              w-full
              border
              p-3
              rounded-xl
            "
          />

        </div>

      )}

{error && (

  <div
    className="
      bg-red-50
      border
      border-red-200
      text-red-700
      rounded-2xl
      p-3
      text-sm
    "
  >
    {error}
  </div>

)}

      <button
        onClick={handleSubmit}
        disabled={loading}
       className="
  w-full
  bg-gradient-to-r
  from-cyan-600
  to-blue-600
  text-white
  py-4
  rounded-2xl
  font-semibold
  shadow-lg
  hover:scale-[1.02]
  transition-all
"
      >
        {loading ? (

  <div
    className="
      flex
      items-center
      justify-center
      gap-2
    "
  >

    <div
      className="
        w-4
        h-4
        border-2
        border-white
        border-t-transparent
        rounded-full
        animate-spin
      "
    />

    <span>
      Enviando...
    </span>

  </div>

) : (

  'Solicitar Envio'

)}
      </button>

{(
  instagramUrl ||
  facebookUrl ||
  tiktokUrl ||
  webUrl ||
  whatsappUrl
) && (

  <div
    className="
      pt-6
      border-t
      mt-2
    "
  >

    <div
      className="
        flex
        justify-center
        flex-wrap
        gap-4
      "
    >

      {instagramUrl && (

        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex
            items-center
            gap-2
            text-sm
            text-gray-600
            hover:text-black
          "
        >
          <FaInstagram size={18} />
          <span>Instagram</span>
        </a>

      )}

      {facebookUrl && (

        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex
            items-center
            gap-2
            text-sm
            text-gray-600
            hover:text-black
          "
        >
          <FaFacebook size={18} />
          <span>Facebook</span>
        </a>

      )}

      {tiktokUrl && (

        <a
          href={tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex
            items-center
            gap-2
            text-sm
            text-gray-600
            hover:text-black
          "
        >
          <FaTiktok size={18} />
          <span>TikTok</span>
        </a>

      )}

      {webUrl && (

        <a
          href={webUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex
            items-center
            gap-2
            text-sm
            text-gray-600
            hover:text-black
          "
        >
          <Globe size={18} />
          <span>Sitio Web</span>
        </a>

      )}

      {whatsappUrl && (

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex
            items-center
            gap-2
            text-sm
            text-gray-600
            hover:text-black
          "
        >
          <FaWhatsapp size={18} />
          <span>WhatsApp</span>
        </a>

      )}

    </div>

  </div>

)}

    </div>

  </div>

)}