"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  ExternalLink,
  History,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import type { SupportData, SupportOrder } from "@/types/adminSupport";

type Company = {
  id: string;
  empresa: string;
  email: string;
  slug: string;
  plan: string;
  disabled: boolean;
};
type Tab =
  | "diagnostico"
  | "configuracion"
  | "pedidos"
  | "acceso"
  | "historial"
  | "cuenta";
type Review = {
  titulo: string;
  payload: Record<string, unknown>;
  antes: Record<string, unknown>;
  despues: Record<string, unknown>;
};
type Props = {
  onRefresh: () => void;
  summary: {
    total: number;
    activas: number;
    enTrial: number;
    pagando: number;
  } | null;
  onNavigate: (
    tab:
      | "empresas"
      | "facturacion"
      | "actividad"
      | "auditoria"
      | "admins"
      | "shalom"
      | "olva",
  ) => void;
};
const input =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100";
const button =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40";
const fields = [
  ["empresa", "Nombre del negocio"],
  ["slug", "Enlace del formulario"],
  ["telefono", "Teléfono del negocio"],
  ["direccion", "Dirección del negocio"],
  ["origen_shalom", "Agencia de origen Shalom"],
  ["cerrar_formulario_mensaje", "Mensaje al cerrar el formulario"],
] as const;
const methods = [
  ["metodo_motorizado", "Motorizado"],
  ["metodo_shalom", "Shalom"],
  ["metodo_olva", "Olva"],
  ["metodo_marvisur", "Marvisur"],
  ["metodo_flores", "Flores"],
  ["metodo_otro", "Otro método"],
  ["metodo_recojo", "Recojo en tienda"],
] as const;
const states = ["NO_EMPACADO", "EMPACADO", "EN_OBSERVACION", "ENVIADO"];
const names: Record<string, string> = {
  NO_EMPACADO: "No empacado",
  EMPACADO: "Empacado",
  EN_OBSERVACION: "En observación",
  ENVIADO: "Enviado",
  plan: "Plan",
  disabled: "Cuenta suspendida",
  logistica_moto_dias: "Días de entrega",
  dias_adicionales: "Días adicionales",
  acceso: "Acceso",
  pro_until: "Acceso Plus hasta",
  trial_end: "Prueba hasta",
  ...Object.fromEntries([...fields, ...methods]),
};
const valueText = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map(
          (v) =>
            ({
              MONDAY: "Lunes",
              TUESDAY: "Martes",
              WEDNESDAY: "Miércoles",
              THURSDAY: "Jueves",
              FRIDAY: "Viernes",
              SATURDAY: "Sábado",
              SUNDAY: "Domingo",
            })[String(v)] ?? String(v),
        )
        .join(", ") || "Sin días"
    : value == null || value === ""
      ? "Sin configurar"
      : typeof value === "boolean"
        ? value
          ? "Sí"
          : "No"
        : value === "business_plus"
          ? "Plus"
          : value === "basic"
            ? "Básico"
            : String(value);
const date = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString("es-PE", { timeZone: "America/Lima" })
    : "Sin registro";
async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const r = await fetch(url, { cache: "no-store", ...options });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "No se pudo completar la operación");
  return data as T;
}

