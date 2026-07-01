type Props = {

  metodoMotorizado: boolean
  setMetodoMotorizado: React.Dispatch<React.SetStateAction<boolean>>

  metodoShalom: boolean
  setMetodoShalom: React.Dispatch<React.SetStateAction<boolean>>

  metodoOlva: boolean
  setMetodoOlva: React.Dispatch<React.SetStateAction<boolean>>

  metodoMarvisur: boolean
  setMetodoMarvisur: React.Dispatch<React.SetStateAction<boolean>>

  metodoFlores: boolean
  setMetodoFlores: React.Dispatch<React.SetStateAction<boolean>>

  metodoOtro: boolean
  setMetodoOtro: React.Dispatch<React.SetStateAction<boolean>>

  nombreMetodoOtro: string
  setNombreMetodoOtro: React.Dispatch<React.SetStateAction<string>>

}

export default function ConfiguracionMetodos({

  metodoMotorizado,
  setMetodoMotorizado,

  metodoShalom,
  setMetodoShalom,

  metodoOlva,
  setMetodoOlva,

  metodoMarvisur,
  setMetodoMarvisur,

  metodoFlores,
  setMetodoFlores,

  metodoOtro,
  setMetodoOtro,

  nombreMetodoOtro,
  setNombreMetodoOtro,

}: Props) {

  return (

    <div
      className="
        p-5
        border
        rounded-2xl
        bg-slate-50
      "
    >

      <h3
        className="
          text-lg
          font-bold
          mb-6
        "
      >
        Métodos disponibles
      </h3>

      <div
        className="
          space-y-4
        "
      >

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={metodoMotorizado}
            onChange={(e)=>
              setMetodoMotorizado(
                e.target.checked
              )
            }
          />
          <span>Motorizado</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={metodoShalom}
            onChange={(e)=>
              setMetodoShalom(
                e.target.checked
              )
            }
          />
          <span>Shalom</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={metodoOlva}
            onChange={(e)=>
              setMetodoOlva(
                e.target.checked
              )
            }
          />
          <span>Olva</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={metodoMarvisur}
            onChange={(e)=>
              setMetodoMarvisur(
                e.target.checked
              )
            }
          />
          <span>Marvisur</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={metodoFlores}
            onChange={(e)=>
              setMetodoFlores(
                e.target.checked
              )
            }
          />
          <span>Flores</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={metodoOtro}
            onChange={(e)=>
              setMetodoOtro(
                e.target.checked
              )
            }
          />
          <span>Otro método</span>
        </label>

        {metodoOtro && (

          <div>

            <label
              className="
                block
                mb-2
                font-medium
              "
            >
              Nombre del método
            </label>

            <input
              type="text"
              value={nombreMetodoOtro}
              onChange={(e)=>
                setNombreMetodoOtro(
                  e.target.value
                )
              }
              className="
                w-full
                border
                rounded-xl
                px-4
                py-3
                bg-white
              "
            />

          </div>

        )}

      </div>

    </div>

  )

}