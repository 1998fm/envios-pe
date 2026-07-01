import SelectorDias from '@/components/SelectorDias'

type Props = {

  dias: string[]
  setDias: React.Dispatch<React.SetStateAction<string[]>>

  usaHora: boolean
setUsaHora: React.Dispatch<React.SetStateAction<boolean>>

hora: string
setHora: React.Dispatch<React.SetStateAction<string>>

  limitar: boolean
  setLimitar: React.Dispatch<React.SetStateAction<boolean>>

  cupo: number
  setCupo: React.Dispatch<React.SetStateAction<number>>

}

export default function ConfiguracionMetodo({

  dias,
  setDias,

  usaHora,
setUsaHora,

hora,
setHora,

  limitar,
  setLimitar,

  cupo,
  setCupo,

}: Props) {

  return (

    <div
      className="
        ml-8
        mt-4
        rounded-2xl
        border
        bg-slate-50
        p-6
        space-y-6
      "
    >

      <div>

        <p
          className="
            font-semibold
            mb-3
          "
        >
          Días de atención
        </p>

        <SelectorDias
          value={dias}
          onChange={setDias}
        />

      </div>

      <div
  className="
    space-y-4
  "
>

  <label
    className="
      flex
      items-center
      gap-3
      cursor-pointer
    "
  >

    <input

      type="checkbox"

      checked={usaHora}

      onChange={(e)=>

        setUsaHora(
          e.target.checked
        )

      }

    />

    <span>

      Usar hora de corte

    </span>

  </label>

  {usaHora && (

    <input

      type="time"

      value={hora}

      onChange={(e)=>

        setHora(
          e.target.value
        )

      }

      className="
        border
        rounded-xl
        px-4
        py-2
        bg-white
      "

    />

  )}

</div>

      <label
        className="
          flex
          items-center
          gap-3
        "
      >

        <input

          type="checkbox"

          checked={limitar}

          onChange={(e)=>

            setLimitar(
              e.target.checked
            )

          }

        />

        <span>

          Limitar envíos por día

        </span>

      </label>

      {limitar && (

        <div
          className="
            flex
            items-center
            justify-between
            gap-6
            flex-wrap
          "
        >

          <label>

            Cupo máximo

          </label>

          <input

            type="number"

            min={1}

            value={cupo}

            onChange={(e)=>

              setCupo(

                Number(
                  e.target.value
                )

              )

            }

            className="
              w-28
              border
              rounded-xl
              px-4
              py-2
              bg-white
            "

          />

        </div>

      )}

    </div>

  )

}