export default function AdminSupportCenter({
  summary,
  onNavigate,
  onRefresh,
}: Props) {
  const [query, setQuery] = useState("");
  const [directoryPage, setDirectoryPage] = useState(1);
  const [directory, setDirectory] = useState<Company[]>([]);
  const [directoryTotal, setDirectoryTotal] = useState(0);
  const [directoryError, setDirectoryError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("diagnostico");
  const [orderQuery, setOrderQuery] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: SupportData;
  } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<Record<string, string | boolean>>({});
  const [order, setOrder] = useState<SupportOrder | null>(null);
  const [orderForm, setOrderForm] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [supportLink, setSupportLink] = useState("");
  const [days, setDays] = useState("30");
  const [review, setReview] = useState<Review | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const workspace = useRef<HTMLElement>(null);
  const [deliveryDays, setDeliveryDays] = useState<string[]>([]);
  const requestKey = `${selected}:${page}:${orderQuery}:${revision}`;
  const data = result?.data.profile.id === selected ? result.data : null;

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api<{ items: Company[]; total: number }>(
        `/api/admin/empresas?search=${encodeURIComponent(query)}&page=${directoryPage}&perPage=8`,
        { signal: controller.signal },
      )
        .then((r) => {
          setDirectory(r.items);
          setDirectoryTotal(r.total);
          setDirectoryError("");
        })
        .catch((e) => {
          if (!controller.signal.aborted) setDirectoryError(e.message);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, directoryPage, revision]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    api<SupportData>(
      `/api/admin/empresas/${selected}/soporte?pagina=${page}&nombre=${encodeURIComponent(orderQuery)}`,
      { signal: controller.signal },
    )
      .then((r) => {
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, data: r });
        setDeliveryDays(r.profile.logistica_moto_dias ?? []);
        setError("");
        setConfig(
          Object.fromEntries([
            ...fields.map(([k]) => [k, r.profile[k] ?? ""]),
            ...methods.map(([k]) => [k, !!r.profile[k]]),
            ["cerrar_formulario", !!r.profile.cerrar_formulario],
          ]),
        );
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [selected, page, orderQuery, revision, requestKey]);

  useEffect(() => {
    if (selected && window.innerWidth < 1280)
      workspace.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected]);

  function select(id: string) {
    if (busy.current) return;
    setSelected(id);
    setTab("diagnostico");
    setPage(1);
    setOrderQuery("");
    setOrder(null);
    setReview(null);
    setError("");
    setMessage("");
    setPassword("");
    setSupportLink("");
  }
  function prepare(
    titulo: string,
    payload: Record<string, unknown>,
    antes: Record<string, unknown>,
    despues: Record<string, unknown>,
  ) {
    setReason("");
    setReview({
      titulo,
      payload: { ...payload, esperado: antes },
      antes,
      despues,
    });
    setError("");
    setMessage("");
    setPassword("");
    setSupportLink("");
  }
  function prepareConfig() {
    if (!data) return;
    const profile = data.profile as unknown as Record<string, unknown>;
    const cambios: Record<string, unknown> = Object.fromEntries(
      Object.entries(config).filter(([k, v]) => v !== (profile[k] ?? "")),
    );
    if (
      JSON.stringify(deliveryDays) !==
      JSON.stringify(data.profile.logistica_moto_dias ?? [])
    )
      cambios.logistica_moto_dias = deliveryDays;
    if (!Object.keys(cambios).length) {
      setMessage("No hay cambios pendientes.");
      return;
    }
    const antes = Object.fromEntries(
      Object.keys(cambios).map((k) => [k, profile[k]]),
    );
    prepare(
      "Revisar configuración del negocio",
      { accion: "configuracion", cambios },
      antes,
      cambios,
    );
  }
  function openOrder(p: SupportOrder) {
    setOrder(p);
    setOrderForm(
      Object.fromEntries(
        [
          "nombre",
          "telefono",
          "dni",
          "destino",
          "direccion",
          "observaciones",
          "estado",
        ].map((k) => [k, String(p[k as keyof SupportOrder] ?? "")]),
      ),
    );
  }
  function prepareOrder() {
    if (!order) return;
    const antes = Object.fromEntries(
      Object.entries(orderForm)
        .filter(([k, v]) => v !== String(order[k as keyof SupportOrder] ?? ""))
        .map(([k]) => [k, order[k as keyof SupportOrder]]),
    );
    const cambios = Object.fromEntries(
      Object.keys(antes).map((k) => [k, orderForm[k]]),
    );
    if (!Object.keys(cambios).length) {
      setMessage("No hay cambios pendientes.");
      return;
    }
    prepare(
      `Corregir pedido ${order.codigo ?? order.id.slice(0, 8)}`,
      { accion: "pedido", pedidoId: order.id, cambios },
      antes,
      cambios,
    );
  }
  async function apply() {
    if (!selected || !review || busy.current || reason.trim().length < 10)
      return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const response = await api<{
        password?: string;
        link?: string;
        aviso?: string;
      }>(`/api/admin/empresas/${selected}/soporte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...review.payload, motivo: reason }),
      });
      setReview(null);
      setOrder(null);
      setRevision((r) => r + 1);
      setMessage(
        response.aviso ?? "Operación completada y registrada en auditoría.",
      );
      setPassword(response.password ?? "");
      setSupportLink(response.link ?? "");
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[.2em] text-sky-600">
            Operación y soporte
          </span>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            El control de tu plataforma.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Encuentra un negocio, revisa su situación y resuelve desde una sola
            ficha.
          </p>
        </div>
        <button
          onClick={() => {
            setRevision((r) => r + 1);
            onRefresh();
          }}
          disabled={saving}
          className={button}
        >
          <RefreshCw size={15} />
          Actualizar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Negocios registrados", summary?.total, Building2],
          ["Cuentas activas", summary?.activas, ShieldCheck],
          ["Probando Plus", summary?.enTrial, Activity],
          ["Accesos Plus vigentes", summary?.pagando, CreditCard],
        ].map(([label, count, Icon]) => {
          const I = Icon as typeof Building2;
          return (
            <div
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {String(label)}
                </span>
                <I size={17} className="shrink-0 text-sky-500" />
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">
                {count == null ? "—" : String(count)}
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["empresas", "Cuentas y usuarios", Building2],
          ["facturacion", "Pagos y suscripciones", CreditCard],
          ["auditoria", "Auditoría global", History],
          ["admins", "Administradores", ShieldCheck],
          ["shalom", "Shalom", ClipboardList],
          ["olva", "Olva", ClipboardList],
        ].map(([key, label, Icon]) => {
          const I = Icon as typeof Building2;
          return (
            <button
              key={String(key)}
              className={button}
              onClick={() =>
                onNavigate(key as Parameters<Props["onNavigate"]>[0])
              }
            >
              <I size={14} />
              {String(label)}
              <ArrowRight size={12} className="text-slate-400" />
            </button>
          );
        })}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white xl:sticky xl:top-6">
          <div className="border-b border-slate-100 p-4">
            <label
              htmlFor="support-search"
              className="text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Buscar un negocio
            </label>
            <div className="relative mt-3">
              <Search
                size={16}
                className="absolute left-3 top-3.5 text-slate-400"
              />
              <input
                id="support-search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setDirectoryPage(1);
                }}
                placeholder="Nombre, correo o enlace"
                className={`${input} pl-9`}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {directoryTotal}{" "}
              {directoryTotal === 1 ? "resultado" : "resultados"}
            </p>
          </div>
          {directoryError && (
            <p role="alert" className="p-4 text-sm text-red-600">
              {directoryError}
            </p>
          )}
          <div className="max-h-[440px] overflow-y-auto divide-y divide-slate-100">
            {directory.map((c) => (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                disabled={saving}
                aria-pressed={selected === c.id}
                className={`w-full px-4 py-4 text-left transition-colors ${selected === c.id ? "bg-sky-50 ring-1 ring-inset ring-sky-200" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="break-words text-sm font-bold text-slate-800">
                    {c.empresa || c.slug || "Sin nombre"}
                  </span>
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${c.disabled ? "bg-red-400" : "bg-emerald-400"}`}
                  />
                </div>
                <p className="mt-1 break-all text-xs text-slate-400">
                  {c.email || c.slug}
                </p>
                <span className="mt-2 inline-block text-[10px] font-bold uppercase text-sky-600">
                  {c.plan === "basic" ? "Básico" : "Plus"}
                </span>
              </button>
            ))}
            {!directory.length && !directoryError && (
              <p className="p-6 text-sm text-slate-500">
                No se encontraron negocios.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 p-3">
            <button
              aria-label="Página anterior de negocios"
              disabled={directoryPage <= 1 || saving}
              onClick={() => setDirectoryPage((p) => p - 1)}
              className={button}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-slate-500">
              Página {directoryPage}
            </span>
            <button
              aria-label="Página siguiente de negocios"
              disabled={directoryPage * 8 >= directoryTotal || saving}
              onClick={() => setDirectoryPage((p) => p + 1)}
              className={button}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </aside>
        <section
          ref={workspace}
          className="min-w-0 scroll-mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          {!selected ? (
            <div className="flex min-h-[430px] flex-col items-center justify-center p-8 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-sky-50 text-sky-600">
                <Settings2 size={28} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-800">
                Un espacio de trabajo por negocio.
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                Selecciona una cuenta para diagnosticar bloqueos, corregir
                pedidos, ajustar el formulario o revisar su acceso Plus.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="m-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </div>
              )}
              {message && (
                <div
                  role="status"
                  className="m-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
                >
                  {message}
                </div>
              )}
              {!data ? (
                !error && (
                  <div className="flex items-center justify-center gap-2 p-20 text-sm text-slate-500">
                    <Loader2 size={18} className="animate-spin" />
                    Cargando ficha...
                  </div>
                )
              ) : (
                <>
                  <div className="border-b border-slate-100 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-xl font-extrabold text-slate-900">
                          {data.profile.empresa || "Negocio sin nombre"}
                        </h3>
                        <p className="mt-1 break-all text-sm text-slate-500">
                          {data.cuenta?.email}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${data.profile.disabled ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {data.profile.disabled ? "Suspendido" : "Activo"} ·{" "}
                        {data.planEfectivo.plan === "basic" ? "Básico" : "Plus"}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {data.profile.slug && (
                        <a
                          href={`/f/${encodeURIComponent(data.profile.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={button}
                        >
                          <ExternalLink size={13} />
                          Ver formulario
                        </a>
                      )}
                      <button
                        onClick={() => setTab("cuenta")}
                        className={button}
                      >
                        <KeyRound size={13} />
                        Gestionar cuenta
                      </button>
                    </div>
                  </div>
                  <nav
                    aria-label="Ficha del negocio"
                    className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 py-2"
                  >
                    {(
                      [
                        ["diagnostico", "Diagnóstico"],
                        ["configuracion", "Negocio y formulario"],
                        ["pedidos", "Pedidos"],
                        ["acceso", "Acceso Plus"],
                        ["cuenta", "Cuenta y sesión"],
                        ["historial", "Historial"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setTab(key);
                          setOrder(null);
                          setMessage("");
                        }}
                        className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold ${tab === key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </nav>
                  <div className="p-5 sm:p-6">
                    {tab === "diagnostico" && (
                      <div className="space-y-3">
                        {data.diagnosticos.map((d) => (
                          <div
                            key={d.codigo}
                            className={`flex gap-3 rounded-xl border p-4 ${d.nivel === "ok" ? "border-emerald-100 bg-emerald-50/60" : d.nivel === "error" ? "border-red-100 bg-red-50/60" : "border-amber-100 bg-amber-50/60"}`}
                          >
                            {d.nivel === "ok" ? (
                              <CheckCircle2
                                size={18}
                                className="mt-0.5 shrink-0 text-emerald-600"
                              />
                            ) : (
                              <TriangleAlert
                                size={18}
                                className="mt-0.5 shrink-0 text-amber-600"
                              />
                            )}
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">
                                {d.titulo}
                              </h4>
                              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                {d.detalle}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="grid gap-3 pt-3 sm:grid-cols-2">
                          {[
                            [
                              "Último inicio de sesión",
                              date(data.cuenta?.ultimoIngreso),
                            ],
                            ["Prueba Plus hasta", date(data.profile.trial_end)],
                            ["Acceso Plus hasta", date(data.profile.pro_until)],
                            [
                              "Correo confirmado",
                              data.cuenta?.confirmado ? "Sí" : "No",
                            ],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-xl border border-slate-100 p-4"
                            >
                              <p className="text-xs text-slate-400">{label}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-700">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {tab === "configuracion" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          prepareConfig();
                        }}
                        className="space-y-5"
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          {fields.map(([key, label]) => (
                            <label
                              key={key}
                              className={
                                key === "cerrar_formulario_mensaje"
                                  ? "sm:col-span-2"
                                  : ""
                              }
                            >
                              <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                                {label}
                              </span>
                              <input
                                value={String(config[key] ?? "")}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    [key]: e.target.value,
                                  })
                                }
                                className={input}
                              />
                            </label>
                          ))}
                        </div>
                        <label className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!config.cerrar_formulario}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                cerrar_formulario: e.target.checked,
                              })
                            }
                          />
                          Formulario cerrado a nuevos pedidos
                        </label>
                        <fieldset>
                          <legend className="mb-3 text-sm font-bold text-slate-700">
                            Métodos de entrega
                          </legend>
                          <div className="grid grid-cols-2 gap-3">
                            {methods.map(([key, label]) => (
                              <label
                                key={key}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-600"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!config[key]}
                                  onChange={(e) =>
                                    setConfig({
                                      ...config,
                                      [key]: e.target.checked,
                                    })
                                  }
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <fieldset>
                          <legend className="mb-3 text-sm font-bold text-slate-700">
                            Días de entrega motorizada
                          </legend>
                          <div className="flex flex-wrap gap-2">
                            {(
                              [
                                ["MONDAY", "Lunes"],
                                ["TUESDAY", "Martes"],
                                ["WEDNESDAY", "Miércoles"],
                                ["THURSDAY", "Jueves"],
                                ["FRIDAY", "Viernes"],
                                ["SATURDAY", "Sábado"],
                                ["SUNDAY", "Domingo"],
                              ] as const
                            ).map(([key, label]) => (
                              <label
                                key={key}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
                              >
                                <input
                                  type="checkbox"
                                  checked={deliveryDays.includes(key)}
                                  onChange={(e) =>
                                    setDeliveryDays(
                                      e.target.checked
                                        ? [...deliveryDays, key]
                                        : deliveryDays.filter((d) => d !== key),
                                    )
                                  }
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <button className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700">
                          Revisar cambios
                        </button>
                      </form>
                    )}
                    {tab === "pedidos" && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            aria-label="Buscar pedidos por nombre"
                            placeholder="Buscar pedidos por nombre del cliente"
                            value={orderQuery}
                            onChange={(e) => {
                              setOrderQuery(e.target.value);
                              setPage(1);
                              setOrder(null);
                            }}
                            className={`${input} flex-1`}
                          />
                          <span className="text-xs text-slate-400">
                            {data.totalPedidos} pedidos
                          </span>
                        </div>
                        {order ? (
                          <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
                            <div className="mb-4 flex justify-between gap-2">
                              <h4 className="text-sm font-bold text-slate-800">
                                Corregir {order.codigo || order.id.slice(0, 8)}
                              </h4>
                              <button
                                onClick={() => setOrder(null)}
                                aria-label="Cerrar edición del pedido"
                              >
                                <X size={17} />
                              </button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {[
                                ["nombre", "Nombre del cliente"],
                                ["telefono", "Teléfono del cliente"],
                                ["dni", "DNI"],
                                ["destino", "Destino"],
                                ["direccion", "Dirección de entrega"],
                                ["observaciones", "Observaciones"],
                              ].map(([key, label]) => (
                                <label key={key}>
                                  <span className="mb-1 block text-xs text-slate-500">
                                    {label}
                                  </span>
                                  <input
                                    className={input}
                                    value={orderForm[key] ?? ""}
                                    onChange={(e) =>
                                      setOrderForm({
                                        ...orderForm,
                                        [key]: e.target.value,
                                      })
                                    }
                                  />
                                </label>
                              ))}
                              <label>
                                <span className="mb-1 block text-xs text-slate-500">
                                  Estado del pedido
                                </span>
                                <select
                                  value={orderForm.estado}
                                  onChange={(e) =>
                                    setOrderForm({
                                      ...orderForm,
                                      estado: e.target.value,
                                    })
                                  }
                                  className={input}
                                >
                                  {states.map((s) => (
                                    <option key={s} value={s}>
                                      {names[s]}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <button
                              onClick={prepareOrder}
                              className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white"
                            >
                              Revisar corrección
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {data.pedidos.map((p) => (
                              <div
                                key={p.id}
                                className="flex flex-wrap items-center justify-between gap-3 py-4"
                              >
                                <div className="min-w-0">
                                  <p className="break-words text-sm font-bold text-slate-800">
                                    {p.nombre || "Sin nombre"}{" "}
                                    <span className="font-normal text-slate-400">
                                      · {p.codigo}
                                    </span>
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {p.metodo} · {names[p.estado] ?? p.estado}
                                  </p>
                                </div>
                                <button
                                  onClick={() => openOrder(p)}
                                  className={button}
                                >
                                  Corregir pedido
                                </button>
                              </div>
                            ))}
                            {!data.pedidos.length && (
                              <p className="py-8 text-center text-sm text-slate-400">
                                No hay pedidos para esta búsqueda.
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between gap-3">
                          <button
                            disabled={page <= 1}
                            onClick={() => {
                              setPage((p) => p - 1);
                              setOrder(null);
                            }}
                            className={button}
                          >
                            Anterior
                          </button>
                          <span className="py-2 text-xs text-slate-400">
                            Página {page}
                          </span>
                          <button
                            disabled={page * 25 >= data.totalPedidos}
                            onClick={() => {
                              setPage((p) => p + 1);
                              setOrder(null);
                            }}
                            className={button}
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    )}
                    {tab === "acceso" && (
                      <div className="space-y-5">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <h4 className="font-bold text-slate-800">
                            Acceso actual:{" "}
                            {data.planEfectivo.plan === "basic"
                              ? "Básico"
                              : "Plus"}
                            {data.planEfectivo.isTrial ? " · Prueba" : ""}
                          </h4>
                          <p className="mt-2 text-sm text-slate-500">
                            Vigencia registrada: {date(data.profile.pro_until)}
                          </p>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-500">
                          Puedes conceder días de acceso por una incidencia,
                          cortesía o pago verificado. Esta acción no cobra al
                          cliente ni crea un comprobante de pago.
                        </p>
                        <div className="flex flex-wrap items-end gap-3">
                          <label className="min-w-0 flex-1">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                              Días adicionales de Plus
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={days}
                              onChange={(e) => setDays(e.target.value)}
                              className={input}
                            />
                          </label>
                          <button
                            disabled={
                              !Number.isInteger(Number(days)) ||
                              Number(days) < 1 ||
                              Number(days) > 365
                            }
                            onClick={() => {
                              const before = {
                                plan: data.profile.plan,
                                trial_end: data.profile.trial_end,
                                pro_until: data.profile.pro_until,
                              };
                              prepare(
                                "Conceder acceso adicional a Plus",
                                { accion: "extender_plus", dias: Number(days) },
                                before,
                                {
                                  plan: "business_plus",
                                  dias_adicionales: Number(days),
                                },
                              );
                            }}
                            className={button}
                          >
                            Revisar extensión
                          </button>
                        </div>
                        <button
                          disabled={data.planEfectivo.plan === "basic"}
                          onClick={() =>
                            prepare(
                              "Pasar el negocio a Básico",
                              { accion: "pasar_basico" },
                              {
                                plan: data.profile.plan,
                                trial_end: data.profile.trial_end,
                                pro_until: data.profile.pro_until,
                              },
                              { plan: "basic" },
                            )
                          }
                          className="text-sm font-semibold text-red-600 disabled:opacity-40"
                        >
                          Pasar a Básico conservando datos y recibos
                        </button>
                        <p className="text-xs leading-relaxed text-slate-500">
                          Cambiar el acceso no cancela la suscripción ni los
                          cobros de MercadoPago.
                        </p>
                        <div className="border-t border-slate-100 pt-4">
                          <button
                            onClick={() => onNavigate("facturacion")}
                            className={button}
                          >
                            Revisar pagos registrados
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                    {tab === "cuenta" && (
                      <div className="space-y-5">
                        <div className="rounded-xl border border-slate-200 p-4">
                          <p className="break-all text-sm font-bold text-slate-700">
                            {data.cuenta?.email}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Correo{" "}
                            {data.cuenta?.confirmado
                              ? "confirmado"
                              : "sin confirmar"}{" "}
                            · Sesión{" "}
                            {data.cuenta?.bloqueada
                              ? "bloqueada"
                              : "habilitada"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Rol:{" "}
                            {data.profile.role === "super_admin"
                              ? "Superadministrador"
                              : "Usuario"}
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            className={button}
                            onClick={() =>
                              prepare(
                                data.profile.disabled || data.cuenta?.bloqueada
                                  ? "Reactivar la cuenta del negocio"
                                  : "Suspender la cuenta del negocio",
                                {
                                  accion: "bloquear_cuenta",
                                  bloqueada: !(
                                    data.profile.disabled ||
                                    data.cuenta?.bloqueada
                                  ),
                                },
                                { disabled: data.profile.disabled },
                                {
                                  disabled: !(
                                    data.profile.disabled ||
                                    data.cuenta?.bloqueada
                                  ),
                                },
                              )
                            }
                          >
                            {data.profile.disabled || data.cuenta?.bloqueada
                              ? "Reactivar acceso"
                              : "Suspender acceso"}
                          </button>
                          <button
                            className={button}
                            onClick={() =>
                              prepare(
                                "Generar una nueva contraseña",
                                { accion: "reset_password" },
                                {
                                  disabled: data.profile.disabled,
                                  role: data.profile.role,
                                },
                                {
                                  acceso:
                                    "Se reemplazará la contraseña actual por una nueva.",
                                },
                              )
                            }
                          >
                            Restablecer contraseña
                          </button>
                          <button
                            disabled={data.profile.disabled}
                            className={button}
                            onClick={() =>
                              prepare(
                                "Preparar acceso al dashboard del negocio",
                                { accion: "impersonar" },
                                {
                                  disabled: data.profile.disabled,
                                  role: data.profile.role,
                                },
                                {
                                  acceso:
                                    "Se generará un enlace de soporte para esta cuenta.",
                                },
                              )
                            }
                          >
                            Entrar como negocio
                          </button>
                        </div>
                        {password && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-bold text-amber-900">
                              Nueva contraseña de acceso
                            </p>
                            <p className="mt-2 break-all rounded-lg bg-white p-3 font-mono text-slate-900">
                              {password}
                            </p>
                            <p className="mt-2 text-xs text-amber-800">
                              Compártela de forma privada con el titular. Se
                              ocultará al cambiar de negocio o cerrar esta
                              página.
                            </p>
                            <button
                              className={`${button} mt-3`}
                              onClick={() => setPassword("")}
                            >
                              Ocultar contraseña
                            </button>
                          </div>
                        )}
                        {supportLink && (
                          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                            <p className="text-sm text-sky-800">
                              Al abrir el enlace, tu sesión cambiará a la del
                              negocio. Para volver al superadmin tendrás que
                              iniciar sesión con tu cuenta de administración.
                            </p>
                            <a
                              href={supportLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${button} mt-3`}
                            >
                              Abrir dashboard como negocio
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {tab === "historial" && (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400">
                          Últimas 20 acciones registradas para este negocio.
                        </p>
                        {data.historial.map((h) => (
                          <div
                            key={h.id}
                            className="rounded-xl border border-slate-100 p-4"
                          >
                            <div className="flex flex-wrap justify-between gap-2">
                              <p className="text-sm font-bold text-slate-700">
                                {h.accion.replaceAll("_", " ")}
                              </p>
                              <span className="text-xs text-slate-400">
                                {date(h.created_at)}
                              </span>
                            </div>
                            <p className="mt-1 break-all text-xs text-slate-400">
                              {h.admin_email}
                            </p>
                            {typeof h.detalle.motivo === "string" && (
                              <p className="mt-3 text-sm text-slate-600">
                                {h.detalle.motivo}
                              </p>
                            )}
                            {typeof h.detalle.estado === "string" && (
                              <p className="mt-2 text-xs font-bold text-sky-600">
                                {h.detalle.estado}
                              </p>
                            )}
                          </div>
                        ))}
                        {!data.historial.length && (
                          <p className="py-8 text-center text-sm text-slate-400">
                            No hay acciones registradas para esta cuenta.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
      {review && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-review-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-600">
                  Confirmación de soporte
                </p>
                <h3
                  id="support-review-title"
                  className="mt-2 text-xl font-extrabold text-slate-900"
                >
                  {review.titulo}
                </h3>
              </div>
              <button
                disabled={saving}
                onClick={() => setReview(null)}
                aria-label="Cerrar revisión"
              >
                <X size={19} />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Negocio: <strong>{data?.profile.empresa}</strong>
            </p>
            <div className="my-5 overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 text-[10px] font-bold uppercase text-slate-400">
                <span>Campo</span>
                <span>Actual</span>
                <span>Nuevo</span>
              </div>
              {Object.entries(review.despues).map(([k, v]) => (
                <div
                  key={k}
                  className="grid grid-cols-3 gap-2 border-t border-slate-100 p-3 text-xs"
                >
                  <span className="break-words font-semibold text-slate-600">
                    {names[k] ?? k}
                  </span>
                  <span className="break-words text-slate-400">
                    {valueText(review.antes[k])}
                  </span>
                  <span className="break-words font-bold text-sky-700">
                    {valueText(v)}
                  </span>
                </div>
              ))}
            </div>
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Motivo de la corrección
              </span>
              <textarea
                rows={3}
                minLength={10}
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe la incidencia o la autorización del negocio (mínimo 10 caracteres)."
                className={input}
              />
            </label>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                disabled={saving}
                onClick={() => setReview(null)}
                className={button}
              >
                Cancelar
              </button>
              <button
                disabled={saving || reason.trim().length < 10}
                onClick={apply}
                className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Confirmar y guardar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
