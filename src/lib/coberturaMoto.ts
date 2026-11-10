import { normalizarDistrito } from './normalizarDistrito'

// -1 reserva un distrito fuera de cobertura en el JSON de tarifas existente.
// Se conserva al guardar, pero nunca se usa como precio ni se ofrece al cliente.
export const DISTRITO_SIN_COBERTURA = '-1'

export function distritoExcluido(tarifas: Record<string, unknown>, distrito: string): boolean {
  const objetivo = normalizarDistrito(distrito)
  return Object.entries(tarifas).some(([nombre, precio]) =>
    normalizarDistrito(nombre) === objetivo && String(precio) === DISTRITO_SIN_COBERTURA
  )
}

export function distritosConCobertura(tarifas: Record<string, unknown>, distritos: string[]): string[] {
  return distritos.filter((distrito) => !distritoExcluido(tarifas, distrito))
}
