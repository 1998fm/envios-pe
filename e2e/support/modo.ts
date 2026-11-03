// Modo de ejecución de los e2e (visible o sin ventana) y los tiempos asociados.
// Lo leen playwright.config.ts y los helpers visuales, para que coincidan.

const ci = !!process.env.CI

/** Sin ventana: por defecto solo en CI. E2E_HEADLESS=1 / 0 lo fuerza. */
export const headless = process.env.E2E_HEADLESS ? process.env.E2E_HEADLESS === '1' : ci

/** Pausa (ms) entre acciones en modo visible. E2E_SLOWMO=0 la quita. */
export const slowMo = headless ? 0 : Number(process.env.E2E_SLOWMO ?? 550)

/**
 * Cuánto se queda la ventana abierta al terminar cada test para poder leer el
 * resultado. Por defecto proporcional a slowMo; E2E_END_PAUSE=ms lo fija.
 * Si el test falla se duplica.
 */
export const pausaFinal = headless ? 0 : Number(process.env.E2E_END_PAUSE ?? slowMo * 5)

/** Cuánto se mantiene resaltado el elemento de cada verificación. */
export const pausaResaltado = headless ? 0 : Math.round(slowMo * 0.8)
