'use client'

import { useEffect, useState } from 'react'
import agenciasFallback from '@/data/agencias-shalom.json'

// Caché de módulo: se comparte entre todos los consumidores para evitar
// repetir el fetch del endpoint cada vez que se monta un componente.
let cachePromesa: Promise<string[]> | null = null

function cargarAgencias(): Promise<string[]> {
  if (cachePromesa) return cachePromesa

  cachePromesa = (async () => {
    try {
      const res = await fetch('/api/shalom/agencias', { cache: 'force-cache' })
      if (res.ok) {
        const json = await res.json()
        const lista = Array.isArray(json?.agencias) ? json.agencias : null
        if (lista && lista.length > 0) return lista
      }
    } catch (e) {
      console.error('[shalom] error cargando agencias:', e)
    }
    // Respaldos automáticos si el endpoint falla o viene vacío.
    return agenciasFallback
  })()

  return cachePromesa
}

export function useAgenciasShalom(): { agencias: string[]; cargando: boolean } {
  const [agencias, setAgencias] = useState<string[]>(agenciasFallback)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    cargarAgencias().then((lista) => {
      if (activo) {
        setAgencias(lista)
        setCargando(false)
      }
    })
    return () => {
      activo = false
    }
  }, [])

  return { agencias, cargando }
}
