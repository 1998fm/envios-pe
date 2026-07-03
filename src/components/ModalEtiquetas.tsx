'use client'

type Props = {
  abierto: boolean

  tipoEtiqueta: 'A4' | 'INDIVIDUAL'

  onCambiarTipo: (
    tipo: 'A4' | 'INDIVIDUAL'
  ) => void

  onCerrar: () => void
}

export default function ModalEtiquetas({
  abierto,
  tipoEtiqueta,
  onCambiarTipo,
  onCerrar,
}: Props) {

  if (!abierto) return null

  return (

    <div
      className="
        fixed
        inset-0
        bg-black/50
        z-50
        flex
        items-center
        justify-center
        p-4
      "
    >

      <div
        className="
          bg-white
          rounded-2xl
          w-full
          max-w-lg
          shadow-xl
        "
      >

        {/* TÍTULO */}

        <div
          className="
            px-6
            py-5
            border-b
          "
        >

          <h2
            className="
              text-2xl
              font-bold
            "
          >
            Generar etiquetas
          </h2>

          <p
            className="
              text-gray-500
              mt-1
            "
          >
            Selecciona el formato.
          </p>

        </div>

        {/* OPCIONES */}

        <div
          className="
            p-6
            space-y-4
          "
        >

          <label
            className="
              flex
              gap-3
              border
              rounded-xl
              p-4
              cursor-pointer
            "
          >

            <input
              type="radio"
              checked={
                tipoEtiqueta === 'A4'
              }
              onChange={() =>
                onCambiarTipo('A4')
              }
            />

            <div>

              <div
                className="
                  font-semibold
                "
              >
                4 etiquetas por hoja
              </div>

              <div
                className="
                  text-sm
                  text-gray-500
                "
              >
                Distribución 2 × 2
              </div>

            </div>

          </label>

          <label
            className="
              flex
              gap-3
              border
              rounded-xl
              p-4
              cursor-pointer
            "
          >

            <input
              type="radio"
              checked={
                tipoEtiqueta ===
                'INDIVIDUAL'
              }
              onChange={() =>
                onCambiarTipo(
                  'INDIVIDUAL'
                )
              }
            />

            <div>

              <div
                className="
                  font-semibold
                "
              >
                Etiqueta individual
              </div>

              <div
                className="
                  text-sm
                  text-gray-500
                "
              >
                Una etiqueta por página
              </div>

            </div>

          </label>

        </div>

        {/* BOTONES */}

        <div
          className="
            border-t
            px-6
            py-4
            flex
            justify-end
            gap-3
          "
        >

          <button
            onClick={onCerrar}
            className="
              px-4
              py-2
              rounded-xl
              bg-gray-100
            "
          >
            Cancelar
          </button>

          <button
            onClick={() => {

              onCerrar()

              setTimeout(() => {
                window.print()
              }, 300)

            }}
            className="
              px-5
              py-2
              rounded-xl
              bg-black
              text-white
            "
          >
            Imprimir
          </button>

        </div>

      </div>

    </div>

  )

}