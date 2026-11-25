"use client";
import { useEffect, useState } from "react";
import {
  FUNCIONES_PLAN,
  LIMITES_PLAN,
  permiteFuncion,
  type ConfigPlan,
  type FuncionPlan,
  type LimitePlan,
} from "@/lib/planCatalogo";
import { api } from "@/lib/clienteApi";
import { usePlan } from "@/context/PlanesContext";
const nombre = (p: string) => (p === "basic" ? "Básico" : "Plus");
export default function AdminPlanes() {
  const [base, setBase] = useState<ConfigPlan[]>([]),
    [borrador, setBorrador] = useState<ConfigPlan[]>([]),
    [busqueda, setBusqueda] = useState(""),
    [error, setError] = useState(""),
    [mensaje, setMensaje] = useState(""),
    [revisar, setRevisar] = useState(false),
    [ocupado, setOcupado] = useState(true);
  const { recargar } = usePlan();
  async function cargar() {
    setOcupado(true);
    setError("");
    try {
      const d = await api<{ planes: ConfigPlan[] }>("/api/admin/planes");
      setBase(d.planes);
      setBorrador(structuredClone(d.planes));
      setRevisar(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  useEffect(() => {
    let vigente = true;
    void api<{ planes: ConfigPlan[] }>("/api/admin/planes")
      .then((d) => {
        if (!vigente) return;
        setBase(d.planes);
        setBorrador(structuredClone(d.planes));
      })
      .catch((e) => {
        if (vigente) setError((e as Error).message);
      })
      .finally(() => {
        if (vigente) setOcupado(false);
      });
    return () => {
      vigente = false;
    };
  }, []);
  useEffect(() => {
    if (revisar)
      document
        .getElementById("planes-revision")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [revisar]);
  function marcar(plan: string, keys: FuncionPlan[], valor: boolean) {
    setMensaje("");
    setRevisar(false);
    setBorrador((prev) =>
      prev.map((p) =>
        p.plan === plan
          ? {
              ...p,
              permisos: {
                ...p.permisos,
                ...Object.fromEntries(keys.map((k) => [k, valor])),
              },
            }
          : p,
      ),
    );
  }
  function limite(plan: string, key: LimitePlan, valor: number | null) {
    setMensaje("");
    setRevisar(false);
    setBorrador((prev) =>
      prev.map((p) => (p.plan === plan ? { ...p, [key]: valor } : p)),
    );
  }
  const cambios = borrador.flatMap((p) => {
    const antes = base.find((b) => b.plan === p.plan)!;
    return [
      ...FUNCIONES_PLAN.filter(
        (f) => p.permisos[f.key] !== antes.permisos[f.key],
      ).map(
        (f) =>
          `${nombre(p.plan)} · ${f.label}: ${p.permisos[f.key] ? "activar" : "desactivar"}`,
      ),
      ...LIMITES_PLAN.filter((l) => p[l.key] !== antes[l.key]).map(
        (l) =>
          `${nombre(p.plan)} · ${l.label}: ${antes[l.key] ?? "sin límite"} → ${p[l.key] ?? "sin límite"}`,
      ),
    ];
  });
  async function publicar() {
    setOcupado(true);
    setError("");
    try {
      const d = await api<{ planes: ConfigPlan[] }>("/api/admin/planes", {
        method: "PUT",
        json: Object.fromEntries(borrador.map((p) => [p.plan, p])),
      });
      setBase(d.planes);
      setBorrador(structuredClone(d.planes));
      setRevisar(false);
      setMensaje(
        "Planes publicados. El cambio aplica a todos los negocios de cada plan.",
      );
      await recargar();
      window.dispatchEvent(new Event("planes-actualizados"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  const grupos = [...new Set(FUNCIONES_PLAN.map((f) => f.grupo))];
  return (
    <div className="space-y-5" data-testid="admin-planes-editor">
      <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="text-xl font-bold text-slate-900">
          Funciones y límites de cada plan
        </h2>
        <p className="text-sm text-slate-600">
          Configura el acceso de los clientes actuales y futuros. Desactivar una
          función conserva sus datos. Los permisos del equipo también se
          respetan.
        </p>
        <p className="text-xs text-slate-500">
          Precios, cobros y vigencias se administran por separado. La
          publicación se registra en Auditoría. Los servidores actualizan sus
          permisos en un máximo de 30 segundos; recarga una sesión abierta para
          actualizar sus botones.
        </p>
        <div className="flex flex-wrap gap-3">
          {borrador.map((p) => (
            <span
              key={p.plan}
              className="rounded-xl bg-sky-50 px-4 py-2 text-sm text-sky-800"
            >
              <strong>{nombre(p.plan)}</strong> ·{" "}
              {
                FUNCIONES_PLAN.filter((f) => permiteFuncion(p.permisos, f.key))
                  .length
              }
              /{FUNCIONES_PLAN.length} funciones · revisión {p.revision}
            </span>
          ))}
        </div>
        <input
          aria-label="Buscar función"
          placeholder="Buscar sección o función…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3"
        />
      </div>
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 text-red-700 p-4">
          {error}{" "}
          <button onClick={cargar} className="underline">
            Recargar planes
          </button>
          <p className="text-xs mt-1">
            El borrador sigue disponible. Recargar descarta los cambios locales.
          </p>
        </div>
      )}
      {mensaje && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 text-emerald-800 p-4"
        >
          {mensaje}
        </p>
      )}
      {!base.length && (
        <button onClick={cargar} disabled={ocupado} className="p-4">
          {ocupado ? "Cargando planes…" : "Volver a cargar"}
        </button>
      )}
      {grupos.map((grupo) => {
        const funciones = FUNCIONES_PLAN.filter(
          (f) =>
            f.grupo === grupo &&
            (f.label + " " + f.grupo)
              .toLocaleLowerCase()
              .includes(busqueda.toLocaleLowerCase()),
        );
        if (!funciones.length) return null;
        return (
          <details
            key={grupo}
            open={grupo === "Secciones" || !!busqueda || undefined}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <summary className="cursor-pointer bg-slate-50 border-b border-slate-100 p-4 font-bold text-slate-800">
              {grupo}{" "}
              <span className="text-xs font-normal text-slate-500">
                · {funciones.length} opciones
              </span>
            </summary>
            <div className="grid md:grid-cols-2 gap-5 p-4">
              {borrador.map((p) => (
                <div key={p.plan} className="space-y-2">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold">{nombre(p.plan)}</h3>
                    <div className="text-xs flex gap-3">
                      <button
                        disabled={ocupado}
                        onClick={() =>
                          marcar(
                            p.plan,
                            funciones.map((f) => f.key),
                            true,
                          )
                        }
                        className="text-sky-700"
                      >
                        Activar grupo
                      </button>
                      <button
                        disabled={ocupado}
                        onClick={() =>
                          marcar(
                            p.plan,
                            funciones.map((f) => f.key),
                            false,
                          )
                        }
                        className="text-slate-500"
                      >
                        Desactivar grupo
                      </button>
                    </div>
                  </div>
                  {funciones.map((f) => {
                    const dependencia = f.depende.find(
                      (k) => !permiteFuncion(p.permisos, k),
                    );
                    return (
                      <label
                        key={f.key}
                        className="flex gap-3 items-start rounded-xl border border-slate-100 p-3 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          disabled={ocupado}
                          aria-label={`${nombre(p.plan)}: ${f.label}`}
                          checked={p.permisos[f.key]}
                          onChange={(e) =>
                            marcar(p.plan, [f.key], e.target.checked)
                          }
                          className="mt-1 size-4 accent-sky-600"
                        />
                        <span className="text-sm">
                          <span className="font-medium">{f.label}</span>
                          {dependencia && (
                            <span className="block text-xs text-amber-700">
                              Requiere activar{" "}
                              {
                                FUNCIONES_PLAN.find(
                                  (x) => x.key === dependencia,
                                )?.label
                              }
                              . Se conservará esta selección.
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </details>
        );
      })}
      {!!base.length && (
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold mb-2">Límites de uso</h2>
          <p className="text-sm text-slate-500 mb-5">
            Sin límite permite uso ilimitado. Cero impide nuevas operaciones.
            Reducir un límite conserva lo existente; no elimina registros. Para
            usar equipo, activa la sección y permite miembros.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {borrador.map((p) => (
              <div key={p.plan} className="space-y-4">
                <h3 className="font-bold">{nombre(p.plan)}</h3>
                {LIMITES_PLAN.map((l) => (
                  <div
                    key={l.key}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <label htmlFor={`${p.plan}-${l.key}`}>{l.label}</label>
                    <div className="flex items-center gap-3">
                      <input
                        id={`${p.plan}-${l.key}`}
                        aria-label={`${nombre(p.plan)}: ${l.label}`}
                        type="number"
                        min="0"
                        max="2147483647"
                        step="1"
                        disabled={ocupado || p[l.key] === null}
                        value={p[l.key] ?? ""}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isInteger(n) && n >= 0)
                            limite(p.plan, l.key, n);
                        }}
                        className="w-24 border rounded-lg p-2 disabled:bg-slate-50"
                      />
                      <label className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          disabled={ocupado}
                          checked={p[l.key] === null}
                          onChange={(e) =>
                            limite(p.plan, l.key, e.target.checked ? null : 0)
                          }
                        />
                        Sin límite
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
      {revisar && (
        <section
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
          id="planes-revision"
          aria-label="Revisar publicación"
        >
          <h2 className="font-bold">
            Revisa {cambios.length} cambios antes de publicar
          </h2>
          <p className="text-sm my-2">
            Afectan a todos los negocios de estos planes, incluidas las pruebas
            de Plus. Comprueba especialmente las secciones que desactivas.
          </p>
          <ul className="text-sm list-disc pl-5 space-y-1 max-h-72 overflow-auto">
            {cambios.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button
            disabled={ocupado}
            onClick={publicar}
            className="mt-4 rounded-xl bg-sky-600 text-white px-5 py-3 font-bold disabled:opacity-50"
          >
            {ocupado ? "Publicando…" : "Publicar cambios para todos"}
          </button>
        </section>
      )}
      {!!base.length && (
        <div className="sticky bottom-3 flex flex-wrap justify-between gap-3 rounded-2xl bg-white border border-slate-200 shadow-lg p-4">
          <span className="self-center text-sm text-slate-600">
            {cambios.length
              ? `${cambios.length} cambios sin publicar`
              : "Sin cambios pendientes"}
          </span>
          <div className="flex gap-3">
            <button
              disabled={ocupado || !cambios.length}
              onClick={() => {
                setBorrador(structuredClone(base));
                setRevisar(false);
                setError("");
              }}
              className="px-4 py-2 rounded-xl border disabled:opacity-50"
            >
              Descartar borrador
            </button>
            <button
              disabled={ocupado || !cambios.length}
              onClick={() => setRevisar(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold disabled:opacity-50"
            >
              Revisar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
