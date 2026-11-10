'use client'

import { useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'inputMode' | 'pattern'> & {
  value: number
  onChange: (value: number) => void
}

/** Conserva el separador y los ceros mientras se escribe; entrega un número al formulario. */
export default function PrecioInput({ value, onChange, ...props }: Props) {
  const [estado, setEstado] = useState({ value, texto: value ? String(value) : '' })

  // Sincroniza cambios externos sin borrar el separador que se está escribiendo.
  if (estado.value !== value) {
    setEstado({ value, texto: value ? String(value) : '' })
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={estado.texto}
      onChange={(e) => {
        const texto = e.target.value
        if (!/^\d*([.,]\d*)?$/.test(texto)) return
        const numero = parseFloat(texto.replace(',', '.')) || 0
        setEstado({ value: numero, texto })
        onChange(numero)
      }}
    />
  )
}
