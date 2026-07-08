'use client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Checkbox from '@/components/ui/Checkbox'
import Select from '@/components/ui/Select'
import FieldGroup from '@/components/ui/FieldGroup'
import Field from '@/components/ui/Field'
type Props = {

  abierto: boolean

  metodoMasivo: string
  setMetodoMasivo: (value: string) => void

  estadoOrigenMasivo: string
  setEstadoOrigenMasivo: (value: string) => void

  estadoDestinoMasivo: string
  setEstadoDestinoMasivo: (value: string) => void

  soloSeleccionados: boolean
  setSoloSeleccionados: (value: boolean) => void

  seleccionados: string[]

metodosDisponibles: {
  value: string
  label: string
}[]

aplicarCambioMasivo: () => void

  onCerrar: () => void

}

export default function ModalCambioMasivo({

  abierto,

  metodoMasivo,
  setMetodoMasivo,

  estadoOrigenMasivo,
  setEstadoOrigenMasivo,

  estadoDestinoMasivo,
  setEstadoDestinoMasivo,

  soloSeleccionados,
  setSoloSeleccionados,

seleccionados,

metodosDisponibles,

aplicarCambioMasivo,

  onCerrar,

}: Props) {

  if (!abierto) return null

  return (

    
    
     
  <div
  className="
    fixed
    inset-0
    bg-black/40
    flex
    items-center
    justify-center
    z-50
  "
>

<Card
  className="
    w-full
    max-w-xl
    max-h-[90vh]
    flex
    flex-col
    overflow-hidden
  "
>

    {/* Header */}

    <div
      className="
        p-8
        border-b
        border-gray-100
      "
    >

      <h2
        className="
          text-4xl
          font-extrabold
          text-slate-900
        "
      >
        Cambio Masivo
      </h2>

      <p
        className="
          mt-2
          text-gray-500
        "
      >
        Cambia el estado de múltiples pedidos al mismo tiempo.
      </p>

    </div>

    {/* Contenido */}
<div
  className="
    flex-1
    overflow-y-auto
    p-8
    space-y-6
  "
>

      {/* Método */}

      <FieldGroup>

         <Field label="Metodo">

      <Select

  value={metodoMasivo}

  onChange={(e)=>
    setMetodoMasivo(
      e.target.value
    )
  }

  disabled={soloSeleccionados}

>

  <option value="TODOS">
    Todos
  </option>

  {metodosDisponibles.map((metodo)=>(

    <option
      key={metodo.value}
      value={metodo.value}
    >
      {metodo.label}
    </option>

  ))}

</Select>
</Field>
</FieldGroup>

      {/* Estado actual */}

      <FieldGroup>

   <Field label="Estado actual">

  <Select
    value={estadoOrigenMasivo}
    onChange={(e) =>
      setEstadoOrigenMasivo(
        e.target.value
      )
    }
    disabled={soloSeleccionados}
  >
    <option value="NO_EMPACADO">
      No Empacado
    </option>

    <option value="EMPACADO">
      Empacado
    </option>

    <option value="ENVIADO">
      Enviado
    </option>

  </Select>
 </Field>
</FieldGroup>

      {/* Nuevo estado */}

      <FieldGroup>

        <Field label="Nuevo estado">

        <Select
  value={estadoDestinoMasivo}
  onChange={(e) =>
    setEstadoDestinoMasivo(
      e.target.value
    )
  }
>
  <option value="NO_EMPACADO">
    No Empacado
  </option>

  <option value="EMPACADO">
    Empacado
  </option>

  <option value="ENVIADO">
    Enviado
  </option>

</Select>
  </Field>
</FieldGroup>

      {/* Checkbox */}

      <FieldGroup>

  <div
    className="
      flex
      items-center
      gap-4
    "
  >

    <Checkbox
      checked={soloSeleccionados}
      onChange={(e) =>
        setSoloSeleccionados(
          e.target.checked
        )
      }
    />

    <label
      className="
        text-sm
        text-gray-700
        leading-relaxed
        select-none
      "
    >
      Aplicar solamente a los pedidos seleccionados.
    </label>

  </div>

</FieldGroup>

      {/* Resumen */}

     <FieldGroup>

        <div
          className="
            text-sm
            uppercase
            tracking-wider
            text-gray-500
            font-semibold
            mb-4
          "
        >
          Resumen
        </div>

        {soloSeleccionados ? (

          <div className="text-gray-700">

            Se modificarán

            <span className="font-bold text-slate-900">
              {" "}
              {seleccionados.length}
            </span>

            {" "}pedidos seleccionados.

          </div>

        ) : (

          <div
            className="
              space-y-2
              text-sm
              text-gray-600
            "
          >

            <div>

              <span className="font-semibold text-gray-800">
                Método:
              </span>{" "}

              {metodoMasivo}

            </div>

            <div>

              <span className="font-semibold text-gray-800">
                Estado actual:
              </span>{" "}

              {estadoOrigenMasivo}

            </div>

            <div>

              <span className="font-semibold text-gray-800">
                Nuevo estado:
              </span>{" "}

              <span className="text-cyan-700 font-bold">
                {estadoDestinoMasivo}
              </span>

            </div>

          </div>

        )}

      </FieldGroup>

    </div>

    {/* Footer */}

    <div
  className="
    border-t
    border-gray-100
    p-6
    flex
    justify-end
    gap-4
    bg-white
    shrink-0
  "
>

      <Button
        type="secondary"
        onClick={onCerrar}
      >
        Cerrar
      </Button>

      <Button
        onClick={aplicarCambioMasivo}
      >
        Aplicar cambios
      </Button>

    </div>

  </Card>

</div>

  )

}