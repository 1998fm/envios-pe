import { useState, useCallback } from 'react'

export function useSeleccion() {
  const [seleccionados, setSeleccionados] = useState<string[]>([])

  const toggleSeleccion = useCallback((id: string) => {
    setSeleccionados((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id)
      return [...prev, id]
    })
  }, [])

  const toggleSeleccionTodos = useCallback((idsVisibles: string[]) => {
    setSeleccionados((prev) => {
      const todosSeleccionados = idsVisibles.every((id) => prev.includes(id))
      if (todosSeleccionados) {
        return prev.filter((id) => !idsVisibles.includes(id))
      }
      return [...new Set([...prev, ...idsVisibles])]
    })
  }, [])

  const limpiarSeleccion = useCallback(() => setSeleccionados([]), [])

  return { seleccionados, setSeleccionados, toggleSeleccion, toggleSeleccionTodos, limpiarSeleccion }
}
