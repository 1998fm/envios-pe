/**
 * Envuelve un handler de ruta para que, cuando TERMINA (con éxito o con error),
 * se descarten cachés. Se invalida después de escribir, no antes: si fuera antes,
 * una visita que llegue entre la invalidación y la escritura volvería a guardar
 * el dato viejo.
 */
export function conInvalidacion<A extends unknown[], R>(
  handler: (...args: A) => Promise<R>,
  ...limpiar: Array<() => void>
) {
  return async (...args: A): Promise<R> => {
    try {
      return await handler(...args)
    } finally {
      for (const f of limpiar) f()
    }
  }
}
