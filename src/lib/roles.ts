// ============================================================
// ROLES Y PERMISOS POR NEGOCIO
// Modelo: el dueño de la cuenta (profiles.id) es el "owner" de su
// negocio. Puede crear roles, definirlos y asignarlos a usuarios
// miembros del mismo negocio (business_members).
// ============================================================

export type VistaDashboard =
  | 'resumen'
  | 'envios'
  | 'productos'
  | 'ventas'
  | 'compras'
  | 'gastos'
  | 'clientes'
  | 'formulario'

export type PermisosRol = {
  ver_resumen: boolean
  ver_envios: boolean
  ver_productos: boolean
  ver_ventas: boolean
  ver_compras: boolean
  ver_gastos: boolean
  ver_clientes: boolean
  ver_formulario: boolean
  ver_kpis_venta: boolean
  ver_ganancia_venta: boolean
  ver_ganancia_producto: boolean
}

export type PermisoKey = keyof PermisosRol

export const VISTAS_DASHBOARD: { value: VistaDashboard; label: string }[] = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'envios', label: 'Envíos' },
  { value: 'productos', label: 'Productos' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'compras', label: 'Compras' },
  { value: 'gastos', label: 'Gastos' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'formulario', label: 'Formulario' },
]

// Permiso que controla la visibilidad de cada pestaña del dashboard.
export const PERMISOS_VISTA: { key: PermisoKey; label: string; hint: string }[] = [
  { key: 'ver_resumen', label: 'Resumen', hint: 'Panel resumen con los números del negocio' },
  { key: 'ver_envios', label: 'Envíos', hint: 'Listado y gestión de envíos' },
  { key: 'ver_productos', label: 'Productos', hint: 'Catálogo de productos y stock' },
  { key: 'ver_ventas', label: 'Ventas', hint: 'Listado de ventas' },
  { key: 'ver_compras', label: 'Compras', hint: 'Compras a proveedores' },
  { key: 'ver_gastos', label: 'Gastos', hint: 'Registro de gastos' },
  { key: 'ver_clientes', label: 'Clientes', hint: 'Listado de clientes' },
  { key: 'ver_formulario', label: 'Formulario', hint: 'Enlace público de pedidos' },
]

// Permisos de dinero: controlan las cifras de dinero del negocio.
export const PERMISOS_GANANCIA: { key: PermisoKey; label: string; hint: string }[] = [
  {
    key: 'ver_kpis_venta',
    label: 'KPIs de ventas',
    hint: 'Ver los totales: vendido, por cobrar y ticket promedio',
  },
  {
    key: 'ver_ganancia_venta',
    label: 'Ganancias por venta',
    hint: 'Ver la ganancia (total - costo) en cada venta',
  },
  {
    key: 'ver_ganancia_producto',
    label: 'Ganancias por producto',
    hint: 'Ver margen y ganancia por producto del catálogo',
  },
]

export const PERMISOS_TODOS: PermisosRol = {
  ver_resumen: true,
  ver_envios: true,
  ver_productos: true,
  ver_ventas: true,
  ver_compras: true,
  ver_gastos: true,
  ver_clientes: true,
  ver_formulario: true,
  ver_kpis_venta: true,
  ver_ganancia_venta: true,
  ver_ganancia_producto: true,
}

export const PERMISOS_NINGUNO: PermisosRol = {
  ver_resumen: false,
  ver_envios: false,
  ver_productos: false,
  ver_ventas: false,
  ver_compras: false,
  ver_gastos: false,
  ver_clientes: false,
  ver_formulario: false,
  ver_kpis_venta: false,
  ver_ganancia_venta: false,
  ver_ganancia_producto: false,
}

// Permiso asociado a cada pestaña.
export const PERMISOS_POR_VISTA: Record<VistaDashboard, PermisoKey> = {
  resumen: 'ver_resumen',
  envios: 'ver_envios',
  productos: 'ver_productos',
  ventas: 'ver_ventas',
  compras: 'ver_compras',
  gastos: 'ver_gastos',
  clientes: 'ver_clientes',
  formulario: 'ver_formulario',
}

// Presets que el dueño puede aplicar con un clic.
export const PRESET_ROLES: {
  nombre: string
  vista_default: VistaDashboard
  permisos: PermisosRol
}[] = [
  {
    nombre: 'Vendedor',
    vista_default: 'envios',
    permisos: {
      ...PERMISOS_NINGUNO,
      ver_envios: true,
      ver_ventas: true,
      ver_clientes: true,
    },
  },
  {
    nombre: 'Encargado',
    vista_default: 'resumen',
    permisos: {
      ...PERMISOS_TODOS,
      ver_ganancia_venta: true,
      ver_ganancia_producto: true,
    },
  },
  {
    nombre: 'Solo lectura',
    vista_default: 'resumen',
    permisos: {
      ...PERMISOS_TODOS,
      ver_ganancia_venta: false,
      ver_ganancia_producto: false,
    },
  },
]

// Convierte lo que venga de la base (jsonb) en un objeto de permisos válido.
// Un permiso ausente se interpreta como "no permitido" (fail closed).
export function normalizarPermisos(raw: unknown): PermisosRol {
  const base = { ...PERMISOS_NINGUNO }
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const key of Object.keys(base) as PermisoKey[]) {
    base[key] = obj[key] === true
  }
  return base
}

export function puedeVerVista(permisos: PermisosRol, vista: VistaDashboard): boolean {
  return permisos[PERMISOS_POR_VISTA[vista]] === true
}

export function esVistaValida(v: string): v is VistaDashboard {
  return VISTAS_DASHBOARD.some((x) => x.value === v)
}

// Detecta el error de PostgREST cuando una tabla todavía no existe
// (por ejemplo, si falta ejecutar supabase/roles-negocio.sql).
export function esTablaFaltante(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const code = error.code || ''
  const msg = error.message || ''
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    /could not find the table|does not exist/i.test(msg)
  )
}

export type RolConfig = {
  id: string
  nombre: string
  vista_default: VistaDashboard
  permisos: PermisosRol
}

export type ResolucionNegocio = {
  /** id del dueño del negocio (a quién pertenece la data) */
  ownerId: string
  /** id del usuario autenticado */
  userId: string
  /** true si el usuario es el dueño de su propio negocio */
  esOwner: boolean
  /** true si es super admin de la plataforma */
  esSuperAdmin: boolean
  /** rol asignado al usuario (null si es el dueño) */
  rol: RolConfig | null
  /** true si las tablas de roles todavía no existen en la base */
  sinTablasRoles: boolean
}
