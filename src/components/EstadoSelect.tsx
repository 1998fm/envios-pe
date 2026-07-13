'use client'

import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useState } from 'react'
import MenuSelect from '@/components/ui/MenuSelect'

type Props = {
  envioId: string
  estadoActual: string
}

const options = [
  { value: 'NO_EMPACADO', label: 'No Empacado' },
  { value: 'EMPACADO', label: 'Empacado' },
  { value: 'ENVIADO', label: 'Enviado' },
]

function badge(value: string) {
  switch (value) {
    case 'ENVIADO':
      return { label: 'Enviado', className: 'bg-emerald-100  text-emerald-700  border-emerald-200 ' }
    case 'EMPACADO':
      return { label: 'Empacado', className: 'bg-amber-100  text-amber-700  border-amber-200 ' }
    default:
      return { label: 'No Emp.', className: 'bg-red-100  text-red-700  border-red-200 ' }
  }
}

export default function EstadoSelect({ envioId, estadoActual }: Props) {
  const supabase = createClient()
  const [estado, setEstado] = useState(estadoActual)

  async function cambiarEstado(nuevoEstado: string) {
    setEstado(nuevoEstado)
    const { error } = await supabase
      .from('envios')
      .update({ estado: nuevoEstado })
      .eq('id', envioId)
    if (error) alert(error.message)
  }

  return (
    <MenuSelect
      value={estado}
      onChange={cambiarEstado}
      options={options}
      badge={badge}
      align="right"
    />
  )
}
