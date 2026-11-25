"use client";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  LIMITES_INICIALES,
  permisosIniciales,
  permiteFuncion,
  planNormalizado,
  type ConfigPlan,
  type FuncionPlan,
} from "@/lib/planCatalogo";
const iniciales: ConfigPlan[] = (["basic", "business_plus"] as const).map(
  (plan) => ({
    plan,
    revision: 0,
    permisos: permisosIniciales(plan),
    ...LIMITES_INICIALES[plan],
  }),
);
const Contexto = createContext({ planes: iniciales, recargar: async () => {} });
const Actual = createContext<string>("basic");
let vigente: Promise<ConfigPlan[]> | null = null;
function consultar() {
  if (!vigente)
    vigente = fetch("/api/planes/catalogo", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw Error("Planes no disponibles");
        return (await r.json()).planes as ConfigPlan[];
      })
      .finally(() => {
        vigente = null;
      });
  return vigente;
}
export function PlanesProvider({ children }: { children: React.ReactNode }) {
  const ruta = usePathname(),
    usar = /^\/(dashboard|admin|onboarding)(\/|$)/.test(ruta);
  const [planes, setPlanes] = useState(iniciales);
  const recargar = useCallback(async () => {
    try {
      setPlanes(await consultar());
    } catch {
      /* El servidor rechaza las acciones si no puede verificar los permisos. */
    }
  }, []);
  useEffect(() => {
    if (!usar) return;
    let activo = true;
    void consultar()
      .then((p) => {
        if (activo) setPlanes(p);
      })
      .catch(() => {});
    const foco = () => {
      if (document.visibilityState === "visible") void recargar();
    };
    window.addEventListener("focus", foco);
    window.addEventListener("planes-actualizados", foco);
    return () => {
      activo = false;
      window.removeEventListener("focus", foco);
      window.removeEventListener("planes-actualizados", foco);
    };
  }, [recargar, usar]);
  return (
    <Contexto.Provider value={{ planes, recargar }}>
      {children}
    </Contexto.Provider>
  );
}
export function PlanActualProvider({
  plan,
  children,
}: {
  plan: string;
  children: React.ReactNode;
}) {
  return <Actual.Provider value={plan}>{children}</Actual.Provider>;
}
export function usePlan(plan?: string) {
  const actual = useContext(Actual),
    contexto = useContext(Contexto);
  const configuracion = contexto.planes.find(
    (p) => p.plan === planNormalizado(plan ?? actual),
  )!;
  return {
    ...contexto,
    configuracion,
    permite: (key: string) =>
      permiteFuncion(configuracion.permisos, key as FuncionPlan),
  };
}
