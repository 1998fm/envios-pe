'use client'

import { useEffect, useRef } from 'react'

/**
 * Llama a `accion` cada `cadaMs` mientras la pestaña esté visible, y también al
 * volver a ella. Reemplaza a las suscripciones en tiempo real que antes abría el
 * navegador directo contra la base (ahora todo pasa por el servidor).
 */
export function usePolling(accion: () => void | Promise<unknown>, cadaMs = 10_000, activo = true) {
  const ref = useRef(accion)
  useEffect(() => {
    ref.current = accion
  })

  useEffect(() => {
    if (!activo) return
    let ocupado = false
    const tick = async () => {
      if (ocupado || document.visibilityState !== 'visible') return
      ocupado = true
      try { await ref.current() }
      catch { /* La siguiente actualización puede reintentar sin solaparse. */ }
      finally { ocupado = false }
    }
    const id = setInterval(tick, cadaMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [cadaMs, activo])
}
