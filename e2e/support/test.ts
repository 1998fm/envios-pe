import { expect as expectBase, test as testBase, type Locator, type Page } from '@playwright/test'
import { headless, pausaFinal, pausaResaltado } from './modo'

// `test` y `expect` con ayudas visuales para cuando los tests corren con la
// ventana abierta (modo por defecto). Sin ventana (headless/CI) no hacen nada.
//
//  · Arriba de la página queda una plaquita con el nombre del test.
//  · Cada verificación sobre un elemento lo RESALTA un momento (para saber
//    adónde mirar).
//  · Al terminar aparece un panel: qué se probó, qué se esperaba y si salió
//    bien (✓) o mal (✗); y la ventana espera unos segundos antes de cerrarse.
//
// Todos los specs importan `test` y `expect` de aquí.

type Registro = { ok: boolean; texto: string }
const registros = new Map<string, Registro[]>()

function idActual(): string | null {
  try {
    return testBase.info().testId
  } catch {
    return null
  }
}

function registrar(ok: boolean, texto: string) {
  const id = idActual()
  if (!id) return
  const lista = registros.get(id) ?? []
  lista.push({ ok, texto })
  registros.set(id, lista)
}

// ---------- descripción legible de cada verificación ----------

function corto(v: unknown, max = 70): string {
  let t: string
  if (typeof v === 'string') t = `«${v}»`
  else if (v instanceof RegExp) t = String(v)
  else if (v === undefined) t = 'undefined'
  else {
    try {
      t = JSON.stringify(v) ?? String(v)
    } catch {
      t = String(v)
    }
  }
  return t.length > max ? `${t.slice(0, max)}…` : t
}

function esLocator(v: unknown): v is Locator {
  return !!v && typeof v === 'object' && typeof (v as Locator).highlight === 'function' && typeof (v as Locator).waitFor === 'function'
}
function esPagina(v: unknown): v is Page {
  return !!v && typeof v === 'object' && typeof (v as Page).goto === 'function'
}

function describir(matcher: string, recibido: unknown, args: unknown[], negado: boolean, mensaje?: string): string {
  const no = negado ? 'NO ' : ''
  const a0 = args[0]
  const sobre = esLocator(recibido) ? `Elemento ${String(recibido).length > 60 ? `${String(recibido).slice(0, 60)}…` : String(recibido)}` : esPagina(recibido) ? 'La página' : mensaje ? '' : 'Valor'
  const frases: Record<string, string> = {
    toBeVisible: `${no}debe estar visible`,
    toBeHidden: `${no}debe estar oculto`,
    toBeEnabled: `${no}debe estar habilitado`,
    toBeDisabled: `${no}debe estar deshabilitado`,
    toBeChecked: `${no}debe estar marcado`,
    toHaveURL: `${no}debe tener la URL ${corto(a0)}`,
    toHaveTitle: `${no}debe tener el título ${corto(a0)}`,
    toContainText: `${no}debe contener el texto ${corto(a0)}`,
    toHaveText: `${no}debe tener el texto ${corto(a0)}`,
    toHaveValue: `${no}debe tener el valor ${corto(a0)}`,
    toHaveCount: `${no}debe haber ${corto(a0)} elemento(s)`,
    toHaveAttribute: `${no}debe tener el atributo ${corto(a0)}${args[1] !== undefined ? ` = ${corto(args[1])}` : ''}`,
    toBe: `${no}debe ser ${corto(a0)}${esLocator(recibido) ? '' : ` (recibido: ${corto(recibido)})`}`,
    toEqual: `${no}debe ser igual a ${corto(a0)}${esLocator(recibido) ? '' : ` (recibido: ${corto(recibido, 50)})`}`,
    toStrictEqual: `${no}debe ser igual a ${corto(a0)}`,
    toMatchObject: `${no}debe coincidir con ${corto(a0)}`,
    toContain: `${no}debe contener ${corto(a0)}`,
    toMatch: `${no}debe cumplir ${corto(a0)} (recibido: ${corto(recibido, 40)})`,
    toBeTruthy: `${no}debe ser verdadero (recibido: ${corto(recibido, 40)})`,
    toBeFalsy: `${no}debe ser falso (recibido: ${corto(recibido, 40)})`,
    toBeNull: `${no}debe ser nulo (recibido: ${corto(recibido, 40)})`,
    toBeDefined: `${no}debe existir`,
    toBeGreaterThan: `${no}debe ser mayor que ${corto(a0)} (recibido: ${corto(recibido)})`,
    toBeGreaterThanOrEqual: `${no}debe ser mayor o igual que ${corto(a0)} (recibido: ${corto(recibido)})`,
    toBeLessThan: `${no}debe ser menor que ${corto(a0)} (recibido: ${corto(recibido)})`,
    toBeLessThanOrEqual: `${no}debe ser menor o igual que ${corto(a0)} (recibido: ${corto(recibido)})`,
  }
  const frase = frases[matcher] ?? `${no}${matcher}(${args.map((x) => corto(x, 30)).join(', ')})`
  return mensaje ? `${mensaje} — ${frase}` : `${sobre} ${frase}`.trim()
}

