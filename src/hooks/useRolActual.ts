'use client'

import { useCallback, useEffect, useState } from 'react'
import { obtenerSesion } from '@/lib/clienteApi'
import type { ResolucionNegocio } from '@/lib/roles'

// Caché a nivel de módulo para que el dashboard, la topbar y el modal
// compartan una sola consulta en lugar de disparar varias.
let cache: ResolucionNegocio | null = null
let inflight: Promise<ResolucionNegocio | null> | null = null

export function useRolActual() {
  const [resolucion, setResolucion] = useState<ResolucionNegocio | null>(cache)
  const [loading, setLoading] = useState(cache === null)

  const cargar = useCallback(async (forzar = false) => {
    if (!forzar && cache) {
      setResolucion(cache)
      setLoading(false)
      return
    }

    if (!inflight) {
      inflight = obtenerSesion()
        .then((s) => {
          cache = s?.negocio ?? null
          return cache
        })
        .finally(() => {
          inflight = null
        })
    }

    setLoading(true)
    try {
      setResolucion(await inflight)
    } catch {
      setResolucion(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Carga inicial del rol: es una lectura externa, el setState ocurre
    // después del await, no de forma síncrona en el cuerpo del efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  const refrescar = useCallback(async () => {
    cache = null
    await cargar(true)
  }, [cargar])

  return {
    ownerId: resolucion?.ownerId ?? null,
    userId: resolucion?.userId ?? null,
    // Fail-closed: mientras no se resuelve el rol no se Asume que sea
    // dueño, así un miembro nunca ve UI de administrador por un instante.
    esOwner: resolucion?.esOwner ?? false,
    esSuperAdmin: resolucion?.esSuperAdmin ?? false,
    rol: resolucion?.rol ?? null,
    sinTablasRoles: resolucion?.sinTablasRoles ?? false,
    loading,
    refrescar,
  }
}
