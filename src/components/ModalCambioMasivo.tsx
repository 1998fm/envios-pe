'use client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Checkbox from '@/components/ui/Checkbox'
import Select from '@/components/ui/Select'
import FieldGroup from '@/components/ui/FieldGroup'
import Field from '@/components/ui/Field'
import type { Envio } from '@/types/envio'
type Props = {

  abierto: boolean

  metodoMasivo: string
  setMetodoMasivo: (value: string) => void

  estadoOrigenMasivo: Envio['estado']
  setEstadoOrigenMasivo: (value: Envio['estado']) => void

  estadoDestinoMasivo: Envio['estado']
  setEstadoDestinoMasivo: (value: Envio['estado']) => void

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
    fixed inset-0 bg-black/40 backdrop-blur-sm
    flex items-center justify-center z-50 p-4
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
        Cambio Masivo
      </h2>

      <p
        className="
          mt-2 text-sm text-slate-500 dark:text-slate-400
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
        e.target.value as Envio['estado']
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
      e.target.value as Envio['estado']
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
        text-slate-700 dark:text-slate-300
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
            text-slate-400 dark:text-slate-500
            font-semibold
            mb-4
          "
        >
          Resumen
        </div>

        {soloSeleccionados ? (

          <div className="text-slate-600 dark:text-slate-400 text-sm">

            Se modificarán

            <span className="font-bold text-slate-900 dark:text-slate-100">
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
              text-slate-500 dark:text-slate-400
            "
          >

            <div>

              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Método:
              </span>{" "}

              {metodoMasivo}

            </div>

            <div>

              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Estado actual:
              </span>{" "}

              {estadoOrigenMasivo}

            </div>

            <div>

              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Nuevo estado:
              </span>{" "}

              <span className="text-sky-600 dark:text-sky-400 font-bold">
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
    border-t border-slate-100 dark:border-slate-700
    p-6
    flex
    justify-end
    gap-4
    bg-white dark:bg-slate-800
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