'use client'

import { useEffect, useState } from 'react'

/**
 * true cuando la pantalla es de celular (menos de 768 px, el breakpoint `md`).
 * Sirve para dibujar UNA sola versión (tarjetas en celular, tabla en pantalla
 * grande) en vez de las dos con CSS. En el primer render del servidor devuelve
 * false; en el navegador se corrige al instante.
 */
export function useEsMovil(maxPx = 767): boolean {
  return useMediaQuery(`(max-width: ${maxPx}px)`)
}

/** true en pantalla de escritorio (1024 px o más, el breakpoint `lg`). */
export function useEsEscritorio(minPx = 1024): boolean {
  return useMediaQuery(`(min-width: ${minPx}px)`)
}

function useMediaQuery(consulta: string): boolean {
  const [coincide, setCoincide] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const actualizar = () => setCoincide(mq.matches)
    actualizar()
    mq.addEventListener('change', actualizar)
    return () => mq.removeEventListener('change', actualizar)
  }, [consulta])

  return coincide
}
