'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { resolverNegocioActual } from '@/lib/rolesClient'
import type { ResolucionNegocio } from '@/lib/roles'

// Caché a nivel de módulo para que el dashboard, la topbar y el modal
// compartan una sola consulta en lugar de disparar varias.
let cache: ResolucionNegocio | null = null
let cacheUserId: string | null = null
let inflight: Promise<ResolucionNegocio> | null = null

export function useRolActual() {
  const [resolucion, setResolucion] = useState<ResolucionNegocio | null>(cache)
  const [loading, setLoading] = useState(cache === null)

  const cargar = useCallback(async (forzar = false) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    if (!forzar && cache && cacheUserId === user.id) {
      setResolucion(cache)
      setLoading(false)
      return
    }

    if (inflight) {
      const r = await inflight
      setResolucion(r)
      setLoading(false)
      return
    }

    setLoading(true)
    inflight = resolverNegocioActual(supabase, user.id)
      .then((r) => {
        cache = r
        cacheUserId = user.id
        return r
      })
      .finally(() => {
        inflight = null
      })

    try {
      const r = await inflight
      setResolucion(r)
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
    cacheUserId = null
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
