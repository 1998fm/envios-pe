'use client'

import { useEffect, useRef } from 'react'

/**
 * Llama a `accion` cada `cadaMs` mientras la pestaña esté visible, y también al
 * volver a ella. Reemplaza a las suscripciones en tiempo real que antes abría el
 * navegador directo contra la base (ahora todo pasa por el servidor).
 */
export function usePolling(accion: () => void, cadaMs = 10_000, activo = true) {
  const ref = useRef(accion)
  useEffect(() => {
    ref.current = accion
  })

  useEffect(() => {
    if (!activo) return
    const tick = () => {
      if (document.visibilityState === 'visible') ref.current()
    }
    const id = setInterval(tick, cadaMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [cadaMs, activo])
}
