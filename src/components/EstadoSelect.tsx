'use client'

import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useEffect, useState } from 'react'

type Props = {
  envioId: string
  estadoActual: string
}

export default function EstadoSelect({
  envioId,
  estadoActual,
}: Props) {

  const supabase = createClient()

  const [estado, setEstado] =
    useState(estadoActual)

    useEffect(() => {
  setEstado(estadoActual)
}, [estadoActual])

  async function cambiarEstado(
    nuevoEstado: string
  ) {

    setEstado(nuevoEstado)

    const { error } = await supabase
      .from('envios')
      .update({
        estado: nuevoEstado,
      })
      .eq('id', envioId)

    if (error) {
      alert(error.message)
    }
  }

 const colorClase =
  estado === 'NO_EMPACADO'
    ? 'bg-red-50 text-red-700 border-red-200'
    : estado === 'EMPACADO'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-green-50 text-green-700 border-green-200'
    
  return (
  <select
    value={estado}
    onChange={(e) =>
      cambiarEstado(e.target.value)
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
      <option value="NO_EMPACADO">
         NO EMPACADO
      </option>

      <option value="EMPACADO">
         EMPACADO
      </option>

      <option value="ENVIADO">
         ENVIADO
      </option>

    </select>
  )
}