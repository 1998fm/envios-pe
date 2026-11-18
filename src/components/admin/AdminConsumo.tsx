"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  RefreshCw,
  Plus,
  Download,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import {
  METRICAS_CONSUMO,
  compararOficiales,
  type ConsumoData,
  type MetricaConsumo,
  type MedidasOficiales,
} from "@/lib/consumoModel";

const numero = (n: number) =>
  n.toLocaleString("es-PE", { maximumFractionDigits: 4 });
const fecha = (s: string) =>
  new Date(s).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });
const bytes = (n: number) =>
  n >= 1e9 ? `${numero(n / 1e9)} GB` : `${numero(n / 1e6)} MB`;
const fechaInput = () =>
  new Date()
    .toLocaleString("sv-SE", { timeZone: "America/Lima" })
    .slice(0, 19)
    .replace(" ", "T");
type Formulario = Record<MetricaConsumo, { uso: string; limite: string }>;
const inicial = () =>
  Object.fromEntries(
    METRICAS_CONSUMO.map((m) => [m.key, { uso: "", limite: String(m.limite) }]),
  ) as Formulario;
const boton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-400 disabled:opacity-50";

function Serie({
  puntos,
  unidad,
  titulo,
}: {
  puntos: { fecha: string; valor: number; ciclo?: string }[];
  unidad: string;
  titulo: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ancho, setAncho] = useState(900);
  useEffect(() => {
    if (!svgRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setAncho(Math.max(300, entry.contentRect.width)),
    );
    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, [puntos.length]);
  const derecha = ancho - 20;
  if (!puntos.length)
    return (
      <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
        Todavía no hay lecturas en este período. El historial comienza con la
        primera medición; no se inventan datos anteriores.
      </p>
    );
  const ordenados = [...puntos].sort(
    (a, b) => Date.parse(a.fecha) - Date.parse(b.fecha),
  );
  const inicio = Date.parse(ordenados[0].fecha),
    fin = Date.parse(ordenados.at(-1)!.fecha);
  const max = Math.max(...puntos.map((p) => p.valor), 0.001);
  const xy = (p: (typeof puntos)[number]) => ({
    x:
      60 +
      ((Date.parse(p.fecha) - inicio) / Math.max(fin - inicio, 1)) *
        (derecha - 60),
    y: 170 - (p.valor / max) * 140,
  });
  const grupos = new Map<string, typeof puntos>();
  for (const p of ordenados) {
    const k = p.ciclo || "tecnico";
    grupos.set(k, [...(grupos.get(k) || []), p]);
  }
  return (
    <div>
      <svg
        role="img"
        aria-label={titulo}
        ref={svgRef}
        viewBox={`0 0 ${ancho} 205`}
        className="w-full min-w-0"
      >
        <title>{titulo}</title>
        <desc>
          Lecturas registradas en hora de Perú. Cada ciclo de cuota se dibuja
          por separado.
        </desc>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1="60"
              x2={derecha}
              y1={170 - t * 140}
              y2={170 - t * 140}
              stroke="#e2e8f0"
            />
            <text
              x="52"
              y={174 - t * 140}
              textAnchor="end"
              fontSize="10"
              fill="#64748b"
            >
              {numero(max * t)}
            </text>
          </g>
        ))}
        {[...grupos.entries()].map(([k, ps]) => (
          <polyline
            key={k}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            points={ps
              .map((p) => {
                const { x, y } = xy(p);
                return `${x},${y}`;
              })
              .join(" ")}
          />
        ))}
        {ordenados.map((p, i) => {
          const { x, y } = xy(p);
          return (
            <circle key={i} cx={x} cy={y} r="3.5" fill="#0284c7">
              <title>
                {fecha(p.fecha)} · {numero(p.valor)} {unidad}
                {p.ciclo ? ` · ${p.ciclo}` : ""}
              </title>
            </circle>
          );
        })}
        <text x="60" y="198" fontSize="10" fill="#64748b">
          {fecha(ordenados[0].fecha)}
        </text>
        <text x={derecha} y="198" fontSize="10" fill="#64748b" textAnchor="end">
          {fecha(ordenados.at(-1)!.fecha)}
        </text>
      </svg>
      <p className="text-xs text-slate-500">
        {puntos.length} lecturas · {unidad} · hora de Perú. Los cambios de ciclo
        no se conectan como si fueran ahorro.
      </p>
    </div>
  );
}

