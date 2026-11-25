'use client'

import {usePlan} from '@/context/PlanesContext'
import {openUpgrade} from '@/lib/planGating'
import { useState } from 'react'
import MenuSelect from '@/components/ui/MenuSelect'
import { toast } from 'sonner'
import { api, ErrorApi } from '@/lib/clienteApi'

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
  const {permite}=usePlan()
  const [tamano, setTamano] = useState(tamanoActual || '')

  async function actualizarTamano(nuevoTamano: string) {
    if(!permite('envios_tamano')){openUpgrade();return}
    const anterior = tamano
    setTamano(nuevoTamano)
    try {
      await api(`/api/envios/${envioId}`, { method: 'PATCH', json: { tamano: nuevoTamano } })
    } catch (e) {
      setTamano(anterior)
      toast.error(e instanceof ErrorApi ? e.message : 'No se pudo cambiar el tamaño')
    }
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
