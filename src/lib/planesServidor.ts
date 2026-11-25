import "server-only";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { computeEffectivePlan } from "./planGating";
import {
  FUNCIONES_PLAN,
  LIMITES_INICIALES,
  normalizarPermisosPlan,
  permiteFuncion,
  planNormalizado,
  type ConfigPlan,
  type FuncionPlan,
} from "./planCatalogo";
let cache: { hasta: number; planes: ConfigPlan[] } | null = null;
let pendiente: Promise<ConfigPlan[]> | null = null;
let version = 0;
export function invalidarPlanes() {
  version++;
  cache = null;
  pendiente = null;
}
export async function catalogoPlanes(): Promise<ConfigPlan[]> {
  if (cache && cache.hasta > Date.now()) return cache.planes;
  if (pendiente) return pendiente;
  const actual = version;
  const trabajo = (async () => {
    const { data, error } = await supabaseAdmin
      .from("plan_features")
      .select(
        "plan,revision,permisos,max_envios,max_metodos,max_productos,max_ventas,max_exportaciones_shalom,max_pedidos_copiar,max_miembros",
      )
      .in("plan", ["basic", "business_plus"]);
    if (error || data?.length !== 2)
      throw new Error("No se pudo verificar la configuración de planes.");
    const planes = data.map((p) => ({
      ...LIMITES_INICIALES[planNormalizado(p.plan)],
      ...p,
      plan: planNormalizado(p.plan),
      revision: Number(p.revision),
      permisos: normalizarPermisosPlan(p.plan, p.permisos),
    })) as ConfigPlan[];
    if (actual === version) cache = { hasta: Date.now() + 30000, planes };
    return planes;
  })();
  pendiente = trabajo;
  try {
    return await trabajo;
  } finally {
    if (pendiente === trabajo) pendiente = null;
  }
}
export async function planConfigurado(plan: string) {
  return (await catalogoPlanes()).find(
    (p) => p.plan === planNormalizado(plan),
  )!;
}
export async function accesoPlan(owner: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("plan,trial_end,pro_until")
    .eq("id", owner)
    .maybeSingle();
  if (error || !data)
    throw new Error("No se pudo verificar el plan del negocio.");
  return planConfigurado(computeEffectivePlan(data).plan);
}
export function permitePlan(p: ConfigPlan, key: string) {
  return permiteFuncion(p.permisos, key);
}
export const SECCIONES_ROL: Record<string, FuncionPlan> = {
  ver_envios: "envios",
  ver_resumen: "resumen",
  ver_productos: "productos",
  ver_ventas: "ventas",
  ver_compras: "compras",
  ver_gastos: "gastos",
  ver_clientes: "clientes",
  ver_formulario: "formulario",
};
export function mapaPublico(planes: ConfigPlan[]) {
  return planes.map((p) => ({
    ...p,
    permisos: Object.fromEntries(
      FUNCIONES_PLAN.map((f) => [f.key, permitePlan(p, f.key)]),
    ),
  }));
}
