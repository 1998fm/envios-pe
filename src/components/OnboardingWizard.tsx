"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink } from "lucide-react";
import { obtenerSesion } from "@/lib/clienteApi";
import { guardarPasoServidor } from "@/lib/configuracionCliente";
import {
  claveInicio,
  clavePaso,
  configInicialDesdeSesion,
  pasosIniciales,
  validarPasoInicial,
} from "@/lib/onboarding";
import { computeEffectivePlan } from "@/lib/planGating";
import { markTrayectoDone } from "@/lib/tours";
import { useAgenciasShalom } from "@/lib/hooks/useAgenciasShalom";
import { initialConfigState, type ConfigState } from "@/types/config";
import LogoTori from "./LogoTori";
import OnboardingStep1Empresa from "./OnboardingStep1Empresa";
import OnboardingStep2Metodos from "./OnboardingStep2Metodos";
import OnboardingStep3Logistica from "./OnboardingStep3Logistica";
import OnboardingStep4Tarifas from "./OnboardingStep4Tarifas";

const titulos: Record<number, string> = {
  1: "Tu negocio",
  2: "Entregas",
  3: "Días y horarios",
  4: "Cobertura y tarifas",
};
export default function OnboardingWizard() {
  const router = useRouter();
  const [config, setConfig] = useState<ConfigState>(initialConfigState);
  const [step, setStep] = useState(1),
    [listo, setListo] = useState(false),
    [cargando, setCargando] = useState(true);
  const [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [cargaError, setCargaError] = useState(""),
    [reintento, setReintento] = useState(0);
  const [userId, setUserId] = useState(""),
    [slug, setSlug] = useState(""),
    [copiado, setCopiado] = useState(false),
    [plan, setPlan] = useState("basic"),
    [dias, setDias] = useState<number | null>(null);
  const bloqueo = useRef(false),
    alerta = useRef<HTMLDivElement>(null);
  const { agencias } = useAgenciasShalom();
  useEffect(() => {
    let vigente = true;
    obtenerSesion()
      .then((s) => {
        if (!vigente) return;
        if (!s) {
          router.replace("/register");
          return;
        }
        if (!s.negocio.esOwner) {
          router.replace("/dashboard");
          return;
        }
        const c = configInicialDesdeSesion(s);
        setConfig(c);
        setUserId(s.user.id);
        setSlug(s.profile?.slug ?? "");
        const efectivo = computeEffectivePlan(s.profile ?? {});
        setPlan(efectivo.plan);
        setDias(efectivo.diasRestantes);
        const guardado = Number(
          sessionStorage.getItem(clavePaso(s.user.id)) ?? 1,
        );
        setStep(pasosIniciales(c).includes(guardado) ? guardado : 1);
        setCargaError("");
        setCargando(false);
      })
      .catch(() => {
        if (vigente) {
          setCargaError(
            "No pudimos cargar tu configuración. Reintenta para continuar con tus datos guardados.",
          );
          setCargando(false);
        }
      });
    return () => {
      vigente = false;
    };
  }, [router, reintento]);
  useEffect(() => {
    if (error) alerta.current?.focus();
  }, [error]);
  const pasos = pasosIniciales(config),
    posicion = pasos.indexOf(step);
  function upd<K extends keyof ConfigState>(key: K, value: ConfigState[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
    setError("");
  }
  function entrar() {
    markTrayectoDone();
    localStorage.setItem(claveInicio(userId), "abierto");
    router.push("/dashboard?v=envios");
  }
  async function siguiente() {
    if (bloqueo.current) return;
    const problema = validarPasoInicial(step, config);
    if (problema) {
      setError(problema);
      return;
    }
    if (
      step === 2 &&
      config.metodoShalom &&
      !agencias.some(
        (a) => a.toLowerCase() === config.nuevoOrigen.trim().toLowerCase(),
      )
    ) {
      setError("Selecciona una agencia Shalom de origen de la lista.");
      return;
    }
    bloqueo.current = true;
    setSaving(true);
    setError("");
    try {
      const r = await guardarPasoServidor(step, config);
      if (r.error) {
        setError(r.error);
        return;
      }
      if (r.slug) setSlug(r.slug);
      setConfig((c) => ({
        ...c,
        logoFile: null,
        redirectMessageImageFile: null,
        ...(r.logoUrl ? { logoUrl: r.logoUrl } : {}),
        ...(r.redirectMessageImage
          ? { redirectMessageImage: r.redirectMessageImage }
          : {}),
      }));
      const proximo = pasos[posicion + 1];
      if (proximo) {
        sessionStorage.setItem(clavePaso(userId), String(proximo));
        setStep(proximo);
      } else {
        sessionStorage.removeItem(clavePaso(userId));
        setListo(true);
      }
    } finally {
      bloqueo.current = false;
      setSaving(false);
    }
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/f/${slug}`,
      );
      setCopiado(true);
    } catch {
      setError(
        "No se pudo copiar. Abre tu formulario y copia el enlace desde el navegador.",
      );
    }
  }
  const tarifaCount = Object.values(config.tarifas).filter(
    (v) => v.trim() !== "" && Number(v) >= 0,
  ).length;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <LogoTori size={28} />
            <span className="text-xl font-extrabold text-sky-700">Tori</span>
          </div>
          {userId && (
            <button
              disabled={saving}
              onClick={entrar}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40"
            >
              Continuar después
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-7 sm:py-10">
        <h1 className="text-2xl font-extrabold text-slate-900">
          {listo
            ? "Tu formulario está preparado"
            : "Prepara tu formulario de envíos"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {listo
            ? "Revisa el resultado como cliente antes de compartirlo. Luego aprende a gestionar las solicitudes en Envíos."
            : "Configura lo básico a tu ritmo. Los pasos se adaptan a tus métodos de entrega y se guardan al continuar. Puedes cambiarlos después en Configuración."}
        </p>
        {cargando ? (
          <p role="status" className="mt-8 text-slate-500">
            Cargando tu configuración…
          </p>
        ) : cargaError ? (
          <div role="alert" className="mt-6 rounded-2xl bg-white p-6">
            <p>{cargaError}</p>
            <button
              className="mt-4 font-bold text-sky-700"
              onClick={() => {
                setCargando(true);
                setReintento((n) => n + 1);
              }}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {!listo && (
              <>
                <ol
                  aria-label="Pasos de configuración"
                  className="my-6 flex flex-wrap gap-2"
                >
                  {pasos.map((p, i) => (
                    <li
                      key={p}
                      aria-current={p === step ? "step" : undefined}
                      className={`rounded-full px-3 py-2 text-xs font-semibold ${p === step ? "bg-sky-600 text-white" : i < posicion ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {i < posicion ? "✓" : i + 1}. {titulos[p]}
                    </li>
                  ))}
                </ol>
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                  <fieldset disabled={saving} className="min-w-0">
                    {step === 1 && (
                      <OnboardingStep1Empresa config={config} upd={upd} />
                    )}
                    {step === 2 && (
                      <OnboardingStep2Metodos
                        config={config}
                        upd={upd}
                        basico={plan === "basic"}
                      />
                    )}
                    {step === 3 && (
                      <OnboardingStep3Logistica
                        config={config}
                        upd={upd}
                        basico={plan === "basic"}
                      />
                    )}
                    {step === 4 && (
                      <OnboardingStep4Tarifas config={config} upd={upd} />
                    )}
                  </fieldset>
                  {error && (
                    <div
                      ref={alerta}
                      role="alert"
                      tabIndex={-1}
                      className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                    >
                      {error}
                    </div>
                  )}
                  <div className="mt-7 flex items-center justify-between gap-3">
                    <button
                      disabled={saving || posicion <= 0}
                      onClick={() => {
                        setError("");
                        setStep(pasos[posicion - 1]);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-40"
                    >
                      <ArrowLeft size={16} />
                      Atrás
                    </button>
                    <button
                      disabled={saving}
                      onClick={() => void siguiente()}
                      className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      {saving
                        ? "Guardando…"
                        : posicion === pasos.length - 1 &&
                            !validarPasoInicial(step, config)
                          ? "Guardar y finalizar"
                          : "Guardar y continuar"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  {step === 1
                    ? "Los pasos siguientes se adaptan a tus métodos de entrega."
                    : `Paso ${posicion + 1} de ${pasos.length}.`}{" "}
                  Si eliges Continuar después, se conservan los pasos guardados;
                  los cambios del paso actual aún no se guardan.
                </p>
              </>
            )}
            {listo && (
              <section className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Check className="text-emerald-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    {config.empresa}
                  </h2>
                </div>
                <p className="text-sm text-slate-600">
                  Métodos guardados{pasos.includes(3) ? ", días revisados" : ""}
                  {config.metodoMotorizado
                    ? ` y ${tarifaCount} distritos con tarifa`
                    : ""}
                  . Comprueba que el formulario solo ofrezca lo que puedes
                  atender.
                </p>
                {dias !== null && plan !== "basic" && (
                  <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-800">
                    Tu prueba de Plus tiene {dias} días restantes. Básico recibe
                    solicitudes ilimitadas; las herramientas avanzadas y el
                    inventario requieren Plus.
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`/f/${slug}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-3 font-semibold text-sky-700"
                  >
                    <ExternalLink size={16} />
                    Probar mi formulario
                  </a>
                  <button
                    onClick={() => void copiar()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
                  >
                    <Copy size={16} />
                    {copiado ? "Enlace copiado" : "Copiar enlace"}
                  </button>
                </div>
                <a
                  href="/recursos/envios/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-bold text-sky-700 underline"
                >
                  Ver la guía de Envíos: del formulario al despacho
                </a>
                <button
                  onClick={entrar}
                  className="w-full rounded-xl bg-sky-600 px-5 py-3 font-bold text-white hover:bg-sky-700"
                >
                  Ir a Envíos
                </button>
                {error && (
                  <p role="alert" className="text-sm text-red-600">
                    {error}
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
