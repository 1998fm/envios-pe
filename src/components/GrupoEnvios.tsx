type Props = {

  fecha: string

  envios: any[]

}

export default function GrupoEnvios({

  fecha,

  envios,

}: Props) {

  return (

    <div>

      <div
        className="
          sticky
          top-0
          z-10
          bg-slate-100
          rounded-2xl
          px-6
          py-3
          mb-5
          border
        "
      >

        <h2
          className="
            text-lg
            font-bold
          "
        >

          📅 {new Date(fecha).toLocaleDateString(
            'es-PE',
            {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }
          )}

        </h2>

      </div>

      {envios.map((envio) => (

        <div key={envio.id}>

          {/* AQUÍ IRÁ LA TARJETA */}

        </div>

      ))}

    </div>

  )

}