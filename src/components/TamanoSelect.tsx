'use client'

import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useEffect, useState } from 'react'
import Select from '@/components/ui/Select'


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


  return (

    <Select
  value={tamano}
  onChange={(e) =>
    actualizarTamano(
      e.target.value
    )
  }
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

    </Select>

  )

}