export default function AdminConsumo({
  refreshRevision = 0,
}: {
  refreshRevision?: number;
}) {
  const [data, setData] = useState<ConsumoData | null>(null),
    [dias, setDias] = useState(7);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [aviso, setAviso] = useState("");
  const [metrica, setMetrica] = useState<MetricaConsumo>("egress"),
    [comparacion, setComparacion] = useState("anterior");
  const [form, setForm] = useState(false),
    [guardando, setGuardando] = useState(false);
  const [campos, setCampos] = useState<Formulario>(inicial),
    [ciclo, setCiclo] = useState(""),
    [momento, setMomento] = useState(fechaInput),
    [nota, setNota] = useState("");
  const solicitud = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (form)
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [form]);
  const cargar = useCallback(
    async (medir = true) => {
      const id = ++solicitud.current;
      setLoading(true);
      setError("");
      try {
        let advertencia = "";
        if (medir) {
          const r = await fetch("/api/admin/consumo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accion: "medir" }),
          });
          if (!r.ok)
            advertencia =
              "La medición técnica no pudo actualizarse. Se conserva el historial disponible.";
          else {
            const j = await r.json();
            advertencia = j.reutilizado
              ? "Medición reciente reutilizada. Se registra como máximo una cada 15 minutos."
              : "Nueva medición técnica registrada.";
          }
        }
        const r = await fetch(`/api/admin/consumo?dias=${dias}`, {
            cache: "no-store",
          }),
          j = await r.json();
        if (!r.ok) throw new Error(j.error || "No se pudo cargar el monitor.");
        if (id === solicitud.current) {
          setData(j);
          setAviso(advertencia);
        }
      } catch (e) {
        if (id === solicitud.current)
          setError(
            e instanceof Error ? e.message : "No se pudo cargar el monitor.",
          );
      } finally {
        if (id === solicitud.current) setLoading(false);
      }
    },
    [dias],
  );
  const cancelar = useCallback(() => {
    solicitud.current++;
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      void cargar();
    }, 0);
    return () => {
      clearTimeout(timer);
      cancelar();
    };
  }, [cargar, refreshRevision, cancelar]);

  function abrirFormulario() {
    const actual = data?.oficial;
    setCampos(
      Object.fromEntries(
        METRICAS_CONSUMO.map((m) => [
          m.key,
          {
            uso: actual ? String(actual.datos.medidas[m.key].uso) : "",
            limite: String(actual?.datos.medidas[m.key].limite ?? m.limite),
          },
        ]),
      ) as Formulario,
    );
    setCiclo(actual?.ciclo || "");
    setMomento(fechaInput());
    setNota("");
    setForm(true);
  }
  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const medidas = Object.fromEntries(
        METRICAS_CONSUMO.map((m) => [
          m.key,
          {
            uso: Number(campos[m.key].uso.replace(",", ".")),
            limite: Number(campos[m.key].limite.replace(",", ".")),
          },
        ]),
      ) as MedidasOficiales;
      const r = await fetch("/api/admin/consumo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "oficial",
          ciclo,
          tomado_en: new Date(
            `${momento.length === 16 ? momento + ":00" : momento}-05:00`,
          ).toISOString(),
          medidas,
          nota,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo guardar la lectura.");
      setForm(false);
      await cargar(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Revisa los datos de la lectura.",
      );
    } finally {
      setGuardando(false);
    }
  }
  function exportar() {
    const columnas = [
      "fecha_peru",
      "ciclo",
      ...METRICAS_CONSUMO.flatMap((m) => [
        `${m.key}_uso_${m.unidad}`,
        `${m.key}_limite_${m.unidad}`,
      ]),
      "nota",
    ];
    const csv = (s: unknown) => {
      let v = String(s ?? "");
      if (/^[=+\-@]/.test(v)) v = `'${v}`;
      return `"${v.replaceAll('"', '""')}"`;
    };
    const filas = (data?.oficiales || []).map((s) => [
      fecha(s.tomado_en),
      s.ciclo,
      ...METRICAS_CONSUMO.flatMap((m) => [
        s.datos.medidas[m.key].uso,
        s.datos.medidas[m.key].limite,
      ]),
      s.datos.nota,
    ]);
    const url = URL.createObjectURL(
      new Blob(
        [
          "\ufeff" +
            [columnas, ...filas].map((r) => r.map(csv).join(",")).join("\r\n"),
        ],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "consumo-supabase.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const actual = data?.actual,
    oficial = data?.oficial;
  const base =
    comparacion === "anterior"
      ? data?.oficialAnterior
      : data?.baseOficial ||
        data?.oficiales.find(
          (s) =>
            s.ciclo === oficial?.ciclo && s.tomado_en !== oficial?.tomado_en,
        );
  const tecnicaBase = data?.baseTecnica;
  const dbDelta =
    actual && tecnicaBase && actual.tomado_en !== tecnicaBase.tomado_en
      ? actual.datos.databaseBytes - tecnicaBase.datos.databaseBytes
      : null;
  const metric = METRICAS_CONSUMO.find((m) => m.key === metrica)!;
  const puntos = (data?.oficiales || []).map((s) => ({
    fecha: s.tomado_en,
    valor: s.datos.medidas[metrica].uso,
    ciclo: s.ciclo,
  }));
  const totalStorage =
    actual?.datos.storage.reduce((s, b) => s + b.bytes, 0) || 0;
  const transActual = actual?.datos.postgres,
    transAntes = tecnicaBase?.datos.postgres;
  const transDelta =
    transActual &&
    transAntes &&
    actual?.tomado_en !== tecnicaBase?.tomado_en &&
    transActual.reinicio === transAntes.reinicio &&
    transActual.transacciones >= transAntes.transacciones
      ? transActual.transacciones - transAntes.transacciones
      : null;

  return (
    <div className="space-y-6 text-slate-900" aria-busy={loading}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Consumo Supabase</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Compara el crecimiento de las cuotas y el estado del proyecto. Las
            lecturas oficiales y las mediciones técnicas se muestran por
            separado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={boton}
            onClick={() => void cargar()}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualizar medición
          </button>
          <button className={boton} onClick={abrirFormulario}>
            <Plus size={15} />
            Registrar lectura oficial
          </button>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" className="text-xs text-slate-500">
          {aviso}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-600">
          Período{" "}
          <select
            aria-label="Período de consumo"
            className="ml-2 rounded-xl border border-slate-200 p-2"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
          >
            {[
              [1, "24 horas"],
              [7, "7 días"],
              [30, "30 días"],
              [90, "90 días"],
            ].map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Comparar cuota con{" "}
          <select
            aria-label="Comparar cuota con"
            className="ml-2 rounded-xl border border-slate-200 p-2"
            value={comparacion}
            onChange={(e) => setComparacion(e.target.value)}
          >
            <option value="anterior">Lectura anterior</option>
            <option value="periodo">Inicio del período disponible</option>
          </select>
        </label>
      </div>

      <section aria-labelledby="cuotas-oficiales">
        <div className="mb-3 flex flex-wrap justify-between gap-2">
          <h3 id="cuotas-oficiales" className="font-bold text-slate-800">
            Cuotas oficiales registradas
          </h3>
          <a
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700"
            href="https://supabase.com/dashboard/org/_/usage"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir Usage de Supabase <ExternalLink size={12} />
          </a>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-slate-500">
          Egress, usuarios activos y logs se copian del panel oficial. No se
          deducen del número de filas. El API público revisado no ofrece los
          seis totales de facturación de la captura.
          {oficial &&
            ` Última lectura: ${fecha(oficial.tomado_en)} · ciclo ${oficial.ciclo}.`}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {METRICAS_CONSUMO.map((m) => {
            const valor = oficial?.datos.medidas[m.key],
              pct = valor ? (valor.uso / valor.limite) * 100 : 0,
              comparar = oficial
                ? compararOficiales(oficial, base || undefined, m.key)
                : null;
            return (
              <article
                key={m.key}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold text-slate-500">
                  {m.nombre}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {valor ? `${numero(valor.uso)} ${m.unidad}` : "Sin lectura"}
                </p>
                {valor && (
                  <>
                    <p className="mt-1 text-xs text-slate-500">
                      de {numero(valor.limite)} {m.unidad} · {numero(pct)} %
                    </p>
                    <div className="my-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-sky-500"}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    {pct >= 100 && (
                      <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-red-700">
                        <AlertTriangle size={13} />
                        Límite superado en esta lectura
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {comparar
                        ? comparar.reinicio
                          ? "Descenso o reinicio detectado: revisa el ciclo."
                          : `${comparar.delta >= 0 ? "+" : ""}${numero(comparar.delta)} ${m.unidad} desde ${fecha(base!.tomado_en)}`
                        : "Sin otra lectura comparable del mismo ciclo."}
                    </p>
                    {comparar &&
                      !comparar.reinicio &&
                      m.key === "egress" &&
                      comparar.horas > 0 && (
                        <p className="mt-1 text-xs font-semibold text-sky-700">
                          Ritmo observado:{" "}
                          {(
                            (comparar.delta * 1000) /
                            comparar.horas
                          ).toLocaleString("es-PE", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          MB/h entre ambas lecturas
                        </p>
                      )}
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {form && (
        <form
          ref={formRef}
          onSubmit={guardar}
          className="space-y-4 rounded-2xl border border-sky-200 bg-white p-5 shadow-sm"
          aria-label="Registrar lectura oficial"
        >
          <h3 className="font-bold text-slate-900">
            Nueva lectura del panel oficial
          </h3>
          <p className="text-xs text-slate-500">
            Copia los seis valores de Usage y sus límites. Los límites iniciales
            corresponden al plan Free; puedes ajustarlos. Usa un ciclo diferente
            cuando se reinicie la cuota.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Ciclo de facturación
              <input
                required
                maxLength={80}
                value={ciclo}
                onChange={(e) => setCiclo(e.target.value)}
                placeholder="Ej.: 18 nov–18 dic 2026"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2"
              />
            </label>
            <label className="text-sm">
              Fecha de la lectura (Perú)
              <input
                required
                type="datetime-local"
                step="1"
                value={momento}
                onChange={(e) => setMomento(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2"
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {METRICAS_CONSUMO.map((m) => (
              <fieldset
                key={m.key}
                className="rounded-xl border border-slate-200 p-3"
              >
                <legend className="px-1 text-sm font-semibold">
                  {m.nombre} ({m.unidad})
                </legend>
                <div className="flex gap-3">
                  {(["uso", "limite"] as const).map((k) => (
                    <label
                      className="min-w-0 flex-1 text-xs text-slate-500"
                      key={k}
                    >
                      {k === "uso" ? "Consumo" : "Límite"}
                      <input
                        aria-label={`${m.nombre}: ${k === "uso" ? "consumo" : "límite"}`}
                        required
                        inputMode="decimal"
                        value={campos[m.key][k]}
                        onChange={(e) =>
                          setCampos((prev) => ({
                            ...prev,
                            [m.key]: { ...prev[m.key], [k]: e.target.value },
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-900"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <label className="block text-sm">
            Nota opcional
            <input
              maxLength={500}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2"
            />
          </label>
          <div className="flex gap-2">
            <button
              disabled={guardando}
              className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar lectura"}
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => setForm(false)}
              className={boton}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap justify-between gap-3">
          <h3 className="font-bold text-slate-800">
            Evolución de cuotas registradas
          </h3>
          <select
            aria-label="Métrica de la gráfica"
            value={metrica}
            onChange={(e) => setMetrica(e.target.value as MetricaConsumo)}
            className="max-w-full rounded-xl border border-slate-200 p-2 text-sm"
          >
            {METRICAS_CONSUMO.map((m) => (
              <option key={m.key} value={m.key}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
        <Serie
          puntos={puntos}
          unidad={metric.unidad}
          titulo={`Evolución: ${metric.nombre}`}
        />
      </section>

      <section aria-labelledby="estado-tecnico">
        <h3 id="estado-tecnico" className="font-bold text-slate-800">
          Mediciones técnicas automáticas
        </h3>
        <p className="mb-3 mt-1 text-xs text-slate-500">
          Una captura diaria y al abrir o actualizar este panel, como máximo
          cada 15 minutos. No hay consultas constantes. Última medición:{" "}
          {actual ? fecha(actual.tomado_en) : "pendiente"}. Estas cifras
          describen almacenamiento y actividad interna, no GB de salida
          facturados.
        </p>
        {actual && (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">Tamaño PostgreSQL</p>
                <p className="mt-1 text-2xl font-black">
                  {bytes(actual.datos.databaseBytes)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {dbDelta !== null
                    ? `${dbDelta >= 0 ? "+" : ""}${bytes(dbDelta)} desde ${fecha(tecnicaBase!.tomado_en)}`
                    : "Se necesitan dos mediciones para comparar."}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">
                  Archivos: tamaño de metadatos
                </p>
                <p className="mt-1 text-2xl font-black">
                  {bytes(totalStorage)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {numero(
                    actual.datos.storage.reduce((s, b) => s + b.archivos, 0),
                  )}{" "}
                  archivos en todos los buckets
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">
                  Transacciones PostgreSQL
                </p>
                <p className="mt-1 text-2xl font-black">
                  {transDelta === null
                    ? "Sin base comparable"
                    : `+${numero(transDelta)}`}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Actividad interna, incluido el propio monitor. Se compara solo
                  si no se reiniciaron los contadores.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-semibold">
                Evolución del tamaño de PostgreSQL
              </h4>
              <Serie
                puntos={(data?.tecnicos || []).map((s) => ({
                  fecha: s.tomado_en,
                  valor: s.databaseBytes / 1e6,
                }))}
                unidad="MB"
                titulo="Tamaño de PostgreSQL por fecha"
              />
            </div>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-[640px] w-full text-sm">
                <caption className="p-3 text-left font-semibold">
                  Volumen por tabla · no equivale a consumo de red
                </caption>
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="p-3 text-left">Tabla</th>
                    <th className="p-3 text-right">Registros</th>
                    <th className="p-3 text-right">Espacio e índices</th>
                    <th className="p-3 text-right">Variación de registros</th>
                  </tr>
                </thead>
                <tbody>
                  {actual.datos.tablas.map((t) => {
                    const b = tecnicaBase?.datos.tablas.find(
                      (x) => x.nombre === t.nombre,
                    );
                    return (
                      <tr className="border-t border-slate-100" key={t.nombre}>
                        <td className="p-3 font-mono text-xs">{t.nombre}</td>
                        <td className="p-3 text-right">{numero(t.filas)}</td>
                        <td className="p-3 text-right">{bytes(t.bytes)}</td>
                        <td className="p-3 text-right">
                          {b
                            ? `${t.filas - b.filas >= 0 ? "+" : ""}${numero(t.filas - b.filas)}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              {actual.datos.storage.map((b) => (
                <span key={b.bucket}>
                  {b.bucket}: {numero(b.archivos)} archivos · {bytes(b.bytes)}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4">
          <h3 className="font-semibold">Historial de lecturas oficiales</h3>
          <button
            onClick={exportar}
            disabled={!data?.oficiales.length}
            className={boton}
          >
            <Download size={14} />
            Exportar lecturas mostradas
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Fecha (Perú)</th>
                <th className="p-3 text-left">Ciclo</th>
                {METRICAS_CONSUMO.map((m) => (
                  <th className="p-3 text-right" key={m.key}>
                    {m.nombre} ({m.unidad})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...(data?.oficiales || [])].reverse().map((s) => (
                <tr className="border-t border-slate-100" key={s.id}>
                  <td className="whitespace-nowrap p-3">
                    {fecha(s.tomado_en)}
                  </td>
                  <td className="p-3" title={s.datos.nota}>
                    {s.ciclo}
                  </td>
                  {METRICAS_CONSUMO.map((m) => (
                    <td className="p-3 text-right" key={m.key}>
                      {numero(s.datos.medidas[m.key].uso)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data?.oficiales.length && (
          <p className="p-4 text-sm text-slate-500">
            Registra la primera lectura para comparar el crecimiento real de las
            cuotas.
          </p>
        )}
        <p className="border-t border-slate-100 p-3 text-xs text-slate-400">
          Hasta 200 lecturas oficiales por período. La vista técnica muestra
          hasta 90 días. Se conserva el historial; la limpieza automática está
          desactivada.
        </p>
      </section>
      <p className="flex items-start gap-2 text-xs text-slate-500">
        <Activity size={15} className="shrink-0" />
        El monitor no descarga pedidos ni imágenes, no activa auditoría de cada
        consulta y no borra registros de negocio. Un valor acumulado de cuota no
        baja al optimizar: compara su crecimiento entre lecturas del mismo
        ciclo.
      </p>
    </div>
  );
}
