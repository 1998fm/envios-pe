type Props = {
  tipoEtiqueta: 'A4' | 'INDIVIDUAL'
  gruposEtiquetas: any[][]
  enviosEtiquetas: any[]
  logoUrl: string
}

export default function EtiquetasImpresion({
  tipoEtiqueta,
  gruposEtiquetas,
  enviosEtiquetas,
  logoUrl,
}: Props) {
  
  return (
    <div
      id="zona-impresion"
      className="fixed -left-[99999px] top-0"
    >

        {/* 4 ETIQUETAS POR HOJA */}

  {tipoEtiqueta === 'A4' && (

  <>

    {gruposEtiquetas.map(
      (grupo, pagina) => (

        <div
          key={pagina}
          className="
            grid
            grid-cols-2
            gap-2
            min-h-screen
            break-after-page
            p-2
          "
        >

          {grupo.map((envio: any) => (

   <div
  key={envio.id}
  className="
  border-2
  border-gray-300
  rounded-xl
  overflow-hidden
  bg-white
  flex
  flex-col
  min-h-[46vh]
"
>

  {/* CABECERA */}

  <div
    className="
      bg-black
      text-white
      text-center
      py-2
      font-bold
      tracking-wide
    "
  >
    {envio.nombre_metodo || envio.metodo}
  </div>

  <div
    className="
      p-4
      flex
      flex-col
      flex-1
    "
  >

    {/* LOGO */}

    <div
      className="
        flex
        justify-center
        pb-3
        border-b
      "
    >

      {logoUrl && (

        <img
          src={logoUrl}
          alt="Logo"
          className="
            h-12
            object-contain
          "
        />

      )}

    </div>

    {/* CLIENTE */}

    <div className="mt-4">

      <div
        className="
          text-[10px]
          uppercase
          text-gray-500
          font-bold
        "
      >
        Cliente
      </div>

      <div
        className="
          text-2xl
          font-bold
          leading-tight
        "
      >
        {envio.nombre}
      </div>

    </div>

    {/* DNI */}

    <div className="mt-3">

      <div
        className="
          text-[10px]
          uppercase
          text-gray-500
          font-bold
        "
      >
        DNI
      </div>

      <div
        className="
          font-medium
        "
      >
        {envio.dni}
      </div>

    </div>

    {/* TELÉFONO */}

    <div className="mt-2">

      <div
        className="
          text-[10px]
          uppercase
          text-gray-500
          font-bold
        "
      >
        Teléfono
      </div>

      <div
        className="
          font-medium
        "
      >
        {envio.telefono}
      </div>

    </div>

    {/* DETALLE */}

    <div
      className="
        mt-4
        pt-3
        border-t
        flex-1
      "
    >

      <div
        className="
          text-[10px]
          uppercase
          text-gray-500
          font-bold
          mb-2
        "
      >
        Detalle de entrega
      </div>

      <div
        className="
          text-sm
          whitespace-pre-line
          leading-snug
        "
      >
        {envio.detalle}
      </div>

    </div>

  </div>

</div>

)
          )}

        </div>

      )
    )}

  </>

)}

  {/* INDIVIDUAL */}

  {tipoEtiqueta ===
    'INDIVIDUAL' && (

    <div>

      {enviosEtiquetas.map((envio: any) => (

  <div
  key={envio.id}
  className="
    min-h-screen
    p-4
    break-after-page
    bg-white
  "
>

  <div
    className="
      h-[95vh]
      border-2
      border-gray-300
      rounded-xl
      overflow-hidden
      bg-white
      flex
      flex-col
    "
  >

    {/* CABECERA */}

    <div
      className="
        bg-black
        text-white
        text-center
        py-4
        text-3xl
        font-bold
        tracking-wide
      "
    >
      {envio.nombre_metodo || envio.metodo}
    </div>

    <div
      className="
        p-8
        flex
        flex-col
        flex-1
      "
    >

      {/* LOGO */}

      <div
        className="
          flex
          justify-center
          pb-6
          border-b
        "
      >

        {logoUrl && (

          <img
            src={logoUrl}
            alt="Logo"
            className="
              h-24
              object-contain
            "
          />

        )}

      </div>

      {/* CLIENTE */}

      <div className="mt-8">

        <div
          className="
            text-sm
            uppercase
            text-gray-500
            font-bold
          "
        >
          Cliente
        </div>

        <div
          className="
            text-5xl
            font-bold
            leading-tight
          "
        >
          {envio.nombre}
        </div>

      </div>

      {/* DNI */}

      <div className="mt-8">

        <div
          className="
            text-sm
            uppercase
            text-gray-500
            font-bold
          "
        >
          DNI
        </div>

        <div
          className="
            text-3xl
            font-medium
          "
        >
          {envio.dni}
        </div>

      </div>

      {/* TELÉFONO */}

      <div className="mt-6">

        <div
          className="
            text-sm
            uppercase
            text-gray-500
            font-bold
          "
        >
          Teléfono
        </div>

        <div
          className="
            text-3xl
            font-medium
          "
        >
          {envio.telefono}
        </div>

      </div>

      {/* DETALLE */}

      <div
        className="
          mt-8
          pt-6
          border-t
          flex-1
        "
      >

        <div
          className="
            text-sm
            uppercase
            text-gray-500
            font-bold
            mb-3
          "
        >
          Detalle de entrega
        </div>

        <div
          className="
            text-2xl
            whitespace-pre-line
            leading-relaxed
          "
        >
          {envio.detalle}
        </div>

      </div>

    </div>

  </div>

</div>

        )
      )}

    </div>

  )}

    </div>
  )
}