'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Disparador = {
  onMouseEnter: () => void
  onMouseLeave: () => void
  ref: (el: HTMLElement | null) => void
}

type Props = {
  /** Elemento que abre la burbuja al pasar el mouse. */
  trigger: (p: Disparador) => ReactNode
  children: ReactNode
}

const ANCHO = 340
const MARGEN = 12
/** Margen de gracia: tiempo que se espera por si el mouse va camino de la burbuja. */
const CIERRE_MS = 180

/**
 * Burbuja que se abre al pasar el mouse.
 *
 * Se dibuja en un portal pegado al body porque la tabla vive dentro de un
 * contenedor con `overflow`, y ahí cualquier burbuja absoluta se cortaba en el
 * borde. Por eso la anterior "a veces no aparecía".
 *
 * Sobre el parpadeo: no se cierra con un "mousemove" global. Ese enfoque hace
 * parpadear la burbuja, porque cualquier movimiento del mouse fuera del
 * disparador la cerraba; como la tabla se redibuja, el elemento bajo el cursor
 * cambiaba y se disparaba un mouseleave que la volvía a cerrar en bucle.
 * En su lugar usa intención de hover: al salir se espera un instante por si el
 * mouse va hacia la burbuja, y entrar en ella cancela el cierre.
 */
export default function Burbuja({ trigger, children }: Props) {
  const [caja, setCaja] = useState<{ top: number; left: number } | null>(null)
  const disparadorRef = useRef<HTMLElement | null>(null)
  const burbujaRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelarCierre = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const cerrar = useCallback(() => {
    cancelarCierre()
    setCaja(null)
  }, [cancelarCierre])

  const agendarCierre = useCallback(() => {
    cancelarCierre()
    timerRef.current = setTimeout(() => setCaja(null), CIERRE_MS)
  }, [cancelarCierre])

  const abrir = useCallback(() => {
    cancelarCierre()
    const el = disparadorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()

    // Si no cabe abajo (filas de abajo, o pantalla chica), se abre arriba.
    const ALTO_ESTIMADO = 230
    const cabeAbajo = r.bottom + ALTO_ESTIMADO + MARGEN <= window.innerHeight
    const arriba = !cabeAbajo && r.top - ALTO_ESTIMADO - MARGEN > 0

    setCaja({
      top: arriba ? r.top - MARGEN : r.bottom + MARGEN,
      // Alineada a la derecha del disparador y contenida en la ventana.
      left: Math.min(Math.max(MARGEN, r.right - ANCHO), window.innerWidth - ANCHO - MARGEN),
    })
  }, [cancelarCierre])

  // Al mover o redimensionar la ventana, la posición calculada deja de servir.
  useEffect(() => {
    const invalidar = () => cerrar()
    window.addEventListener('scroll', invalidar, true)
    window.addEventListener('resize', invalidar)
    return () => {
      window.removeEventListener('scroll', invalidar, true)
      window.removeEventListener('resize', invalidar)
    }
  }, [cerrar])

  // Limpieza del temporizador al desmontar.
  useEffect(() => cancelarCierre, [cancelarCierre])

  return (
    <>
      {trigger({ onMouseEnter: abrir, onMouseLeave: agendarCierre, ref: (el) => { disparadorRef.current = el } })}
      {caja &&
        createPortal(
          <div
            ref={burbujaRef}
            // Entrar en la burbuja cancela el cierre pendiente: el usuario se
            // está moviendo hacia ella para leer, no saliendo.
            onMouseEnter={cancelarCierre}
            onMouseLeave={agendarCierre}
            style={{ top: caja.top, left: caja.left, width: ANCHO }}
            className="fixed z-[80] rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-2xl shadow-slate-900/15"
          >
            {children}
          </div>,
          document.body
        )}
    </>
  )
}
