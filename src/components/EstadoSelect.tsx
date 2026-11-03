'use client'

import { useState } from 'react'
import MenuSelect from '@/components/ui/MenuSelect'
import { toast } from 'sonner'
import { api, ErrorApi } from '@/lib/clienteApi'

type Props = {
  envioId: string
  estadoActual: string
}

const options = [
  { value: 'NO_EMPACADO', label: 'No Empacado' },
  { value: 'EMPACADO', label: 'Empacado' },
  { value: 'EN_OBSERVACION', label: 'En Observación' },
  { value: 'ENVIADO', label: 'Enviado' },
]

function badge(value: string) {
  switch (value) {
    case 'ENVIADO':
      return { label: 'Enviado', className: 'bg-emerald-100  text-emerald-700  border-emerald-200 ' }
    case 'EMPACADO':
      return { label: 'Empacado', className: 'bg-amber-100  text-amber-700  border-amber-200 ' }
    case 'EN_OBSERVACION':
      return { label: 'En Obs.', className: 'bg-purple-100  text-purple-700  border-purple-200 ' }
    default:
      return { label: 'No Emp.', className: 'bg-red-100  text-red-700  border-red-200 ' }
  }
}

export default function EstadoSelect({ envioId, estadoActual }: Props) {
  const [estado, setEstado] = useState(estadoActual)

  async function cambiarEstado(nuevoEstado: string) {
    const anterior = estado
    setEstado(nuevoEstado)
    try {
      // El servidor también pasa a COMPLETADO las ventas ligadas si es ENVIADO.
      await api(`/api/envios/${envioId}`, { method: 'PATCH', json: { estado: nuevoEstado } })
    } catch (e) {
      setEstado(anterior)
      toast.error(e instanceof ErrorApi ? e.message : 'No se pudo cambiar el estado')
    }
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
