import { useState, useEffect, useCallback } from 'react'
import type { Envio } from '@/types/envio'

type FetchEnviosParams = {
  userId: string | null
  busqueda: string
  filtrosEstado: string[]
  filtrosMetodo: string[]
}

export function useEnvios({ userId, busqueda, filtrosEstado, filtrosMetodo }: FetchEnviosParams) {
  const [envios, setEnvios] = useState<Envio[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchEnviosPage = useCallback(async (offset: number) => {
    if (!userId) return { data: [], hasMore: false }
    const params = new URLSearchParams({
      user_id: userId,
      offset: String(offset),
      limit: '50',
      busqueda,
      estados: filtrosEstado.join(','),
      metodos: filtrosMetodo.join(','),
    })
    const res = await fetch(`/api/envios?${params}`)
    const json = await res.json()
    if (!res.ok) return { data: [], hasMore: false }
    return { data: json.data as Envio[], hasMore: (json.offset + json.limit) < json.total }
  }, [userId, busqueda, filtrosEstado, filtrosMetodo])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetchEnviosPage(0).then((result) => {
      setEnvios(result.data)
      setHasMore(result.hasMore)
      setLoading(false)
    })
  }, [userId, busqueda, filtrosEstado, filtrosMetodo, fetchEnviosPage])

  async function cargarMas() {
    const result = await fetchEnviosPage(envios.length)
    if (result.data.length > 0) {
      setEnvios((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
    }
  }

  function actualizarEnvios(updater: Envio[] | ((prev: Envio[]) => Envio[])) {
    setEnvios(updater)
  }

  return { envios, setEnvios, hasMore, loading, cargarMas, actualizarEnvios }
}
