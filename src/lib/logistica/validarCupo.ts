export function validarCupo(
  cantidadProgramada: number,
  cupoMaximo: number
): boolean {

  if (cupoMaximo <= 0) {
    return true
  }

  return cantidadProgramada < cupoMaximo

}