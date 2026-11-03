import type { Page } from '@playwright/test'

// Auditoría de pantalla para celular: detecta lo que se sale o queda cortado.

export type Hallazgo = { tipo: 'scroll-horizontal' | 'se-sale' | 'recortado'; detalle: string }

/**
 * Revisa la página actual en el viewport actual y devuelve lo que no cabe:
 *  - scroll-horizontal: la página entera se puede desplazar de lado.
 *  - se-sale: un elemento visible cuyo borde derecho/izquierdo queda fuera de la pantalla
 *    (salvo dentro de un contenedor con scroll horizontal intencional).
 *  - recortado: un elemento que asoma por un ancestro con overflow oculto (se ve cortado).
 */
export async function auditarPantalla(page: Page): Promise<Hallazgo[]> {
  return page.evaluate(() => {
    const out: { tipo: 'scroll-horizontal' | 'se-sale' | 'recortado'; detalle: string }[] = []
    const ancho = document.documentElement.clientWidth
    const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
    if (sw > ancho + 1) out.push({ tipo: 'scroll-horizontal', detalle: `la página mide ${sw}px y la pantalla ${ancho}px` })

    const nombre = (el: Element) => {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32)
      const c = typeof (el as HTMLElement).className === 'string' ? (el as HTMLElement).className.split(' ').slice(0, 4).join('.') : ''
      return `<${el.tagName.toLowerCase()}${c ? '.' + c : ''}>${t ? ` «${t}»` : ''}`
    }
    const scrollX = (cs: CSSStyleDeclaration) => cs.overflowX === 'auto' || cs.overflowX === 'scroll'
    const clipX = (cs: CSSStyleDeclaration) => cs.overflowX === 'hidden' || cs.overflowX === 'clip'

    const vistos = new Set<string>()
    const todos = Array.from(document.body.querySelectorAll('*')) as HTMLElement[]
    for (const el of todos) {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) continue
      // se ignoran los SVG internos y decoraciones fuera de flujo (blur de fondo, etc.)
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue
      if (cs.pointerEvents === 'none' && (cs.position === 'absolute' || cs.position === 'fixed') && r.width > ancho) continue

      // ¿está dentro de un contenedor con scroll horizontal? entonces es intencional
      let dentroScroll = false
      let recortadoPor: HTMLElement | null = null
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const acs = getComputedStyle(a)
        const ar = a.getBoundingClientRect()
        if (scrollX(acs)) {
          dentroScroll = true
          break
        }
        if (clipX(acs) && (r.right > ar.right + 2 || r.left < ar.left - 2) && ar.width > 8) {
          recortadoPor = a
          break
        }
        if (acs.position === 'fixed') break
      }
      if (dentroScroll) continue

      if (recortadoPor) {
        // decoración (manchas de fondo) a propósito recortada
        if (el.closest('[aria-hidden="true"], .pointer-events-none')) continue
        // solo el elemento más externo: si su padre ya asoma igual, el padre se reporta
        const pa = el.parentElement
        if (pa && pa !== recortadoPor) {
          const pr = pa.getBoundingClientRect()
          const rr = recortadoPor.getBoundingClientRect()
          if (pr.right > rr.right + 2 || pr.left < rr.left - 2) continue
        }
        const k = `rec|${nombre(el)}`
        if (!vistos.has(k)) {
          vistos.add(k)
          out.push({ tipo: 'recortado', detalle: `${nombre(el)} asoma ${Math.round(r.right - recortadoPor.getBoundingClientRect().right)}px por ${nombre(recortadoPor)}` })
        }
        continue
      }
      if (r.right > ancho + 2 || r.left < -2) {
        // se ignora un contenedor que solo es más ancho porque lo es su contenido ya reportado
        const k = `sale|${nombre(el)}`
        if (!vistos.has(k)) {
          vistos.add(k)
          out.push({ tipo: 'se-sale', detalle: `${nombre(el)} va de ${Math.round(r.left)} a ${Math.round(r.right)}px (pantalla ${ancho}px)` })
        }
      }
    }
    return out.slice(0, 25)
  })
}