// ---------- envoltura de expect ----------

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function resaltar(loc: Locator) {
  if (headless) return
  try {
    // highlight no espera al elemento: se limita el tiempo por si no existe
    await Promise.race([loc.highlight(), pausa(1500)])
    await pausa(pausaResaltado)
    await Promise.race([(loc as unknown as { hideHighlight?: () => Promise<void> }).hideHighlight?.() ?? Promise.resolve(), pausa(500)])
  } catch {
    // resaltar es solo ayuda visual
  }
}

function envolver<T extends object>(matchers: T, recibido: unknown, mensaje: string | undefined, negado: boolean): T {
  return new Proxy(matchers, {
    get(destino, prop, receptor) {
      const valor = Reflect.get(destino, prop, receptor)
      if (prop === 'not') return envolver(valor as object, recibido, mensaje, !negado)
      if (typeof prop !== 'string' || typeof valor !== 'function' || prop === 'resolves' || prop === 'rejects') return valor

      return (...args: unknown[]) => {
        const texto = describir(prop, recibido, args, negado, mensaje)
        const ok = () => registrar(true, texto)
        const mal = (e: unknown) => {
          registrar(false, texto)
          throw e
        }
        let resultado: unknown
        try {
          resultado = (valor as (...a: unknown[]) => unknown).apply(destino, args)
        } catch (e) {
          return mal(e) // verificación síncrona que falló: se conserva el lanzamiento síncrono
        }
        if (resultado && typeof (resultado as Promise<unknown>).then === 'function') {
          return (resultado as Promise<unknown>).then(
            async (r) => {
              ok()
              if (esLocator(recibido) && !negado && prop !== 'toBeHidden') await resaltar(recibido)
              return r
            },
            (e) => mal(e)
          )
        }
        ok()
        return resultado
      }
    },
  })
}

export const expect = new Proxy(expectBase, {
  apply(destino, _this, args: unknown[]) {
    const [recibido, opciones] = args
    const mensaje = typeof opciones === 'string' ? opciones : (opciones as { message?: string } | undefined)?.message
    const matchers = (destino as unknown as (...a: unknown[]) => object)(...args)
    return envolver(matchers, recibido, mensaje, false)
  },
  get(destino, prop, receptor) {
    if (prop === 'poll') {
      // expect.poll(() => consultaALaBase()).toBe(...)
      return (fn: unknown, opciones: unknown) => {
        const matchers = (destino.poll as unknown as (...a: unknown[]) => object)(fn, opciones)
        const mensaje = typeof opciones === 'object' && opciones && 'message' in opciones ? String((opciones as { message: string }).message) : 'Consulta repetida (hasta que se cumpla)'
        return envolver(matchers, undefined, mensaje, false)
      }
    }
    return Reflect.get(destino, prop, receptor)
  },
}) as typeof expectBase

// ---------- test con plaquita y panel final ----------

function montarPlaca({ titulo }: { titulo: string }) {
  const poner = () => {
    if (document.getElementById('__e2e_placa')) return
    // El texto va en un atributo y se dibuja con CSS (::before): así NO es un nodo de
    // texto de la página y no interfiere con getByText()/toContainText() de los tests
    // (el nombre del test suele repetir palabras que la pantalla también muestra).
    const css = document.createElement('style')
    css.id = '__e2e_placa_css'
    css.textContent = '#__e2e_placa::before{content:attr(data-titulo)}'
    document.documentElement.appendChild(css)
    const d = document.createElement('div')
    d.id = '__e2e_placa'
    d.setAttribute('data-titulo', `▶ ${titulo}`)
    d.setAttribute('aria-hidden', 'true')
    d.setAttribute(
      'style',
      'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483646;max-width:92vw;pointer-events:none;' +
        'background:rgba(15,23,42,.93);color:#fff;font:600 12px/1.3 system-ui,sans-serif;padding:6px 14px;border-radius:999px;' +
        'box-shadow:0 2px 12px rgba(0,0,0,.35);white-space:nowrap;overflow:hidden;text-overflow:ellipsis'
    )
    document.documentElement.appendChild(d)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poner)
  else poner()
}

