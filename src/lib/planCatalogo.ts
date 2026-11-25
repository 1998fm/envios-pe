// Catálogo único de funciones comerciales. Los permisos del rol se aplican además.
export type PlanComercial = "basic" | "business_plus";
export const FUNCIONES_PLAN = [
  {
    key: "envios",
    label: "Envíos",
    grupo: "Secciones",
    basic: true,
    depende: [],
  },
  {
    key: "formulario",
    label: "Formulario de clientes",
    grupo: "Secciones",
    basic: true,
    depende: [],
  },
  {
    key: "productos",
    label: "Productos",
    grupo: "Secciones",
    basic: false,
    depende: [],
  },
  {
    key: "ventas",
    label: "Ventas",
    grupo: "Secciones",
    basic: false,
    depende: [],
  },
  {
    key: "compras",
    label: "Compras",
    grupo: "Secciones",
    basic: false,
    depende: [],
  },
  {
    key: "gastos",
    label: "Gastos",
    grupo: "Secciones",
    basic: false,
    depende: [],
  },
  {
    key: "clientes",
    label: "Clientes",
    grupo: "Secciones",
    basic: false,
    depende: [],
  },
  {
    key: "resumen",
    label: "Resumen y reportes",
    grupo: "Secciones",
    basic: false,
    depende: [],
  },
  {
    key: "configuracion",
    label: "Configuración del negocio",
    grupo: "Secciones",
    basic: true,
    depende: [],
  },
  {
    key: "roles",
    label: "Equipo, roles e invitaciones",
    grupo: "Secciones",
    basic: false,
    depende: [],
  },
  {
    key: "envios_detalle",
    label: "Abrir detalle del pedido",
    grupo: "Envíos",
    basic: true,
    depende: ["envios"],
  },
  {
    key: "envios_estado",
    label: "Cambiar estado individual",
    grupo: "Envíos",
    basic: true,
    depende: ["envios"],
  },
  {
    key: "envios_tamano",
    label: "Cambiar tamaño del paquete",
    grupo: "Envíos",
    basic: true,
    depende: ["envios"],
  },
  {
    key: "envios_reprogramar",
    label: "Reprogramar la fecha",
    grupo: "Envíos",
    basic: true,
    depende: ["envios"],
  },
  {
    key: "envios_observaciones",
    label: "Añadir observaciones",
    grupo: "Envíos",
    basic: true,
    depende: ["envios"],
  },
  {
    key: "envios_eliminar",
    label: "Eliminar pedidos",
    grupo: "Envíos",
    basic: true,
    depende: ["envios"],
  },
  {
    key: "envios_validar",
    label: "Vincular y validar compras del cliente",
    grupo: "Envíos",
    basic: false,
    depende: ["envios"],
  },
  {
    key: "copiar",
    label: "Copiar datos de pedidos",
    grupo: "Envíos",
    basic: false,
    depende: ["envios"],
  },
  {
    key: "etiquetas",
    label: "Generar etiquetas de envío",
    grupo: "Envíos",
    basic: false,
    depende: ["envios"],
  },
  {
    key: "shalom",
    label: "Exportar y preparar Shalom Pro",
    grupo: "Envíos",
    basic: false,
    depende: ["envios"],
  },
  {
    key: "cambio_masivo",
    label: "Cambiar estados masivamente",
    grupo: "Envíos",
    basic: false,
    depende: ["envios"],
  },
  {
    key: "exportar",
    label: "Exportar Excel de motorizado",
    grupo: "Envíos",
    basic: false,
    depende: ["envios"],
  },
  {
    key: "productos_crear",
    label: "Crear productos",
    grupo: "Productos",
    basic: true,
    depende: ["productos"],
  },
  {
    key: "productos_editar",
    label: "Editar productos y precios",
    grupo: "Productos",
    basic: true,
    depende: ["productos"],
  },
  {
    key: "productos_archivar",
    label: "Archivar y restaurar productos",
    grupo: "Productos",
    basic: true,
    depende: ["productos"],
  },
  {
    key: "productos_eliminar",
    label: "Eliminar productos",
    grupo: "Productos",
    basic: true,
    depende: ["productos"],
  },
  {
    key: "productos_variantes",
    label: "Series, variantes y agrupación",
    grupo: "Productos",
    basic: true,
    depende: ["productos"],
  },
  {
    key: "productos_kardex",
    label: "Consultar movimientos de inventario",
    grupo: "Productos",
    basic: true,
    depende: ["productos"],
  },
  {
    key: "productos_fotos",
    label: "Subir y eliminar fotos",
    grupo: "Productos",
    basic: true,
    depende: ["productos"],
  },
  {
    key: "ventas_crear",
    label: "Registrar ventas",
    grupo: "Ventas",
    basic: true,
    depende: ["ventas"],
  },
  {
    key: "ventas_editar",
    label: "Editar ventas",
    grupo: "Ventas",
    basic: true,
    depende: ["ventas"],
  },
  {
    key: "ventas_anular",
    label: "Anular o eliminar ventas",
    grupo: "Ventas",
    basic: true,
    depende: ["ventas"],
  },
  {
    key: "ventas_cobros",
    label: "Registrar y modificar abonos",
    grupo: "Ventas",
    basic: true,
    depende: ["ventas"],
  },
  {
    key: "compras_crear",
    label: "Registrar compras",
    grupo: "Compras",
    basic: true,
    depende: ["compras"],
  },
  {
    key: "compras_anular",
    label: "Anular o eliminar compras",
    grupo: "Compras",
    basic: true,
    depende: ["compras"],
  },
  {
    key: "gastos_crear",
    label: "Registrar gastos",
    grupo: "Gastos",
    basic: true,
    depende: ["gastos"],
  },
  {
    key: "gastos_editar",
    label: "Editar gastos",
    grupo: "Gastos",
    basic: true,
    depende: ["gastos"],
  },
  {
    key: "gastos_eliminar",
    label: "Eliminar gastos",
    grupo: "Gastos",
    basic: true,
    depende: ["gastos"],
  },
  {
    key: "clientes_editar",
    label: "Corregir datos y vincular ventas",
    grupo: "Clientes",
    basic: true,
    depende: ["clientes"],
  },
  {
    key: "clientes_eliminar",
    label: "Eliminar clientes",
    grupo: "Clientes",
    basic: true,
    depende: ["clientes"],
  },
  {
    key: "etiquetas_producto",
    label: "Etiquetas de productos y SKU",
    grupo: "Productos",
    basic: false,
    depende: ["productos"],
  },
  {
    key: "lector_qr",
    label: "Escanear QR/SKU al vender",
    grupo: "Ventas",
    basic: false,
    depende: ["ventas"],
  },
  {
    key: "ganancia",
    label: "Ver costos y ganancias de productos y ventas",
    grupo: "Reportes",
    basic: false,
    depende: [],
  },
  {
    key: "empresa",
    label: "Datos de empresa y agencia de origen",
    grupo: "Configuración y formulario",
    basic: true,
    depende: ["configuracion"],
  },
  {
    key: "metodos",
    label: "Elegir métodos de entrega",
    grupo: "Configuración y formulario",
    basic: true,
    depende: ["configuracion"],
  },
  {
    key: "logo",
    label: "Logo personalizado",
    grupo: "Configuración y formulario",
    basic: false,
    depende: ["configuracion"],
  },
  {
    key: "redes",
    label: "Redes sociales",
    grupo: "Configuración y formulario",
    basic: false,
    depende: ["configuracion"],
  },
  {
    key: "redirect",
    label: "Redirección y mensaje de confirmación",
    grupo: "Configuración y formulario",
    basic: false,
    depende: ["configuracion"],
  },
  {
    key: "colores",
    label: "Colores del formulario",
    grupo: "Configuración y formulario",
    basic: true,
    depende: ["configuracion"],
  },
  {
    key: "tracking",
    label: "Seguimiento de pedidos para el cliente",
    grupo: "Configuración y formulario",
    basic: true,
    depende: ["formulario"],
  },
  {
    key: "cantidad",
    label: "Solicitar cantidad de productos",
    grupo: "Configuración y formulario",
    basic: true,
    depende: ["formulario"],
  },
  {
    key: "cierre",
    label: "Cerrar formulario y días sin atención",
    grupo: "Configuración y formulario",
    basic: true,
    depende: ["formulario"],
  },
  {
    key: "marca_blanca",
    label: "Ocultar la marca Tori",
    grupo: "Configuración y formulario",
    basic: false,
    depende: ["formulario"],
  },
  {
    key: "escoger_fecha",
    label: "Permitir elegir fecha de entrega",
    grupo: "Configuración y formulario",
    basic: false,
    depende: ["formulario"],
  },
  {
    key: "tarifas",
    label: "Cobertura y tarifas por distrito",
    grupo: "Configuración y formulario",
    basic: false,
    depende: ["configuracion"],
  },
  {
    key: "logistica_anticipacion",
    label: "Anticipación y días hábiles",
    grupo: "Logística",
    basic: false,
    depende: ["configuracion"],
  },
  {
    key: "logistica_corte",
    label: "Hora de corte",
    grupo: "Logística",
    basic: false,
    depende: ["configuracion"],
  },
  {
    key: "logistica_cupo",
    label: "Cupo diario de entregas",
    grupo: "Logística",
    basic: false,
    depende: ["configuracion"],
  },
  {
    key: "roles_crear",
    label: "Crear y editar roles",
    grupo: "Equipo",
    basic: true,
    depende: ["roles"],
  },
  {
    key: "roles_miembros",
    label: "Agregar y retirar miembros",
    grupo: "Equipo",
    basic: true,
    depende: ["roles"],
  },
  {
    key: "roles_invitaciones",
    label: "Crear y cancelar invitaciones",
    grupo: "Equipo",
    basic: true,
    depende: ["roles"],
  },
] as const;
export type FuncionPlan = (typeof FUNCIONES_PLAN)[number]["key"];
export type PermisosPlan = Record<FuncionPlan, boolean>;
export const LIMITES_PLAN = [
  { key: "max_envios", label: "Solicitudes al mes" },
  { key: "max_metodos", label: "Métodos de entrega" },
  { key: "max_productos", label: "Productos activos" },
  { key: "max_ventas", label: "Ventas registradas (total)" },
  { key: "max_exportaciones_shalom", label: "Exportaciones Shalom al mes" },
  { key: "max_pedidos_copiar", label: "Pedidos por copia" },
  { key: "max_miembros", label: "Miembros del equipo" },
] as const;
export type LimitePlan = (typeof LIMITES_PLAN)[number]["key"];
export type ConfigPlan = {
  plan: PlanComercial;
  revision: number;
  permisos: PermisosPlan;
} & Record<LimitePlan, number | null>;
export const LIMITES_INICIALES = {
  basic: {
    max_envios: null,
    max_metodos: 2,
    max_productos: null,
    max_ventas: null,
    max_exportaciones_shalom: null,
    max_pedidos_copiar: null,
    max_miembros: 0,
  },
  business_plus: {
    max_envios: null,
    max_metodos: null,
    max_productos: null,
    max_ventas: null,
    max_exportaciones_shalom: null,
    max_pedidos_copiar: null,
    max_miembros: 4,
  },
} as const;
export function planNormalizado(plan?: string | null): PlanComercial {
  return plan === "business_plus" || plan === "pro" ? "business_plus" : "basic";
}
export function permisosIniciales(plan?: string | null): PermisosPlan {
  const plus = planNormalizado(plan) === "business_plus";
  return Object.fromEntries(
    FUNCIONES_PLAN.map((f) => [f.key, plus || f.basic]),
  ) as PermisosPlan;
}
export function permiteFuncion(
  permisos: Partial<PermisosPlan>,
  key: string,
  visitados = new Set<string>(),
): boolean {
  const f = FUNCIONES_PLAN.find((f) => f.key === key);
  if (!f || visitados.has(key) || permisos[f.key] !== true) return false;
  const siguientes = new Set(visitados).add(key);
  return f.depende.every((k) => permiteFuncion(permisos, k, siguientes));
}
export function normalizarPermisosPlan(
  plan: string,
  raw: unknown,
): PermisosPlan {
  const defaults = Object.fromEntries(
    FUNCIONES_PLAN.map((f) => [f.key, false]),
  ) as PermisosPlan;
  void plan;
  if (raw && typeof raw === "object")
    for (const f of FUNCIONES_PLAN) {
      const v = (raw as Record<string, unknown>)[f.key];
      if (typeof v === "boolean") defaults[f.key] = v;
    }
  return defaults;
}
export function permisosEfectivos(permisos: PermisosPlan): PermisosPlan {
  return Object.fromEntries(
    FUNCIONES_PLAN.map((f) => [f.key, permiteFuncion(permisos, f.key)]),
  ) as PermisosPlan;
}
