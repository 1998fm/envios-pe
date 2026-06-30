/* ========================================
   TIPOS
======================================== */

import type {

  EnvioMoto

} from '../types'

/* ========================================
   PROPS
======================================== */

interface Props {

  envio: EnvioMoto

  cobrar: boolean

  tarifa: number | null

  onCambiarCobro: () => void

}

/* ========================================
   TARJETA DE ENVÍO
======================================== */

export default function TarjetaEnvio({

  envio,

  cobrar,

  tarifa,

  onCambiarCobro

}: Props) {

  return (

    <div
     className="
  bg-white
  border
  border-gray-100
  rounded-[28px]
  p-6
  shadow-lg
  transition-all
  hover:shadow-xl
"
    >

      {/* ========================================
          CABECERA
      ======================================== */}

      <div
      className="
  flex
  justify-between
  items-start
  gap-4
  mb-6
"
      >

        <div>

          <h3
           className="
  text-xl
  font-bold
  text-gray-900
"
          >
            {envio.nombre}
          </h3>

          <p
            className="
  text-sm
  text-gray-500
  mt-1
"
          >
            {envio.telefono}
          </p>

        </div>

        <label
  className="
    flex
    items-center
    gap-3
    text-sm
    font-semibold
    text-gray-700
    whitespace-nowrap
  "
>

          <input
  type="checkbox"
  checked={cobrar}
  onChange={onCambiarCobro}
  className="
    h-5
    w-5
    rounded
    accent-cyan-600
    cursor-pointer
  "
/>

          Cobrar envío

        </label>

      </div>

      {/* ========================================
          DIRECCIÓN
      ======================================== */}

      <div
  className="
  bg-gray-50
  border
  border-gray-200
  rounded-2xl
  p-5
  text-sm
  space-y-3
"
>

  <p>

    <strong className="text-gray-700">
  Distrito:
</strong>

    {envio.destino}

  </p>

  {

    envio.direccion && (

      <p>

        <strong className="text-gray-700">
  Dirección:
</strong>

        {envio.direccion}

      </p>

    )

  }

  {

    envio.referencia && (

      <p>

        <strong className="text-gray-700">
  Referencia:
</strong>

        {envio.referencia}

      </p>

    )

  }

</div>

      {/* ========================================
          COBRO
      ======================================== */}

      <div
  className="
    mt-6
    pt-5
    border-t
    border-gray-100
    flex
    justify-between
    items-center
"
>

        {cobrar ? (

  <span
    className="
      inline-flex
      items-center
      rounded-full
      bg-green-100
      px-4
      py-2
      text-sm
      font-semibold
      text-green-700
    "
  >
    💰 Cobrar S/{tarifa ?? 0}
  </span>

) : (

  <span
    className="
      inline-flex
      items-center
      rounded-full
      bg-red-100
      px-4
      py-2
      text-sm
      font-semibold
      text-red-700
    "
  >
    🚫 No cobrar
  </span>

)}
      </div>

    </div>

  )

}