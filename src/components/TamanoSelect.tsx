'use client'

import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useEffect, useState } from 'react'

type Props = {
  envioId: string
  tamanoActual: string | null
}

export default function TamanoSelect({
  envioId,
  tamanoActual,
}: Props) {

  const supabase = createClient()

  const [tamano, setTamano] =
    useState(tamanoActual || '')

  useEffect(() => {

    setTamano(
      tamanoActual || ''
    )

  }, [tamanoActual])

  async function actualizarTamano(
    nuevoTamano: string
  ) {

    setTamano(nuevoTamano)

    const { error } =
      await supabase
        .from('envios')
        .update({
          tamano: nuevoTamano,
        })
        .eq('id', envioId)

    if (error) {
      alert(error.message)
    }

  }

  const colorClase =
    tamano === 'PAQUETE XS'
      ? 'bg-sky-50 text-sky-700 border-sky-200'
      : tamano === 'PAQUETE S'
      ? 'bg-green-50 text-green-700 border-green-200'
      : tamano === 'PAQUETE M'
      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : tamano === 'PAQUETE L'
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-slate-50 text-slate-700 border-slate-200'

  return (

    <select
      value={tamano}
      onChange={(e) =>
        actualizarTamano(
          e.target.value
        )
      }
      className={`
        text-xs
        font-bold
        rounded-xl
        px-3
        py-1.5
        border
        cursor-pointer
        outline-none
        transition-all
        hover:opacity-90
        ${colorClase}
      `}
    >

      <option value="">
        Sin definir
      </option>

      <option value="PAQUETE XS">
        PAQUETE XS
      </option>

      <option value="PAQUETE S">
        PAQUETE S
      </option>

      <option value="PAQUETE M">
        PAQUETE M
      </option>

      <option value="PAQUETE L">
        PAQUETE L
      </option>

    </select>

  )

}