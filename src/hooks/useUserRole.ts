'use client'

import { useRolActual } from '@/hooks/useRolActual'

// Rol efectivo del usuario en su negocio.
// · esOwner: es el dueño de su propia cuenta (creador del negocio).
// · rol.nombre: nombre del rol asignado si es miembro de otro negocio.
export function useUserRole() {
  const { esOwner, esSuperAdmin, rol, loading, refrescar } = useRolActual()

  return {
    role: esOwner ? 'owner' : (rol?.nombre ?? 'miembro'),
    roleNombre: esOwner ? 'owner' : (rol?.nombre ?? 'miembro'),
    esOwner,
    esSuperAdmin,
    loading,
    refrescar,
  }
}
