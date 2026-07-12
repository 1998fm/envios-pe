'use client'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import FieldGroup from '@/components/ui/FieldGroup'

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
        fixed inset-0 bg-black/40 backdrop-blur-sm
        flex items-center justify-center p-4 z-50
      "
    >

      <Card
        className="
          w-full
          max-w-lg
          overflow-hidden
        "
      >

        {/* HEADER */}

        <div
          className="
            p-8
            border-b border-slate-100 dark:border-slate-700
          "
        >

          <h2
            className="
              text-3xl
              font-extrabold
              text-slate-900 dark:text-slate-100
            "
          >
            Generar etiquetas
          </h2>

          <p
            className="
              mt-2 text-sm text-slate-500 dark:text-slate-400
            "
          >
            Selecciona el formato que deseas imprimir.
          </p>

        </div>

        {/* CONTENIDO */}

        <div
          className="
            p-8
            space-y-5
          "
        >

          <FieldGroup>

            <label
              className="
                flex
                items-start
                gap-4
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
                className="
                  mt-1
                "
              />

              <div>

                <div
                  className="
                    font-semibold
                    text-slate-900 dark:text-slate-100
                  "
                >
                  4 etiquetas por hoja
                </div>

                <div
                  className="
                    text-sm
                    text-slate-500 dark:text-slate-400
                    mt-1
                  "
                >
                  Distribución 2 × 2 para impresión en A4.
                </div>

              </div>

            </label>

          </FieldGroup>

          <FieldGroup>

            <label
              className="
                flex
                items-start
                gap-4
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
                className="
                  mt-1
                "
              />

              <div>

                <div
                  className="
                    font-semibold
                    text-slate-900 dark:text-slate-100
                  "
                >
                  Etiqueta individual
                </div>

                <div
                  className="
                    text-sm
                    text-slate-500 dark:text-slate-400
                    mt-1
                  "
                >
                  Una etiqueta por página.
                </div>

              </div>

            </label>

          </FieldGroup>

        </div>

        {/* FOOTER */}

        <div
          className="
            border-t border-slate-100 dark:border-slate-700
            p-6
            flex
            justify-end
            gap-4
            bg-white dark:bg-slate-800
          "
        >

          <Button
            type="secondary"
            onClick={onCerrar}
          >
            Cancelar
          </Button>

          <Button
            onClick={() => {

              onCerrar()

              setTimeout(() => {

                window.print()

              }, 300)

            }}
          >
            Imprimir
          </Button>

        </div>

      </Card>

    </div>

  )

}