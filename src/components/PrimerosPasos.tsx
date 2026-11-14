"use client";
import { useState } from "react";
import { ChevronDown, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import {
  claveInicio,
  pasosIniciales,
  validarPasoInicial,
} from "@/lib/onboarding";
import type { ConfigState } from "@/types/config";

type Props = {
  userId: string;
  config: ConfigState;
  slug: string;
  plan: string;
  puedeConfigurar: boolean;
  visibles: readonly string[];
  onConfigurar: () => void;
  onEnvios: () => void;
};
export default function PrimerosPasos({
  userId,
  config,
  slug,
  plan,
  puedeConfigurar,
  visibles,
  onConfigurar,
  onEnvios,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [probado, setProbado] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(`${claveInicio(userId)}_probado`) === "true",
  );
  const configurado = pasosIniciales(config).every(
    (p) => !validarPasoInicial(p, config),
  );
  function alternar() {
    const next = !abierto;
    setAbierto(next);
    const url = new URL(window.location.href);
    url.searchParams.delete("tour");
    window.history.replaceState({}, "", url.pathname + url.search);
  }
  const icono = (listo: boolean) =>
    listo ? (
      <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
    ) : (
      <Circle size={18} className="shrink-0 text-slate-300" />
    );
  return (
    <section
      className="mb-5 rounded-2xl border border-sky-100 bg-white"
      aria-label="Primeros pasos y guías"
    >
      <button
        onClick={alternar}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-slate-700"
      >
        <span>Primeros pasos y guías</span>
        <ChevronDown size={17} className={abierto ? "rotate-180" : ""} />
      </button>
      {abierto && (
        <div className="space-y-4 border-t border-sky-50 p-4 sm:p-5">
          <p className="text-sm text-slate-500">
            Empieza por tu formulario y Envíos. Las guías se abren cuando las
            necesitas; puedes pausarlas y volver a cualquier capítulo.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {puedeConfigurar && (
              <article className="rounded-xl bg-slate-50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  {icono(configurado)}1. Revisa tu configuración
                </h3>
                <p className="my-3 text-xs leading-relaxed text-slate-500">
                  Métodos, días de atención, cobertura y tarifas reales.{" "}
                  {configurado
                    ? "Datos básicos completos."
                    : "Quedan datos por completar."}
                </p>
                <div className="flex flex-wrap gap-3 text-xs font-bold text-sky-700">
                  <button onClick={onConfigurar}>Abrir Configuración</button>
                  {!configurado && (
                    <a href="/onboarding">Continuar asistente</a>
                  )}
                  <a
                    href="/recursos/configuracion/index.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver guía
                  </a>
                </div>
              </article>
            )}
            <article className="rounded-xl bg-slate-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                {icono(probado)}
                {puedeConfigurar ? "2." : "1."} Prueba como cliente
              </h3>
              <p className="my-3 text-xs leading-relaxed text-slate-500">
                Abre el enlace, revisa métodos, fechas y costos antes de
                compartirlo. Una solicitud de prueba también llegará al panel si
                la envías.
              </p>
              {slug && (
                <a
                  href={`/f/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700"
                >
                  Abrir mi formulario
                  <ExternalLink size={12} />
                </a>
              )}
              <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={probado}
                  onChange={(e) => {
                    setProbado(e.target.checked);
                    localStorage.setItem(
                      `${claveInicio(userId)}_probado`,
                      String(e.target.checked),
                    );
                  }}
                />
                Ya revisé el formulario
              </label>
            </article>
            {visibles.includes("envios") && (
              <article className="rounded-xl bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-800">
                  {puedeConfigurar ? "3." : "2."} Gestiona las solicitudes
                </h3>
                <p className="my-3 text-xs leading-relaxed text-slate-500">
                  Revisa destinatario, destino y fecha. Aprende qué cambian los
                  estados y cómo preparar cada pedido.
                </p>
                <div className="flex flex-wrap gap-3 text-xs font-bold text-sky-700">
                  <button onClick={onEnvios}>Ir a Envíos</button>
                  <a
                    href="/recursos/envios/index.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver guía completa
                  </a>
                </div>
              </article>
            )}
          </div>
          {plan !== "basic" &&
            ["productos", "compras", "ventas"].some((v) =>
              visibles.includes(v),
            ) && (
              <div className="rounded-xl border border-slate-100 p-3 text-xs leading-relaxed text-slate-600">
                <strong>Si también llevas inventario:</strong> crea el catálogo
                en Productos, registra entradas en Compras y salidas y cobros en
                Ventas. Serie con variantes incluye SKU automático, precio y
                costo generales con excepciones.
                <div className="mt-2 flex flex-wrap gap-4 font-bold text-sky-700">
                  {[
                    ["productos", "Guía de Productos"],
                    ["compras", "Guía de Compras"],
                    ["ventas", "Guía de Ventas"],
                  ]
                    .filter(([v]) => visibles.includes(v))
                    .map(([v, label]) => (
                      <a
                        key={v}
                        href={`/recursos/${v}/index.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {label}
                      </a>
                    ))}
                  {visibles.includes("productos") && (
                    <a
                      href="/recursos/serie-variantes/index.html"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Serie con variantes
                    </a>
                  )}
                </div>
              </div>
            )}
          {plan === "basic" && (
            <p className="text-xs text-slate-500">
              Básico recibe solicitudes ilimitadas y permite la gestión
              individual. Inventario, ventas, compras y herramientas avanzadas
              requieren Plus.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <a
              href="/recursos/guias/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sky-700"
            >
              Todas las guías
            </a>
            <button onClick={alternar} className="font-semibold text-slate-500">
              Minimizar primeros pasos
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
