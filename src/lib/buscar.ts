/**
 * BUSQUEDA INTELIGENTE
 * =========================================================================
 * Un solo motor para todos los buscadores del producto, para que buscar
 * "polo verde" devuelva solo lo que tiene las dos palabras, y no una lista
 * mezclada con todo lo que dice "polo" más todo lo que dice "verde".
 *
 * Las reglas, en orden de importancia:
 *
 * 1. Y (AND) entre palabras, O (OR) entre campos.
 *    "polo verde" tiene que aparecer en el producto, pero no necesariamente
 *    en el mismo campo: puede ser "Polo" en el nombre y "verde" en la
 *    descripción. Todas las palabras deben estar en ALGÚN campo.
 *
 * 2. Dos pasadas, precisa primero.
 *    El motor intenta primero que cada palabra coincida al INICIO de una
 *    palabra del producto ("s" de "buzo brenda azul s", no la "s" de "casaca").
 *    Solo si eso no da ningún resultado, se relaja a coincidencia suelta
 *    dentro del texto. Así "brenda s" trae primero las tallas S de verdad en
 *    vez de un montón de resultados que casualmente tienen una "s" dentro.
 *
 * 3. Sin tildes y sin distinction de mayúsculas.
 *    "poló" encuentra "Polo". "CELULAR" encuentra "celular".
 *
 * 4. Orden por relevancia, no por orden alfabético.
 *    Un producto que se llama justo "Polo verde" va antes que uno que se
 *    llama "Buzo impermeable color verde de la colección polo".
 */

// Quita tildes y baja a minúsculas, para comparar sin sorpresas.
export function normalizar(texto: string | null | undefined): string {
  if (!texto) return ''
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Divide el término en palabras. Descarta palabras sueltas de un solo
 * carácter, salvo que sean letras, porque en español casi siempre son una
 * talla o un color ("S", "M", "L", "T"). Los números sí se conservan
 * ("42" es una talla).
 */
export function palabrasClave(termino: string): string[] {
  const bruto = normalizar(termino)
  if (!bruto) return []
  return bruto.split(' ').filter((p) => (p.length > 1 || /[a-z]/.test(p)))
}

/**
 * ¿La palabra aparece al comienzo de alguna palabra del texto?
 * "s" -> true en "buzo brenda azul s"; false en "casaca".
 * Devuelve la posición donde arranca, o -1.
 */
function inicioDePalabra(texto: string, palabra: string): number {
  let desde = 0
  while (true) {
    const i = texto.indexOf(palabra, desde)
    if (i === -1) return -1
    const antes = i === 0 ? ' ' : texto[i - 1]
    if (antes === ' ') return i
    desde = i + 1
  }
}

/** ¿La palabra aparece en cualquier parte, aunque sea dentro de otra? */
function enMedio(texto: string, palabra: string): boolean {
  return texto.includes(palabra)
}

export type Campos = (string | null | undefined)[]

/**
 * Todas las palabras deben encontrar cabida en algún campo.
 * Devuelve true si ninguna coincide; false si el término no sirve.
 */
export function coincidePorPalabrasEnCampos(campos: Campos, termino: string): boolean {
  const palabras = palabrasClave(termino)
  if (palabras.length === 0) return true
  const textos = campos.map(normalizar).filter(Boolean)
  if (textos.length === 0) return false
  return palabras.every((p) => textos.some((t) => enMedio(t, p)))
}

/**
 * Puntaje de relevancia. Mayor es mejor. Se usa internamente por `buscar`.
 * La idea es que las coincidencias "de verdad" valgan mucho más que las
 * coincidencias sueltas que solo se aceptan como último recurso.
 */
function puntuar(campos: Campos, palabras: string[], frase: string): number {
  const textos = campos.map(normalizar).filter(Boolean)
  if (textos.length === 0) return 0

  // El campo principal (el primero) pesa más que los secundarios: no es lo
  // mismo que el color esté en el nombre o que solo se mencione en la
  // descripción.
  let puntos = 0

  palabras.forEach((p, i) => {
    textos.forEach((t, campo) => {
      const peso = campo === 0 ? 1 : 0.45
      const pos = inicioDePalabra(t, p)
      if (pos === -1) {
        // Solo aparece dentro de otra palabra: vale poco.
        puntos += 1 * peso
        return
      }
      // A mayor posición, menor peso: "polo" al principio de "polo verde" pesa
      // más que la "polo" del medio de "buzo verde polo".
      const cercania = Math.max(0, 1 - pos / Math.max(1, t.length))
      puntos += (6 + 8 * cercania) * peso
    })
  })

  // Si el término completo aparece tal cual y seguido, es la coincidencia más
  // clara que existe.
  if (frase && textos.some((t) => t.includes(frase))) puntos += 25

  return puntos
}

/** Ordena por relevancia y, a igualdad de puntos, por el nombre. */
function comparar(a: { p: number; orden: string }, b: { p: number; orden: string }): number {
  if (b.p !== a.p) return b.p - a.p
  return a.orden.localeCompare(b.orden, 'es')
}

/**
 * Filtra y ordena una lista en memoria.
 *
 * @param items    lista a filtrar
 * @param termino  lo que escribió el usuario
 * @param camposDe función que devuelve los campos buscables de cada item,
 *                 en orden de importancia (el primero es el principal)
 */
export function buscar<T>(
  items: T[],
  termino: string,
  camposDe: (item: T) => Campos,
  ordenDe: (item: T) => string = () => ''
): T[] {
  const palabras = palabrasClave(termino)
  if (palabras.length === 0) return items

  const frase = normalizar(termino)
  const conPuntaje: { item: T; p: number; orden: string }[] = []

  // Pasada 1: cada palabra debe caer al inicio de una palabra del producto.
  for (const item of items) {
    const campos = camposDe(item)
    const textos = campos.map(normalizar).filter(Boolean)
    if (textos.length === 0) continue
    const todasPrecisas = palabras.every((p) => textos.some((t) => inicioDePalabra(t, p) !== -1))
    if (todasPrecisas) conPuntaje.push({ item, p: puntuar(campos, palabras, frase), orden: ordenDe(item) })
  }

  // Pasada 2: si la precisa no dio nada, nos conformamos con coincidencias
  // sueltas antes que devolver una lista vacía.
  if (conPuntaje.length === 0) {
    for (const item of items) {
      const campos = camposDe(item)
      const textos = campos.map(normalizar).filter(Boolean)
      if (textos.length === 0) continue
      const todas = palabras.every((p) => textos.some((t) => enMedio(t, p)))
      if (todas) conPuntaje.push({ item, p: puntuar(campos, palabras, frase), orden: ordenDe(item) })
    }
  }

  return conPuntaje.sort(comparar).map((x) => x.item)
}

/**
 * Coincidencia simple de una sola consulta, para el filtrado en vivo mientras
 * el usuario escribe. Mismo criterio que `buscar`, pero sin ordenar.
 */
export function coincide(item: unknown, campos: Campos, termino: string): boolean {
  const palabras = palabrasClave(termino)
  if (palabras.length === 0) return true
  const textos = campos.map(normalizar).filter(Boolean)
  if (textos.length === 0) return false
  return palabras.every((p) => textos.some((t) => enMedio(t, p)))
}
