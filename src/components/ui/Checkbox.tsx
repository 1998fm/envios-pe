'use client'

interface CheckboxProps {

  checked: boolean

  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void

  className?: string

}

export default function Checkbox({

  checked,

  onChange,

  className = ''

}: CheckboxProps) {

  return (

    <input

      type="checkbox"

      checked={checked}

      onChange={onChange}

      className={`
        w-5
        h-5
        rounded-md

        accent-cyan-600

        cursor-pointer

        transition

        ${className}
      `}

    />

  )

}