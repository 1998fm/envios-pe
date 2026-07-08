'use client'

import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useEffect, useState } from 'react'
import Select from '@/components/ui/Select'

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

 
    
  return (
 <Select
  value={estado}
  onChange={(e) =>
    cambiarEstado(e.target.value)
  }
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

    </Select>
  )
}