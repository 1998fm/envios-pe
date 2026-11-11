/** La identidad no depende del nombre ni de los espacios al copiar desde WhatsApp. */
export function normalizarIdentificador(valor: unknown): string {
  return String(valor ?? '').replace(/\s+/g, '').toUpperCase()
}

/** Candidatos SQL incluyendo formatos antiguos; siempre confirmar igualdad normalizada. */
export function patronIdentificador(valor: unknown): string {
  const seguro = normalizarIdentificador(valor).replace(/[^A-Z0-9+]/g, '')
  return seguro ? `%${[...seguro].join('%')}%` : '__sin_identificador__'
}
