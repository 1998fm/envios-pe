type Props = {

  value: string[]

  onChange: (
    dias: string[]
  ) => void

}

const dias = [

  {
    value: 'MONDAY',
    label: 'L',
  },

  {
    value: 'TUESDAY',
    label: 'M',
  },

  {
    value: 'WEDNESDAY',
    label: 'X',
  },

  {
    value: 'THURSDAY',
    label: 'J',
  },

  {
    value: 'FRIDAY',
    label: 'V',
  },

  {
    value: 'SATURDAY',
    label: 'S',
  },

  {
    value: 'SUNDAY',
    label: 'D',
  },

]

export default function SelectorDias({

  value,

  onChange,

}: Props) {

  return (

    <div
      className="
        flex
        flex-wrap
        gap-2
      "
    >

      {dias.map((dia) => {

        const activo =
          value.includes(
            dia.value
          )

        return (

          <button

            key={dia.value}

            type="button"

            onClick={() => {

              if (activo) {

                onChange(

                  value.filter(

                    d =>

                      d !== dia.value

                  )

                )

              }

              else {

                onChange([

                  ...value,

                  dia.value,

                ])

              }

            }}

            className={`

              w-11
              h-11

              rounded-xl

              border

              font-semibold

              transition-all

              ${
                activo

                  ? `
                    bg-cyan-600
                    text-white
                    border-cyan-600
                  `

                  : `
                    bg-white
                    text-gray-600
                    border-gray-300
                    hover:border-cyan-500
                  `

              }

            `}

          >

            {dia.label}

          </button>

        )

      })}

    </div>

  )

}