function montarPanel(datos: { estado: string; titulo: string; grupo: string; items: Registro[]; extra: number; error: string }) {
  document.getElementById('__e2e_panel')?.remove()
  const color = datos.estado === 'passed' ? '#16a34a' : datos.estado === 'skipped' ? '#64748b' : '#dc2626'
  const etiqueta = datos.estado === 'passed' ? '✓ PASÓ' : datos.estado === 'skipped' ? '– OMITIDO' : datos.estado === 'timedOut' ? '✗ TIEMPO AGOTADO' : '✗ FALLÓ'
  const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)

  const filas = datos.items
    .map(
      (i) =>
        `<li style="display:flex;gap:8px;margin:5px 0;color:${i.ok ? '#0f172a' : '#b91c1c'}"><b style="color:${i.ok ? '#16a34a' : '#dc2626'}">${i.ok ? '✓' : '✗'}</b><span>${esc(i.texto)}</span></li>`
    )
    .join('')

  const p = document.createElement('div')
  p.id = '__e2e_panel'
  p.setAttribute(
    'style',
    'position:fixed;right:16px;bottom:16px;z-index:2147483647;width:min(520px,92vw);max-height:80vh;overflow:auto;pointer-events:none;' +
      `background:#fff;color:#0f172a;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.45);border:3px solid ${color};font:13px/1.4 system-ui,sans-serif`
  )
  p.innerHTML =
    `<div style="background:${color};color:#fff;padding:10px 14px;font-weight:800;font-size:15px;letter-spacing:.02em">${etiqueta}</div>` +
    `<div style="padding:12px 14px">` +
    `<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b">Qué se probó</div>` +
    `<div style="font-weight:700;margin:2px 0 2px">${esc(datos.titulo)}</div>` +
    (datos.grupo ? `<div style="color:#64748b;font-size:12px">${esc(datos.grupo)}</div>` : '') +
    `<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-top:12px">Qué se verificó</div>` +
    `<ul style="list-style:none;padding:0;margin:4px 0 0">${filas || '<li style="color:#64748b">(sin verificaciones registradas)</li>'}</ul>` +
    (datos.extra > 0 ? `<div style="color:#64748b;font-size:12px;margin-top:4px">… y ${datos.extra} verificación(es) más</div>` : '') +
    (datos.error ? `<div style="margin-top:10px;padding:8px 10px;background:#fef2f2;color:#991b1b;border-radius:8px;font:12px/1.4 ui-monospace,monospace;white-space:pre-wrap">${esc(datos.error)}</div>` : '') +
    `</div>`
  document.documentElement.appendChild(p)
}

export const test = testBase.extend({
  page: async ({ page }, use, testInfo) => {
    if (headless) {
      await use(page)
      return
    }

    const camino = testInfo.titlePath.slice(1) // sin el nombre del archivo
    const titulo = camino[camino.length - 1] ?? testInfo.title
    const grupo = camino.slice(0, -1).join(' › ')
    await page.addInitScript(montarPlaca, { titulo: camino.join(' › ') })

    await use(page)

    if (page.isClosed()) return
    const todos = registros.get(testInfo.testId) ?? []
    // Se muestran primero las que fallaron y luego las últimas; el resto se resume.
    const MAX = 14
    const fallos = todos.filter((r) => !r.ok)
    const resto = todos.filter((r) => r.ok)
    const mostradas = [...resto.slice(Math.max(0, resto.length - Math.max(0, MAX - fallos.length))), ...fallos].slice(0, MAX)
    const error = testInfo.errors[0]?.message?.replace(/\u001b\[[0-9;]*m/g, '').split('\n').slice(0, 4).join('\n') ?? ''

    await page
      .evaluate(montarPanel, {
        // Una verificación fallida nunca puede verse como "PASÓ" (aunque el código la haya ignorado).
        estado: fallos.length > 0 && testInfo.status === 'passed' ? 'failed' : (testInfo.status ?? 'passed'),
        titulo,
        grupo,
        items: mostradas,
        extra: Math.max(0, todos.length - mostradas.length),
        error,
      })
      .catch(() => {})
    // E2E_SHOT=1 guarda una captura del panel (útil para revisarlo sin mirar la pantalla).
    if (process.env.E2E_SHOT) {
      await page.screenshot({ path: `test-results/panel-${testInfo.testId}.png` }).catch(() => {})
    }
    // Se deja leer el resultado: más tiempo si falló.
    await page.waitForTimeout(testInfo.status === 'passed' && fallos.length === 0 ? pausaFinal : pausaFinal * 2).catch(() => {})
  },

  // Red de seguridad para TODOS los tests (con o sin navegador): si una
  // verificación falló y el test la ignoró (por ejemplo con .catch(() => {})), el
  // test se marca como fallido. Así "verde" siempre significa que todo se cumplió.
  verificacionesOcultas: [
    async ({}, use, testInfo) => {
      await use()
      const fallidas = (registros.get(testInfo.testId) ?? []).filter((r) => !r.ok)
      registros.delete(testInfo.testId)
      if (testInfo.status === 'passed' && fallidas.length > 0) {
        throw new Error(
          `El test terminó "bien" pero ${fallidas.length} verificación(es) fallaron y fueron ignoradas:\n` +
            fallidas.map((f) => ` ✗ ${f.texto}`).join('\n')
        )
      }
    },
    { auto: true },
  ],
})

export type { Page }
