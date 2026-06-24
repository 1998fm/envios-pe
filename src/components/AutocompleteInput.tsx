'use client'

import { useMemo, useState } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
}

export default function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
}: Props) {

  const [abierto, setAbierto] =
    useState(false)

  const filtrados =
    useMemo(() => {

      if (!value.trim()) {
        return options.slice(
          0,
          20
        )
      }

      return options
        .filter((item) =>
          item
            .toLowerCase()
            .includes(
              value.toLowerCase()
            )
        )
        .slice(0, 20)

    }, [value, options])

  return (

    <div className="relative">

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(
            e.target.value
          )
          setAbierto(true)
        }}
        onFocus={() =>
          setAbierto(true)
        }
        className="
          w-full
          border
          p-3
          rounded-xl
        "
      />

      {abierto &&
        filtrados.length > 0 && (

        <div
          className="
            absolute
            z-50
            mt-1
            w-full
            bg-white
            border
            rounded-xl
            shadow-lg
            max-h-60
            overflow-y-auto
          "
        >

          {filtrados.map(
            (item) => (

            <button
              key={item}
              type="button"
              onClick={() => {

                onChange(item)

                setAbierto(
                  false
                )

              }}
              className="
                w-full
                text-left
                px-4
                py-3
                hover:bg-gray-100
                text-sm
              "
            >
              {item}
            </button>

          ))}

        </div>

      )}

    </div>

  )
}