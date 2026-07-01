interface Props {
  titulo: string

  dias: string[]
  setDias: React.Dispatch<React.SetStateAction<string[]>>

  hora: string
  setHora: React.Dispatch<React.SetStateAction<string>>

  limitar: boolean
  setLimitar: React.Dispatch<React.SetStateAction<boolean>>

  cupo: number
  setCupo: React.Dispatch<React.SetStateAction<number>>
}

export default function ConfiguracionLogistica({
  titulo,

  dias,
  setDias,

  hora,
  setHora,

  limitar,
  setLimitar,

  cupo,
  setCupo,
}: Props) {
  const diasSemana = [
    {
      value: 'MONDAY',
      label: 'Lunes',
    },
    {
      value: 'TUESDAY',
      label: 'Martes',
    },
    {
      value: 'WEDNESDAY',
      label: 'Miércoles',
    },
    {
      value: 'THURSDAY',
      label: 'Jueves',
    },
    {
      value: 'FRIDAY',
      label: 'Viernes',
    },
    {
      value: 'SATURDAY',
      label: 'Sábado',
    },
    {
      value: 'SUNDAY',
      label: 'Domingo',
    },
  ]

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
        {titulo}
      </h3>

      <div className="mt-6">
        <p
          className="
            font-medium
            mb-3
          "
        >
          Días de atención
        </p>

        <div
          className="
            grid
            grid-cols-2
            gap-3
          "
        >
          {diasSemana.map((dia) => (
            <label
              key={dia.value}
              className="
                flex
                items-center
                gap-3
                cursor-pointer
              "
            >
              <input
                type="checkbox"
                checked={dias.includes(dia.value)}
                onChange={() => {
                  if (dias.includes(dia.value)) {
                    setDias(
                      dias.filter(
                        (d: string) => d !== dia.value
                      )
                    )
                  } else {
                    setDias([
                      ...dias,
                      dia.value,
                    ])
                  }
                }}
              />

              <span>{dia.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <label
          className="
            block
            font-medium
            mb-3
          "
        >
          Hora de corte
        </label>

        <input
          type="time"
          value={hora}
          onChange={(e) =>
            setHora(e.target.value)
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

        <p
          className="
            text-sm
            text-gray-500
            mt-2
          "
        >
          Después de esta hora los nuevos pedidos
          pasarán automáticamente al siguiente
          día disponible.
        </p>
      </div>

      <div
        className="
          mt-8
          border-t
          pt-6
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
            checked={limitar}
            onChange={(e) =>
              setLimitar(e.target.checked)
            }
          />

          <span
            className="
              font-medium
            "
          >
            Limitar envíos por día
          </span>
        </label>

        <p
          className="
            text-sm
            text-gray-500
            mt-2
            mb-4
          "
        >
          Si se alcanza el límite diario,
          los siguientes pedidos se moverán
          automáticamente al siguiente día
          disponible.
        </p>

        {limitar && (
          <div>
            <label
              className="
                block
                font-medium
                mb-2
              "
            >
              Cupo máximo por día
            </label>

            <input
              type="number"
              min="1"
              value={cupo}
              onChange={(e) =>
                setCupo(Number(e.target.value))
              }
              className="
                w-40
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