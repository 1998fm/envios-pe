'use client'

import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useState } from 'react'
import MenuSelect from '@/components/ui/MenuSelect'

type Props = {
  envioId: string
  tamanoActual: string | null
}

const options = [
  { value: '', label: 'Sin definir' },
  { value: 'PAQUETE XS', label: 'Paquete XS' },
  { value: 'PAQUETE S', label: 'Paquete S' },
  { value: 'PAQUETE M', label: 'Paquete M' },
  { value: 'PAQUETE L', label: 'Paquete L' },
]

export default function TamanoSelect({ envioId, tamanoActual }: Props) {
  const supabase = createClient()
  const [tamano, setTamano] = useState(tamanoActual || '')

  async function actualizarTamano(nuevoTamano: string) {
    setTamano(nuevoTamano)
    const { error } = await supabase
      .from('envios')
      .update({ tamano: nuevoTamano })
      .eq('id', envioId)
    if (error) alert(error.message)
  }

  return (
    <MenuSelect
      value={tamano}
      onChange={actualizarTamano}
      options={options}
      align="right"
    />
  )
}
