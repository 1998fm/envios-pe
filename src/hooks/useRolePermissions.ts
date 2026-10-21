'use client'

import { useRolActual } from '@/hooks/useRolActual'
import { PERMISOS_NINGUNO, PERMISOS_TODOS, type PermisosRol, type VistaDashboard } from '@/lib/roles'

// Permisos efectivos del usuario actual.
// El dueño tiene todos los permisos; un miembro usa los de su rol.
export function useRolePermissions() {
  const { esOwner, rol, loading, refrescar } = useRolActual()

  const permisos: PermisosRol = esOwner ? PERMISOS_TODOS : (rol?.permisos ?? PERMISOS_NINGUNO)
  const view: VistaDashboard = esOwner ? 'resumen' : (rol?.vista_default ?? 'resumen')

  return {
    permisos,
    view,
    canSeeGains: permisos.ver_ganancia_venta || permisos.ver_ganancia_producto,
    canSeeGainsVenta: permisos.ver_ganancia_venta,
    canSeeGainsProducto: permisos.ver_ganancia_producto,
    loading,
    refrescar,
  }
}
