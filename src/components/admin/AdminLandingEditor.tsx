"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  History,
  ImagePlus,
  Monitor,
  Plus,
  Redo2,
  Save,
  Smartphone,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import { api } from "@/lib/clienteApi";
import {
  claveTexto,
  landingInicial,
  type DocumentoLanding,
  type SeccionLanding,
  type TextoLanding,
} from "@/lib/landing/model";
import catalogo from "@/lib/landing/catalogo.json";

type Version = {
  revision: number;
  documento: DocumentoLanding;
  fecha: string | null;
};
type Estado = {
  borrador: Version;
  publicado: Version;
  historial: { revision: number; fecha: string }[];
};
type Campo = { key: string; original: string };
const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800";
const boton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40";

export default function AdminLandingEditor({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [documento, setDocumento] = useState<DocumentoLanding>(landingInicial);
  const [guardado, setGuardado] = useState("");
  const [seccionId, setSeccionId] = useState("inicio");
  const [panel, setPanel] = useState<"secciones" | "contenido" | "publicacion">(
    "secciones",
  );
  const [camposVivos, setCamposVivos] = useState<Campo[]>([]);
  const [enlacesVivos, setEnlacesVivos] = useState<Campo[]>([]);
  const [seleccion, setSeleccion] = useState<Campo | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [ancho, setAncho] = useState(1100);
  const [escala, setEscala] = useState(1);
  const [seleccionar, setSeleccionar] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [undo, setUndo] = useState<DocumentoLanding[]>([]);
  const [redo, setRedo] = useState<DocumentoLanding[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(documento) !== guardado && !!estado;
  const seccion = documento.secciones.find((s) => s.id === seccionId)!;
  const esCustom = seccionId.startsWith("custom-");
  const enviar = useCallback(
    (datos: object) =>
      frame.current?.contentWindow?.postMessage(
        { origen: "tori-landing-editor", ...datos },
        window.location.origin,
      ),
    [],
  );
  const aplicarEstado = useCallback((data: Estado) => {
    setError("");
    setEstado(data);
    setDocumento(data.borrador.documento);
    setGuardado(JSON.stringify(data.borrador.documento));
    setUndo([]);
    setRedo([]);
  }, []);
  const cargar = useCallback(async () => {
    try {
      aplicarEstado(await api<Estado>("/api/admin/landing"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [aplicarEstado]);
  useEffect(() => {
    let activo = true;
    api<Estado>("/api/admin/landing")
      .then((data) => {
        if (activo) aplicarEstado(data);
      })
      .catch((e) => {
        if (activo) setError((e as Error).message);
      });
    return () => {
      activo = false;
    };
  }, [aplicarEstado]);
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const salir = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", salir);
    return () => window.removeEventListener("beforeunload", salir);
  }, [dirty]);
  useEffect(() => {
    enviar({ tipo: "documento", documento, seleccionar });
  }, [documento, seleccionar, enviar]);
  useEffect(() => {
    const recibir = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.origen !== "tori-landing-preview"
      )
        return;
      const d = event.data;
      if (d.tipo === "listo")
        enviar({ tipo: "documento", documento, seleccionar });
      if (d.tipo === "campos") {
        setCamposVivos(d.campos);
        setEnlacesVivos(d.enlaces);
      }
      if (d.tipo === "seleccion") {
        if (d.seccion) setSeccionId(d.seccion);
        if (d.key) setSeleccion({ key: d.key, original: d.original });
        setPanel("contenido");
      }
    };
    window.addEventListener("message", recibir);
    return () => window.removeEventListener("message", recibir);
  }, [documento, seleccionar, enviar]);
  useEffect(() => {
    if (!contenedor.current) return;
    const obs = new ResizeObserver((entries) =>
      setEscala(Math.min(1, entries[0].contentRect.width / ancho)),
    );
    obs.observe(contenedor.current);
    return () => obs.disconnect();
  }, [ancho, estado]);
  const cambiar = (fn: (d: DocumentoLanding) => DocumentoLanding) => {
    setUndo([...undo.slice(-49), documento]);
    setRedo([]);
    setDocumento(fn(documento));
    setMensaje("");
  };
  const cambiarSeccion = (id: string, patch: Partial<SeccionLanding>) =>
    cambiar((d) => ({
      ...d,
      secciones: d.secciones.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  const seleccionarSeccion = (id: string) => {
    setSeccionId(id);
    setSeleccion(null);
    enviar({ tipo: "seccion", id });
  };
  const campos = useMemo(() => {
    const defaults = (catalogo as Record<string, string[]>)[seccionId] ?? [];
    const todos = [
      ...defaults.map((original) => ({
        key: `${seccionId}:${claveTexto(original)}`,
        original,
      })),
      ...camposVivos.filter((c) => c.key.startsWith(`${seccionId}:`)),
    ];
    return [...new Map(todos.map((c) => [c.key, c])).values()].filter((c) =>
      `${c.original} ${documento.textos[c.key]?.texto ?? ""}`
        .toLowerCase()
        .includes(busqueda.toLowerCase()),
    );
  }, [camposVivos, seccionId, busqueda, documento.textos]);
  const guardar = async (publicar: boolean) => {
    if (!estado) return;
    if (
      publicar &&
      !window.confirm(
        "¿Publicar esta versión? Los visitantes verán estos cambios en la landing.",
      )
    )
      return;
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      let draft = estado.borrador;
      if (dirty || !draft.revision) {
        const r = await api<{ version: Version }>("/api/admin/landing", {
          method: "POST",
          json: { accion: "borrador", revision: draft.revision, documento },
        });
        draft = r.version;
        setEstado((prev) => (prev ? { ...prev, borrador: draft } : prev));
        setGuardado(JSON.stringify(documento));
      }
      if (publicar) {
        const r = await api<{ version: Version }>("/api/admin/landing", {
          method: "POST",
          json: {
            accion: "publicar",
            revision: estado.publicado.revision,
            documento,
          },
        });
        setEstado((prev) =>
          prev
            ? {
                ...prev,
                borrador: draft,
                publicado: r.version,
                historial: [
                  { revision: r.version.revision, fecha: r.version.fecha! },
                  ...prev.historial,
                ].slice(0, 20),
              }
            : prev,
        );
      }
      setMensaje(
        publicar
          ? "Landing publicada. Los cambios ya están disponibles para los visitantes."
          : "Borrador guardado. La landing pública sigue igual.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };
  const subir = async (file?: File) => {
    if (!file) return;
    setOcupado(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await api<{ url: string }>("/api/admin/landing/imagen", {
        method: "POST",
        body: form,
      });
      cambiarSeccion(seccionId, { imagen: r.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };
  const restaurar = async (revision: number) => {
    setOcupado(true);
    setError("");
    try {
      const version = await api<Version>(
        `/api/admin/landing?revision=${revision}`,
      );
      cambiar(() => version.documento);
      setMensaje(
        `Versión ${revision} cargada como borrador. Revisa la vista previa y publica cuando esté lista.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };
  if (!estado)
    return (
      <div className="rounded-2xl border bg-white p-8">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className={boton} onClick={() => void cargar()}>
              Reintentar
            </button>
          </>
        ) : (
          "Cargando editor de la landing…"
        )}
      </div>
    );
  const textoSeleccionado = seleccion
    ? (documento.textos[seleccion.key] ?? { texto: seleccion.original })
    : null;
  const actualizarTexto = (patch: Partial<TextoLanding>) => {
    if (!seleccion) return;
    cambiar((d) => ({
      ...d,
      textos: {
        ...d.textos,
        [seleccion.key]: {
          ...(d.textos[seleccion.key] ?? { texto: seleccion.original }),
          ...patch,
        },
      },
    }));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Editor visual de la landing
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {dirty ? "Hay cambios sin guardar" : "Borrador guardado"} ·
            Publicación {estado.publicado.revision || "original"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={boton}
            title="Deshacer"
            disabled={!undo.length || ocupado}
            onClick={() => {
              const prev = undo.at(-1);
              if (prev) {
                setUndo(undo.slice(0, -1));
                setRedo([...redo, documento]);
                setDocumento(prev);
              }
            }}
          >
            <Undo2 size={16} />
          </button>
          <button
            className={boton}
            title="Rehacer"
            disabled={!redo.length || ocupado}
            onClick={() => {
              const next = redo.at(-1);
              if (next) {
                setRedo(redo.slice(0, -1));
                setUndo([...undo, documento]);
                setDocumento(next);
              }
            }}
          >
            <Redo2 size={16} />
          </button>
          <button
            className={boton}
            disabled={ocupado}
            onClick={() => void guardar(false)}
          >
            <Save size={15} />
            Guardar borrador
          </button>
          <button
            className={`${boton} !border-sky-600 !bg-sky-600 !text-white`}
            disabled={ocupado}
            onClick={() => void guardar(true)}
          >
            <Upload size={15} />
            Publicar cambios
          </button>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {mensaje && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {mensaje}
        </p>
      )}
      <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="max-h-[900px] overflow-auto rounded-2xl border border-slate-200 bg-white">
          <div className="sticky top-0 z-10 flex border-b bg-white p-2">
            {(["secciones", "contenido", "publicacion"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPanel(p)}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold ${panel === p ? "bg-sky-50 text-sky-700" : "text-slate-500"}`}
              >
                {p === "publicacion"
                  ? "Historial y SEO"
                  : p === "contenido"
                    ? "Contenido"
                    : "Secciones"}
              </button>
            ))}
          </div>
          {panel === "secciones" && (
            <div className="space-y-2 p-3">
              <p className="px-1 pb-2 text-xs text-slate-500">
                Selecciona una sección o toca un texto en la vista previa.
              </p>
              {documento.secciones
                .filter((s) => !s.eliminada)
                .map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-3 ${s.id === seccionId ? "border-sky-400 bg-sky-50/60" : "border-slate-200"}`}
                  >
                    <button
                      className="w-full text-left text-sm font-semibold text-slate-800"
                      onClick={() => seleccionarSeccion(s.id)}
                    >
                      {s.nombre}
                      {!s.visible && (
                        <span className="ml-2 text-xs text-slate-400">
                          Oculta
                        </span>
                      )}
                    </button>
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        className={boton}
                        title={
                          s.visible
                            ? `Ocultar ${s.nombre}`
                            : `Mostrar ${s.nombre}`
                        }
                        onClick={() =>
                          cambiarSeccion(s.id, { visible: !s.visible })
                        }
                      >
                        {s.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      {[-1, 1].map((dir) => (
                        <button
                          key={dir}
                          className={boton}
                          title={`${dir < 0 ? "Subir" : "Bajar"} ${s.nombre}`}
                          disabled={
                            documento.secciones.indexOf(s) + dir < 0 ||
                            documento.secciones.indexOf(s) + dir >=
                              documento.secciones.length
                          }
                          onClick={() =>
                            cambiar((d) => {
                              const lista = [...d.secciones];
                              const i = lista.findIndex((x) => x.id === s.id);
                              [lista[i], lista[i + dir]] = [
                                lista[i + dir],
                                lista[i],
                              ];
                              return { ...d, secciones: lista };
                            })
                          }
                        >
                          {dir < 0 ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </button>
                      ))}
                      <button
                        className={boton}
                        title={`Eliminar ${s.nombre}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Eliminar «${s.nombre}» de la landing? Podrás recuperarla desde la papelera.`,
                            )
                          )
                            cambiarSeccion(s.id, { eliminada: true });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        className={`${boton} ml-auto`}
                        onClick={() => {
                          seleccionarSeccion(s.id);
                          setPanel("contenido");
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              <button
                className={`${boton} w-full`}
                onClick={() => {
                  const id = `custom-${crypto.randomUUID()}`;
                  cambiar((d) => ({
                    ...d,
                    secciones: [
                      ...d.secciones.slice(0, -2),
                      {
                        id,
                        nombre: "Nueva sección",
                        visible: true,
                        eliminada: false,
                        titulo: "Tu nuevo título",
                        descripcion:
                          "Escribe aquí el contenido de esta sección.",
                      },
                      ...d.secciones.slice(-2),
                    ],
                  }));
                  setSeccionId(id);
                  setSeleccion(null);
                  setPanel("contenido");
                }}
              >
                <Plus size={16} />
                Agregar sección
              </button>
              {documento.secciones.some((s) => s.eliminada) && (
                <div className="border-t pt-3">
                  <h3 className="mb-2 text-xs font-bold text-slate-500">
                    Papelera
                  </h3>
                  {documento.secciones
                    .filter((s) => s.eliminada)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="mb-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <span>{s.nombre}</span>
                        <button
                          className={boton}
                          onClick={() =>
                            cambiarSeccion(s.id, {
                              eliminada: false,
                              visible: true,
                            })
                          }
                        >
                          Restaurar
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          {panel === "contenido" && (
            <div className="space-y-4 p-4">
              <label className="block text-xs font-semibold">
                Sección
                <select
                  className={`${input} mt-1`}
                  value={seccionId}
                  onChange={(e) => seleccionarSeccion(e.target.value)}
                >
                  {documento.secciones.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                      {s.eliminada
                        ? " (eliminada)"
                        : !s.visible
                          ? " (oculta)"
                          : ""}
                    </option>
                  ))}
                </select>
              </label>
              {(!seccion.visible || seccion.eliminada) && (
                <button
                  className={boton}
                  onClick={() =>
                    cambiarSeccion(seccionId, {
                      visible: true,
                      eliminada: false,
                    })
                  }
                >
                  Mostrar sección en la vista previa
                </button>
              )}
              <label className="block text-xs font-semibold">
                Nombre de la sección
                <input
                  className={`${input} mt-1`}
                  value={seccion.nombre}
                  onChange={(e) =>
                    cambiarSeccion(seccionId, { nombre: e.target.value })
                  }
                />
              </label>
              {esCustom ? (
                <>
                  {(["titulo", "descripcion", "boton", "enlace"] as const).map(
                    (k) => (
                      <label key={k} className="block text-xs font-semibold">
                        {
                          {
                            titulo: "Título",
                            descripcion: "Descripción",
                            boton: "Texto del botón",
                            enlace: "Enlace del botón",
                          }[k]
                        }
                        <textarea
                          className={`${input} mt-1`}
                          value={seccion[k] ?? ""}
                          onChange={(e) =>
                            cambiarSeccion(seccionId, { [k]: e.target.value })
                          }
                        />
                      </label>
                    ),
                  )}
                </>
              ) : (
                <>
                  <input
                    aria-label="Buscar texto de la sección"
                    placeholder="Buscar texto…"
                    className={input}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  <div className="max-h-44 space-y-1 overflow-auto">
                    {campos.map((c) => (
                      <button
                        key={c.key}
                        className={`w-full rounded-lg p-2 text-left text-xs ${seleccion?.key === c.key ? "bg-sky-100 text-sky-800" : "bg-slate-50 text-slate-600"}`}
                        onClick={() => setSeleccion(c)}
                      >
                        {(documento.textos[c.key]?.texto ?? c.original).slice(
                          0,
                          140,
                        ) || "(texto vacío)"}
                      </button>
                    ))}
                  </div>
                  {seleccion && textoSeleccionado && (
                    <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/50 p-3">
                      <label className="block text-xs font-bold">
                        Texto seleccionado
                        <textarea
                          aria-label="Texto seleccionado"
                          className={`${input} mt-2 min-h-32`}
                          value={textoSeleccionado.texto}
                          onChange={(e) =>
                            actualizarTexto({ texto: e.target.value })
                          }
                        />
                      </label>
                      <div className="flex gap-3">
                        <label className="text-xs">
                          Color
                          <input
                            aria-label="Color del texto"
                            type="color"
                            className="mt-1 block h-9 w-12"
                            value={textoSeleccionado.color ?? "#0f172a"}
                            onChange={(e) =>
                              actualizarTexto({ color: e.target.value })
                            }
                          />
                        </label>
                        <label className="flex-1 text-xs">
                          Tamaño (px)
                          <input
                            aria-label="Tamaño del texto"
                            type="number"
                            min={8}
                            max={100}
                            className={`${input} mt-1`}
                            value={textoSeleccionado.tamano ?? ""}
                            placeholder="Original"
                            onChange={(e) =>
                              actualizarTexto({
                                tamano: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              })
                            }
                          />
                        </label>
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={textoSeleccionado.negrita ?? false}
                          onChange={(e) =>
                            actualizarTexto({ negrita: e.target.checked })
                          }
                        />
                        Negrita
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={textoSeleccionado.oculto ?? false}
                          onChange={(e) =>
                            actualizarTexto({ oculto: e.target.checked })
                          }
                        />
                        Ocultar este texto
                      </label>
                      <button
                        className={boton}
                        onClick={() =>
                          cambiar((d) => {
                            const textos = { ...d.textos };
                            delete textos[seleccion.key];
                            return { ...d, textos };
                          })
                        }
                      >
                        Restaurar texto y estilo original
                      </button>
                    </div>
                  )}
                </>
              )}
              {[
                ...new Map(
                  enlacesVivos
                    .filter((c) => c.key.startsWith(`${seccionId}:`))
                    .map((c) => [c.key, c]),
                ).values(),
              ].map((c) => (
                <label key={c.key} className="block text-xs font-semibold">
                  Enlace: {c.original}
                  <input
                    aria-label={`Enlace ${c.original}`}
                    className={`${input} mt-1`}
                    value={documento.enlaces[c.key] ?? c.original}
                    onChange={(e) =>
                      cambiar((d) => ({
                        ...d,
                        enlaces: { ...d.enlaces, [c.key]: e.target.value },
                      }))
                    }
                  />
                </label>
              ))}
              <div className="border-t pt-4">
                <label className="block text-xs font-semibold">
                  {["navegacion", "pie"].includes(seccionId)
                    ? "Logo"
                    : "Imagen de portada de la sección"}
                  <input
                    aria-label="URL de imagen"
                    placeholder="https://…"
                    className={`${input} mt-1`}
                    value={seccion.imagen ?? ""}
                    onChange={(e) =>
                      cambiarSeccion(seccionId, { imagen: e.target.value })
                    }
                  />
                </label>
                <label className={`${boton} mt-2 w-full cursor-pointer`}>
                  <ImagePlus size={16} />
                  Subir imagen
                  <input
                    aria-label="Subir imagen de la sección"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={ocupado}
                    onChange={(e) => void subir(e.target.files?.[0])}
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">
                  JPG, PNG o WebP, hasta 2 MB.
                </p>
                <label className="mt-3 block text-xs">
                  Descripción de la imagen
                  <input
                    className={`${input} mt-1`}
                    value={seccion.imagenAlt ?? ""}
                    onChange={(e) =>
                      cambiarSeccion(seccionId, { imagenAlt: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="flex items-center justify-between text-xs font-semibold">
                Color de fondo
                <input
                  aria-label="Color de fondo"
                  type="color"
                  value={seccion.fondo ?? "#ffffff"}
                  onChange={(e) =>
                    cambiarSeccion(seccionId, { fondo: e.target.value })
                  }
                />
              </label>
              {seccion.fondo && (
                <button
                  className={boton}
                  onClick={() =>
                    cambiarSeccion(seccionId, { fondo: undefined })
                  }
                >
                  Restaurar fondo original
                </button>
              )}
              {seccionId === "precios" && (
                <p className="text-xs text-slate-500">
                  Los importes de Plus corresponden al precio de contratación
                  vigente. Puedes editar los textos y la presentación de esta
                  sección.
                </p>
              )}
            </div>
          )}
          {panel === "publicacion" && (
            <div className="space-y-4 p-4">
              <h3 className="text-sm font-bold">Cómo aparece en buscadores</h3>
              <label className="block text-xs font-semibold">
                Título SEO
                <input
                  className={`${input} mt-1`}
                  maxLength={180}
                  value={documento.seo.titulo}
                  onChange={(e) =>
                    cambiar((d) => ({
                      ...d,
                      seo: { ...d.seo, titulo: e.target.value },
                    }))
                  }
                />
              </label>
              <label className="block text-xs font-semibold">
                Descripción SEO
                <textarea
                  className={`${input} mt-1`}
                  maxLength={500}
                  value={documento.seo.descripcion}
                  onChange={(e) =>
                    cambiar((d) => ({
                      ...d,
                      seo: { ...d.seo, descripcion: e.target.value },
                    }))
                  }
                />
              </label>
              <div className="border-t pt-4">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <History size={16} />
                  Publicaciones anteriores
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  Recuperar una versión la carga en el editor. No se publica
                  hasta que tú lo confirmes.
                </p>
                {estado.historial.map((v) => (
                  <div
                    key={v.revision}
                    className="mt-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <span>
                      Versión {v.revision}
                      <small className="block text-slate-400">
                        {new Date(v.fecha).toLocaleString("es-PE", {
                          timeZone: "America/Lima",
                        })}
                      </small>
                    </span>
                    <button
                      className={boton}
                      disabled={ocupado}
                      onClick={() => void restaurar(v.revision)}
                    >
                      Recuperar
                    </button>
                  </div>
                ))}
              </div>
              <button
                className={`${boton} w-full`}
                onClick={() => {
                  if (
                    window.confirm(
                      "¿Cargar la landing original en el editor? Podrás deshacer este cambio.",
                    )
                  )
                    cambiar(() => landingInicial());
                }}
              >
                Restaurar landing original
              </button>
              <button
                className={`${boton} w-full`}
                onClick={() => {
                  if (
                    !dirty ||
                    window.confirm(
                      "¿Descartar los cambios locales y recargar el último borrador guardado?",
                    )
                  )
                    void cargar();
                }}
              >
                Recargar borrador guardado
              </button>
            </div>
          )}
        </aside>
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-100 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              <button
                className={boton}
                title="Vista de escritorio"
                onClick={() => setAncho(1100)}
              >
                <Monitor size={16} />
              </button>
              <button
                className={boton}
                title="Vista de celular"
                onClick={() => setAncho(390)}
              >
                <Smartphone size={16} />
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={seleccionar}
                onChange={(e) => setSeleccionar(e.target.checked)}
              />
              Seleccionar textos
            </label>
            <span className="text-xs text-slate-500">
              Vista previa del borrador
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            {seleccionar
              ? "Haz clic en un texto para editarlo. Desactiva «Seleccionar textos» para probar las demostraciones y preguntas frecuentes."
              : "Modo de interacción: prueba los botones y demostraciones. Activa «Seleccionar textos» para volver a editar."}
          </p>
          <div
            ref={contenedor}
            className="overflow-hidden rounded-xl bg-white"
            style={{ height: 900 * escala }}
          >
            <iframe
              ref={frame}
              src="/admin/landing/preview"
              title="Vista previa editable de la landing"
              onLoad={() =>
                enviar({ tipo: "documento", documento, seleccionar })
              }
              style={{
                width: ancho,
                height: 900,
                border: 0,
                transform: `scale(${escala})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
