/* ========================================
   PROPS
======================================== */

interface Props {

  total: number

  cobrar: number

  noCobrar: number

}

/* ========================================
   RESUMEN
======================================== */

export default function ResumenCopiarDatos({

  total,

  cobrar,

  noCobrar

}: Props) {

  return (

    <div
     className="
  grid
  grid-cols-1
  md:grid-cols-3
  gap-5
  mb-8
"
    >

      {/* ========================================
          PEDIDOS
      ======================================== */}

      <div
        className="
  bg-white
  border
  border-gray-100
  rounded-[28px]
  p-6
  text-center
  shadow-sm
"
      >

        <p
  className="
  text-sm
  uppercase
  tracking-wider
  text-gray-500
  font-semibold
"
        >
          Pedidos
        </p>

        <h2
         className="
  text-4xl
  font-extrabold
  mt-3
  text-cyan-600
"
        >
          {total}
        </h2>

      </div>

      {/* ========================================
    COBRAR
======================================== */}

<div
  className="
    bg-white
    border
    border-gray-100
    rounded-[28px]
    p-6
    text-center
    shadow-sm
  "
>

  <p
    className="
      text-sm
      uppercase
      tracking-wider
      text-gray-500
      font-semibold
    "
  >
    Cobrar envío
  </p>

  <h2
    className="
      text-4xl
      font-extrabold
      mt-3
      text-green-600
    "
  >
    {cobrar}
  </h2>

</div>

      {/* ========================================
    NO COBRAR
======================================== */}

<div
  className="
    bg-white
    border
    border-gray-100
    rounded-[28px]
    p-6
    text-center
    shadow-sm
  "
>

  <p
    className="
      text-sm
      uppercase
      tracking-wider
      text-gray-500
      font-semibold
    "
  >
    No cobrar
  </p>

  <h2
    className="
      text-4xl
      font-extrabold
      mt-3
      text-red-600
    "
  >
    {noCobrar}
  </h2>

</div>
    </div>

  )

}