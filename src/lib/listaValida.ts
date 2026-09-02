// Valida que el texto coincida EXACTAMENTE (ignorando mayúsculas) con una
// opción de la lista. El cliente debe elegir de la lista, no escribir a mano
// un nombre inventado.
export function existeEnLista(lista: string[], valor: string) {
  return lista.some((it) => it.toLowerCase() === valor.trim().toLowerCase())
}
