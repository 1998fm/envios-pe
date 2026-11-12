"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/clienteApi";
import PrecioInput from "./PrecioInput";
import { comprimirImagen } from "@/lib/comprimirImagen";
import type { Producto } from "@/types/inventario";
import type { FichaFamilia, ResumenFamilia } from "@/types/productosFamilias";
import { Plus, X, Boxes, ImagePlus, Layers, Search } from "lucide-react";

type Fila = {
  producto_id?: string;
  opciones: Record<string, string>;
  sku: string;
  nombre: string;
  descripcion: string;
  precio_venta: number;
  precio_compra?: number;
  stock_actual: number;
  stock_original?: number;
  stock_minimo: number;
  imagen_url: string | null;
  archivado: boolean;
  precio_especial: boolean;
  nombre_especial: boolean;
  descripcion_especial: boolean;
  imagen_especial: boolean;
  motivo: string;
};
type Datos = {
  nombre: string;
  descripcion: string;
  precio_base: number;
  imagen_url: string | null;
  unidad: string;
  opciones: string[];
};
const campos =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800";
const boton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50";
const precio = (n: number) => `S/ ${Number(n).toFixed(2)}`;
const inicial = (): Datos => ({
  nombre: "",
  descripcion: "",
  precio_base: 0,
  imagen_url: null,
  unidad: "unidad",
  opciones: ["Color"],
});
const fila = (opciones: string[]): Fila => ({
  opciones: Object.fromEntries(opciones.map((o) => [o, ""])),
  sku: "",
  nombre: "",
  descripcion: "",
  precio_venta: 0,
  precio_compra: 0,
  stock_actual: 0,
  stock_minimo: 0,
  imagen_url: null,
  archivado: false,
  precio_especial: false,
  nombre_especial: false,
  descripcion_especial: false,
  imagen_especial: false,
  motivo: "",
});
export default function CatalogoVariantes({
  verCosto,
  enModal = false,
  onIndividual,
  onEditar,
  onNuevoIndividual,
  iniciarCreacion = false,
  onConsumirCreacion,
}: {
  verCosto: boolean;
  enModal?: boolean;
  onIndividual: () => void;
  onEditar: (p: Producto) => void;
  onNuevoIndividual: () => void;
  iniciarCreacion?: boolean;
  onConsumirCreacion: () => void;
}) {
  const [grupos, setGrupos] = useState<ResumenFamilia[]>([]),
    [individuales, setIndividuales] = useState<Producto[]>([]),
    [total, setTotal] = useState(0),
    [totalIndividual, setTotalIndividual] = useState(0);
  const [busqueda, setBusqueda] = useState(""),
    [pagina, setPagina] = useState(0),
    [revision, setRevision] = useState(0),
    [cargando, setCargando] = useState(true);
  const [modo, setModo] = useState<"crear" | "agrupar" | "editar" | null>(
      iniciarCreacion ? "crear" : null,
    ),
    [datos, setDatos] = useState<Datos>(inicial),
    [filas, setFilas] = useState<Fila[]>([]),
    [original, setOriginal] = useState<FichaFamilia | null>(null);
  const [ocupado, setOcupado] = useState(false),
    [error, setError] = useState(""),
    [aviso, setAviso] = useState(""),
    [candidatos, setCandidatos] = useState<Producto[]>([]),
    [buscarExistentes, setBuscarExistentes] = useState(""),
    [paginaExistentes, setPaginaExistentes] = useState(0),
    [totalExistentes, setTotalExistentes] = useState(0),
    [archivados, setArchivados] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>({}),
    [dirty, setDirty] = useState(false);
  const dialogo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!modo && !enModal) return;
    const anterior = document.activeElement as HTMLElement | null;
    dialogo.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      anterior?.focus();
    };
  }, [modo, enModal]);
  const uploads = useRef(new Set<string>()),
    guardando = useRef(false);
  const refrescar = () => setRevision((r) => r + 1);
  useEffect(() => {
    if (iniciarCreacion) onConsumirCreacion();
  }, [iniciarCreacion, onConsumirCreacion]);
  useEffect(() => {
    const ctl = new AbortController();
    const timer = setTimeout(() => {
      Promise.all([
        api<{ data: ResumenFamilia[]; total: number }>(
          `/api/productos/familias?offset=${pagina * 30}&busqueda=${encodeURIComponent(busqueda)}`,
          { signal: ctl.signal },
        ),
        api<{ data: Producto[]; total: number }>(
          `/api/productos?catalogo=1&offset=${pagina * 30}&limit=30&busqueda=${encodeURIComponent(busqueda)}`,
          { signal: ctl.signal },
        ),
      ])
        .then(([f, p]) => {
          setGrupos(f.data);
          setTotal(f.total);
          setIndividuales(p.data);
          setTotalIndividual(p.total);
          setCargando(false);
        })
        .catch((e) => {
          if (!ctl.signal.aborted) {
            setError(e.message);
            setCargando(false);
          }
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [pagina, busqueda, revision]);
  useEffect(() => {
    if (modo !== "agrupar") return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      api<{ data: Producto[]; total: number }>(
        `/api/productos?catalogo=1&limit=20&offset=${paginaExistentes * 20}&archivado=${archivados}&busqueda=${encodeURIComponent(buscarExistentes)}`,
        { signal: ctl.signal },
      )
        .then((r) => {
          setCandidatos(r.data);
          setTotalExistentes(r.total);
        })
        .catch((e) => {
          if (!ctl.signal.aborted) setError(e.message);
        });
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [modo, buscarExistentes, paginaExistentes, archivados]);
  useEffect(() => {
    if (!modo || !dirty) return;
    const salir = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", salir);
    return () => window.removeEventListener("beforeunload", salir);
  }, [modo, dirty]);
  const cambiarDatos = (patch: Partial<Datos>) => {
    setDatos((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const cambiarFila = (i: number, patch: Partial<Fila>) => {
    setFilas((v) => v.map((f, k) => (k === i ? { ...f, ...patch } : f)));
    setDirty(true);
  };
  function nuevo(tipo: "crear" | "agrupar") {
    setModo(tipo);
    setDatos(inicial());
    setFilas([]);
    setOriginal(null);
    setValores({});
    setError("");
    setDirty(false);
  }
  async function abrir(id: string) {
    setOcupado(true);
    setError("");
    try {
      const f = await api<FichaFamilia>(`/api/productos/familias?id=${id}`);
      setOriginal(f);
      setDatos({ ...f.familia, descripcion: f.familia.descripcion ?? "" });
      setFilas(
        f.variantes.map((v) => ({
          ...v,
          sku: v.producto.sku ?? "",
          nombre: v.producto.nombre,
          descripcion: v.producto.descripcion ?? "",
          precio_venta: Number(v.producto.precio_venta),
          ...(verCosto
            ? { precio_compra: Number(v.producto.precio_compra) }
            : {}),
          stock_actual: v.producto.stock_actual,
          stock_original: v.producto.stock_actual,
          stock_minimo: v.producto.stock_minimo,
          imagen_url: v.producto.imagen_url ?? null,
          archivado: !!v.producto.archivado,
          motivo: "",
        })),
      );
      setModo("editar");
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  async function cerrar() {
    if (ocupado) return;
    if (dirty && !window.confirm("¿Cerrar sin guardar los cambios?")) return;
    setModo(null);
    if (enModal && iniciarCreacion) onIndividual();
    setDirty(false);
    const rutas = [...uploads.current];
    uploads.current.clear();
    await Promise.allSettled(
      rutas.map((r) =>
        api(`/api/uploads/producto?ruta=${encodeURIComponent(r)}`, {
          method: "DELETE",
        }),
      ),
    );
  }
  async function foto(file: File | undefined, i?: number) {
    if (!file) return;
    setOcupado(true);
    setError("");
    try {
      const f = await comprimirImagen(file);
      const form = new FormData();
      form.append("file", f, "producto.jpg");
      const r = await api<{ url: string; ruta: string }>(
        "/api/uploads/producto",
        { method: "POST", body: form },
      );
      uploads.current.add(r.ruta);
      if (i === undefined) cambiarDatos({ imagen_url: r.url });
      else cambiarFila(i, { imagen_url: r.url, imagen_especial: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  function elegir(p: Producto) {
    if (filas.some((v) => v.producto_id === p.id)) {
      setFilas((v) => v.filter((f) => f.producto_id !== p.id));
      setDirty(true);
      return;
    }
    setFilas((v) => [
      ...v,
      {
        ...fila(datos.opciones),
        producto_id: p.id,
        opciones: Object.fromEntries(
          datos.opciones.map((o, i) => [o, i === 0 ? p.nombre : ""]),
        ),
        nombre: p.nombre,
        descripcion: p.descripcion ?? "",
        precio_venta: Number(p.precio_venta),
        ...(verCosto ? { precio_compra: p.precio_compra } : {}),
        sku: p.sku ?? "",
        stock_actual: p.stock_actual,
        stock_original: p.stock_actual,
        stock_minimo: p.stock_minimo,
        imagen_url: p.imagen_url ?? null,
        archivado: !!p.archivado,
        precio_especial: true,
        nombre_especial: true,
        descripcion_especial: true,
        imagen_especial: true,
      },
    ]);
    setDirty(true);
  }
  function generar() {
    let combos: Record<string, string>[] = [{}];
    for (const o of datos.opciones) {
      const list = [
        ...new Set(
          (valores[o] ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ];
      if (!list.length) {
        setError(`Escribe los valores de ${o}, separados por comas`);
        return;
      }
      combos = combos.flatMap((c) =>
        list.map((value) => ({ ...c, [o]: value })),
      );
      if (combos.length > 200) {
        setError("Máximo 200 combinaciones");
        return;
      }
    }
    const nuevos = combos.filter(
      (c) =>
        !filas.some((f) => datos.opciones.every((o) => f.opciones[o] === c[o])),
    );
    if (filas.length + nuevos.length > 200) {
      setError("Máximo 200 variantes");
      return;
    }
    setFilas((v) => [
      ...v,
      ...nuevos.map((c) => ({ ...fila(datos.opciones), opciones: c })),
    ]);
    setDirty(true);
    setError("");
  }
  function payload() {
    return filas.map((f) => {
      if (modo === "agrupar")
        return { producto_id: f.producto_id, opciones: f.opciones };
      const prev = original?.variantes.find(
        (v) => v.producto_id === f.producto_id,
      );
      const r: Record<string, unknown> = {
        producto_id: f.producto_id,
        opciones: f.opciones,
        precio_especial: f.precio_especial,
        nombre_especial: f.nombre_especial,
        descripcion_especial: f.descripcion_especial,
        imagen_especial: f.imagen_especial,
        sku: f.sku,
        precio_venta: f.precio_especial ? f.precio_venta : datos.precio_base,
        stock_minimo: f.stock_minimo,
        archivado: f.archivado,
      };
      if (!f.producto_id) {
        r.stock_actual = f.stock_actual;
        if (verCosto) r.precio_compra = f.precio_compra ?? 0;
        if (f.imagen_especial) r.imagen_url = f.imagen_url;
        return r;
      }
      if (prev && f.stock_actual !== prev.producto.stock_actual) {
        r.stock_actual = f.stock_actual;
        r.stock_esperado = f.stock_original;
        r.motivo = f.motivo;
      }
      if (verCosto && Number(prev?.producto.precio_compra) !== f.precio_compra)
        r.precio_compra = f.precio_compra;
      if (f.nombre_especial) r.nombre = f.nombre;
      if (f.descripcion_especial) r.descripcion = f.descripcion;
      if (f.imagen_especial) r.imagen_url = f.imagen_url;
      return r;
    });
  }
  async function guardar() {
    if (guardando.current) return;
    guardando.current = true;
    setOcupado(true);
    setError("");
    try {
      if (
        modo === "agrupar" &&
        !window.confirm(
          "¿Agrupar los productos seleccionados? Se conservarán sus datos, stock e históricos.",
        )
      )
        return;
      const r = await api<{ id: string }>("/api/productos/familias", {
        method: "POST",
        json: {
          accion: modo === "editar" ? "guardar" : modo,
          id: original?.familia.id,
          esperado: original?.familia.updated_at,
          datos,
          variantes: payload(),
        },
      });
      uploads.current.clear();
      setDirty(false);
      setModo(null);
      setAviso(
        modo === "agrupar"
          ? "Productos agrupados. Sus datos e históricos se conservaron."
          : "Producto y variantes guardados.",
      );
      refrescar();
      await abrir(r.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
      guardando.current = false;
    }
  }
  async function separar(id?: string) {
    if (
      !original ||
      !window.confirm(
        id
          ? "¿Separar esta variante? Seguirá existiendo como producto individual, con todos sus datos."
          : "¿Deshacer la agrupación? Se conservarán todos los productos, precios, existencias e históricos.",
      )
    )
      return;
    setOcupado(true);
    setError("");
    try {
      await api("/api/productos/familias", {
        method: "POST",
        json: {
          accion: id ? "desvincular" : "disolver",
          id: original.familia.id,
          esperado: original.familia.updated_at,
          variantes: id ? [{ producto_id: id }] : [],
        },
      });
      refrescar();
      if (id) await abrir(original.familia.id);
      else {
        setModo(null);
        setDirty(false);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <div
      ref={!modo ? dialogo : undefined}
      role={enModal && !modo ? "dialog" : undefined}
      aria-modal={enModal && !modo ? true : undefined}
      aria-label={enModal && !modo ? "Variantes de productos" : undefined}
      onKeyDown={(e) => {
        if (!modo && e.key === "Escape") {
          e.stopPropagation();
          onIndividual();
        }
      }}
      className={
        enModal && !modo
          ? "fixed inset-0 z-50 overflow-auto bg-slate-900/50 p-2 sm:p-6"
          : "space-y-5"
      }
    >
      <div
        className={
          enModal && !modo
            ? "mx-auto max-w-6xl space-y-5 rounded-[28px] bg-white p-4 shadow-xl sm:p-6"
            : "contents"
        }
      >
        {(!enModal || !modo) && (
          <>
            <header className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-slate-800">
              <h2 className="text-xl font-black">Variantes de productos</h2>
              <p className="mt-2 text-sm text-slate-500">
                Una ficha para cada producto. Cada variante conserva su SKU,
                stock y movimientos.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button className={boton} onClick={() => nuevo("crear")}>
                  <Plus size={16} />
                  Nuevo producto con variantes
                </button>
                <button className={boton} onClick={onNuevoIndividual}>
                  Nuevo producto individual
                </button>
                <button className={boton} onClick={() => nuevo("agrupar")}>
                  <Layers size={16} />
                  Agrupar existentes
                </button>
                <button className={boton} onClick={onIndividual}>
                  Cerrar variantes
                </button>
              </div>
            </header>
            {error && !modo && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            {aviso && (
              <p
                role="status"
                className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"
              >
                {aviso}
              </p>
            )}
            <label className="flex items-center gap-2 rounded-xl border bg-white px-3">
              <Search size={17} />
              <input
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder="Buscar producto principal o individual…"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(0);
                }}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {grupos.map((g) => (
                <button
                  key={g.id}
                  onClick={() => void abrir(g.id)}
                  disabled={ocupado}
                  className="rounded-2xl border border-sky-100 bg-white p-5 text-left shadow-sm hover:border-sky-400"
                >
                  <div className="flex items-center gap-3">
                    <Boxes className="text-sky-600" />
                    <div>
                      <h3 className="font-bold text-slate-900">{g.nombre}</h3>
                      <p className="text-xs text-slate-500">
                        {g.cantidad} variantes · {g.stock} unidades
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 font-semibold text-sky-700">
                    {g.desde === g.hasta
                      ? precio(g.desde)
                      : `${precio(g.desde)} – ${precio(g.hasta)}`}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Editar ficha y variantes
                  </p>
                </button>
              ))}
            </div>
            <section className="overflow-hidden rounded-2xl border bg-white">
              <h3 className="border-b p-4 text-sm font-bold text-slate-800">
                Productos individuales ({totalIndividual})
              </h3>
              {individuales.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{p.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {p.sku || "Sin SKU"} · Stock {p.stock_actual} ·{" "}
                      {precio(p.precio_venta)}
                    </p>
                  </div>
                  <button className={boton} onClick={() => onEditar(p)}>
                    Editar
                  </button>
                </div>
              ))}
              {!cargando && !individuales.length && (
                <p className="p-4 text-sm text-slate-400">
                  Sin productos individuales en esta búsqueda.
                </p>
              )}
            </section>
            {!grupos.length && !individuales.length && cargando && (
              <p className="text-sm text-slate-500">Cargando catálogo…</p>
            )}
            <div className="flex items-center justify-between">
              <button
                className={boton}
                disabled={!pagina}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </button>
              <span className="text-xs text-slate-500">
                Página {pagina + 1} · {total} fichas con variantes
              </span>
              <button
                className={boton}
                disabled={(pagina + 1) * 30 >= Math.max(total, totalIndividual)}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          </>
        )}
        {modo && (
          <div
            className="fixed inset-0 z-50 overflow-auto bg-slate-900/50 p-2 sm:p-6"
            ref={dialogo}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                void cerrar();
              }
              if (e.key !== "Tab") return;
              const elementos = [
                ...e.currentTarget.querySelectorAll<HTMLElement>(
                  'button:not(:disabled), input:not(:disabled):not([type="file"]), textarea:not(:disabled), select:not(:disabled)',
                ),
              ].filter((el) => el.getClientRects().length);
              const primero = elementos[0],
                ultimo = elementos.at(-1);
              if (e.shiftKey && document.activeElement === primero) {
                e.preventDefault();
                ultimo?.focus();
              } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault();
                primero?.focus();
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-label={
              modo === "agrupar"
                ? "Agrupar productos existentes"
                : "Ficha de producto con variantes"
            }
          >
            <div className="mx-auto max-w-6xl rounded-2xl bg-white shadow-xl">
              <header className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b bg-white p-5">
                <div>
                  <h3 className="text-lg font-bold">
                    {modo === "agrupar"
                      ? "Agrupar productos existentes"
                      : modo === "crear"
                        ? "Nuevo producto con variantes"
                        : "Editar producto y variantes"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Los cambios de catálogo no modifican compras ni ventas
                    anteriores.
                  </p>
                </div>
                <button
                  aria-label="Cerrar ficha"
                  className={boton}
                  disabled={ocupado}
                  onClick={() => void cerrar()}
                >
                  <X size={18} />
                </button>
              </header>
              <fieldset
                disabled={ocupado}
                className="min-w-0 space-y-5 p-4 sm:p-6"
              >
                {aviso && (
                  <p
                    role="status"
                    className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"
                  >
                    {aviso}
                  </p>
                )}
                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}
                {modo === "agrupar" && (
                  <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold">
                      Selecciona voluntariamente los productos. Agrupar no
                      cambia nombres, precios, stock, costos, fotos ni
                      históricos.
                    </p>
                    <input
                      className={campos}
                      aria-label="Buscar productos para agrupar"
                      placeholder="Buscar productos existentes…"
                      value={buscarExistentes}
                      onChange={(e) => {
                        setBuscarExistentes(e.target.value);
                        setPaginaExistentes(0);
                      }}
                    />
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={archivados}
                        onChange={(e) => {
                          setArchivados(e.target.checked);
                          setPaginaExistentes(0);
                        }}
                      />
                      Mostrar archivados
                    </label>
                    <div className="max-h-52 overflow-auto rounded-lg bg-white">
                      {candidatos.map((p) => (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-3 border-b p-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={filas.some((f) => f.producto_id === p.id)}
                            onChange={() => elegir(p)}
                          />
                          <span>
                            {p.nombre} · {precio(p.precio_venta)} · Stock{" "}
                            {p.stock_actual}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <button
                        className={boton}
                        disabled={!paginaExistentes}
                        onClick={() => setPaginaExistentes((v) => v - 1)}
                      >
                        Anterior
                      </button>
                      <span className="self-center text-xs">
                        {filas.length} seleccionados
                      </span>
                      <button
                        className={boton}
                        disabled={
                          (paginaExistentes + 1) * 20 >= totalExistentes
                        }
                        onClick={() => setPaginaExistentes((v) => v + 1)}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Nombre general
                    <input
                      aria-label="Nombre general"
                      className={`${campos} mt-1`}
                      value={datos.nombre}
                      onChange={(e) => cambiarDatos({ nombre: e.target.value })}
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Precio general
                    <PrecioInput
                      aria-label="Precio general"
                      className={`${campos} mt-1`}
                      value={datos.precio_base}
                      onChange={(value) => cambiarDatos({ precio_base: value })}
                    />
                  </label>
                  <label className="text-sm font-semibold md:col-span-2">
                    Descripción general
                    <textarea
                      aria-label="Descripción general"
                      className={`${campos} mt-1`}
                      value={datos.descripcion}
                      onChange={(e) =>
                        cambiarDatos({ descripcion: e.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Unidad
                    <input
                      className={`${campos} mt-1`}
                      value={datos.unidad}
                      disabled={modo === "editar"}
                      onChange={(e) => cambiarDatos({ unidad: e.target.value })}
                    />
                  </label>
                  <label className={`${boton} self-end cursor-pointer`}>
                    <ImagePlus size={16} />
                    Foto general
                    <input
                      aria-label="Subir foto general"
                      className="sr-only"
                      type="file"
                      accept="image/*"
                      disabled={ocupado || modo === "agrupar"}
                      onChange={(e) => void foto(e.target.files?.[0])}
                    />
                  </label>
                </div>
                <section className="space-y-3 rounded-xl border bg-slate-50 p-4">
                  <h4 className="text-sm font-bold">
                    Opciones de las variantes
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {datos.opciones.map((o, i) => (
                      <label key={i} className="min-w-40 flex-1 text-xs">
                        Opción {i + 1}
                        <input
                          aria-label={`Nombre de opción ${i + 1}`}
                          className={`${campos} mt-1`}
                          value={o}
                          disabled={
                            modo === "editar" ||
                            (modo === "agrupar" && filas.length > 0)
                          }
                          onChange={(e) => {
                            const name = e.target.value;
                            const opciones = datos.opciones.map((s, k) =>
                              k === i ? name : s,
                            );
                            cambiarDatos({ opciones });
                            setFilas((v) =>
                              v.map((f) => {
                                const opt = { ...f.opciones };
                                const value = opt[o];
                                delete opt[o];
                                opt[name] = value;
                                return { ...f, opciones: opt };
                              }),
                            );
                            setValores((v) => ({ ...v, [name]: v[o] ?? "" }));
                          }}
                        />
                        {modo === "crear" && (
                          <input
                            aria-label={`Valores ${i + 1}`}
                            className={`${campos} mt-1`}
                            placeholder={
                              i === 0 ? "Amarillo, Verde, Negro" : "S, M, L"
                            }
                            value={valores[o] ?? ""}
                            onChange={(e) =>
                              setValores((v) => ({ ...v, [o]: e.target.value }))
                            }
                          />
                        )}
                      </label>
                    ))}
                  </div>
                  {modo === "crear" && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={boton}
                        disabled={datos.opciones.length >= 3}
                        onClick={() => {
                          const o =
                            datos.opciones.length === 1 ? "Talla" : "Modelo";
                          cambiarDatos({ opciones: [...datos.opciones, o] });
                          setFilas((v) =>
                            v.map((f) => ({
                              ...f,
                              opciones: { ...f.opciones, [o]: "" },
                            })),
                          );
                        }}
                      >
                        Añadir opción
                      </button>
                      <button className={boton} onClick={generar}>
                        Generar combinaciones
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    Cada combinación será una variante independiente en ventas,
                    compras y etiquetas.
                  </p>
                </section>
                {modo !== "agrupar" && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={boton}
                      onClick={() => {
                        setFilas((v) => [...v, fila(datos.opciones)]);
                        setDirty(true);
                      }}
                      disabled={filas.length >= 200}
                    >
                      <Plus size={15} />
                      Añadir variante
                    </button>
                    <button
                      className={boton}
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Usar el precio general ${precio(datos.precio_base)} en TODAS las variantes, quitando los precios especiales?`,
                          )
                        ) {
                          setFilas((v) =>
                            v.map((f) => ({ ...f, precio_especial: false })),
                          );
                          setDirty(true);
                        }
                      }}
                    >
                      Aplicar precio a todas
                    </button>
                    <button
                      className={boton}
                      onClick={() => {
                        if (
                          window.confirm(
                            "¿Usar nombre, descripción y foto generales en todas las variantes?",
                          )
                        ) {
                          setFilas((v) =>
                            v.map((f) => ({
                              ...f,
                              nombre_especial: false,
                              descripcion_especial: false,
                              imagen_especial: false,
                            })),
                          );
                          setDirty(true);
                        }
                      }}
                    >
                      Unificar información general
                    </button>
                  </div>
                )}
                <div className="overflow-auto rounded-xl border">
                  <table className="w-full min-w-[950px] text-sm">
                    <thead className="bg-slate-100 text-left text-xs">
                      <tr>
                        {datos.opciones.map((o) => (
                          <th className="p-3" key={o}>
                            {o}
                          </th>
                        ))}
                        <th className="p-3">SKU / Nombre</th>
                        <th className="p-3">Precio de venta</th>
                        {verCosto && <th className="p-3">Costo</th>}
                        <th className="p-3">Stock</th>
                        <th className="p-3">Foto / estado</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((f, i) => (
                        <tr
                          key={f.producto_id ?? `nueva-${i}`}
                          className="border-t align-top"
                        >
                          {datos.opciones.map((o) => (
                            <td className="min-w-28 p-2" key={o}>
                              <input
                                aria-label={`${o} variante ${i + 1}`}
                                className={campos}
                                value={f.opciones[o] ?? ""}
                                onChange={(e) =>
                                  cambiarFila(i, {
                                    opciones: {
                                      ...f.opciones,
                                      [o]: e.target.value,
                                    },
                                  })
                                }
                              />
                            </td>
                          ))}
                          <td className="min-w-52 p-2">
                            <input
                              aria-label={`SKU variante ${i + 1}`}
                              className={campos}
                              value={f.sku}
                              disabled={modo === "agrupar"}
                              onChange={(e) =>
                                cambiarFila(i, { sku: e.target.value })
                              }
                            />
                            {f.producto_id && (
                              <>
                                <p className="mt-1 text-xs text-slate-500">
                                  {f.nombre}
                                </p>
                                <label className="mt-2 flex gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    disabled={modo === "agrupar"}
                                    checked={!f.nombre_especial}
                                    onChange={(e) =>
                                      cambiarFila(i, {
                                        nombre_especial: !e.target.checked,
                                      })
                                    }
                                  />
                                  Usar nombre general
                                </label>
                                <label className="mt-2 flex gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    disabled={modo === "agrupar"}
                                    checked={!f.descripcion_especial}
                                    onChange={(e) =>
                                      cambiarFila(i, {
                                        descripcion_especial: !e.target.checked,
                                      })
                                    }
                                  />
                                  Usar descripción general
                                </label>
                              </>
                            )}
                          </td>
                          <td className="min-w-40 p-2">
                            <PrecioInput
                              aria-label={`Precio variante ${i + 1}`}
                              className={campos}
                              value={
                                f.precio_especial
                                  ? f.precio_venta
                                  : datos.precio_base
                              }
                              disabled={
                                !f.precio_especial || modo === "agrupar"
                              }
                              onChange={(n) =>
                                cambiarFila(i, { precio_venta: n })
                              }
                            />
                            <label className="mt-2 flex gap-2 text-xs">
                              <input
                                type="checkbox"
                                disabled={modo === "agrupar"}
                                checked={!f.precio_especial}
                                onChange={(e) =>
                                  cambiarFila(i, {
                                    precio_especial: !e.target.checked,
                                    precio_venta: f.precio_especial
                                      ? f.precio_venta
                                      : datos.precio_base,
                                  })
                                }
                              />
                              Usar precio general
                            </label>
                          </td>
                          {verCosto && (
                            <td className="min-w-32 p-2">
                              <PrecioInput
                                aria-label={`Costo variante ${i + 1}`}
                                className={campos}
                                value={f.precio_compra ?? 0}
                                disabled={modo === "agrupar"}
                                onChange={(n) =>
                                  cambiarFila(i, { precio_compra: n })
                                }
                              />
                            </td>
                          )}
                          <td className="min-w-40 p-2">
                            <input
                              aria-label={`Stock variante ${i + 1}`}
                              className={campos}
                              type="number"
                              min={0}
                              step={1}
                              value={f.stock_actual}
                              disabled={modo === "agrupar"}
                              onChange={(e) =>
                                cambiarFila(i, {
                                  stock_actual: Number(e.target.value),
                                })
                              }
                            />
                            {modo === "editar" &&
                              f.producto_id &&
                              f.stock_actual !== f.stock_original && (
                                <input
                                  aria-label={`Motivo stock ${i + 1}`}
                                  className={`${campos} mt-2`}
                                  placeholder="Motivo del ajuste"
                                  value={f.motivo}
                                  onChange={(e) =>
                                    cambiarFila(i, { motivo: e.target.value })
                                  }
                                />
                              )}
                            <label className="mt-2 block text-xs">
                              Stock mínimo
                              <input
                                className={`${campos} mt-1`}
                                type="number"
                                min={0}
                                step={1}
                                value={f.stock_minimo}
                                disabled={modo === "agrupar"}
                                onChange={(e) =>
                                  cambiarFila(i, {
                                    stock_minimo: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                          </td>
                          <td className="min-w-44 p-2">
                            <label
                              className={`${boton} cursor-pointer text-xs`}
                            >
                              Foto
                              <input
                                aria-label={`Foto variante ${i + 1}`}
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                disabled={ocupado || modo === "agrupar"}
                                onChange={(e) =>
                                  void foto(e.target.files?.[0], i)
                                }
                              />
                            </label>
                            <label className="mt-2 flex gap-2 text-xs">
                              <input
                                type="checkbox"
                                disabled={modo === "agrupar"}
                                checked={!f.imagen_especial}
                                onChange={(e) =>
                                  cambiarFila(i, {
                                    imagen_especial: !e.target.checked,
                                  })
                                }
                              />
                              Foto general
                            </label>
                            <label className="mt-2 flex gap-2 text-xs">
                              <input
                                type="checkbox"
                                disabled={modo === "agrupar"}
                                checked={f.archivado}
                                onChange={(e) =>
                                  cambiarFila(i, {
                                    archivado: e.target.checked,
                                  })
                                }
                              />
                              Archivada
                            </label>
                          </td>
                          <td className="p-2">
                            {f.producto_id && modo === "editar" ? (
                              <button
                                className={boton}
                                disabled={ocupado || dirty}
                                onClick={() => void separar(f.producto_id)}
                              >
                                Separar
                              </button>
                            ) : (
                              <button
                                aria-label={`Quitar variante ${i + 1}`}
                                className={boton}
                                onClick={() => {
                                  setFilas((v) => v.filter((_, k) => i !== k));
                                  setDirty(true);
                                }}
                              >
                                <X size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filas.length && (
                    <p className="p-6 text-center text-sm text-slate-400">
                      {modo === "agrupar"
                        ? "Selecciona los productos de arriba."
                        : "Genera combinaciones o añade una variante."}
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  El precio general se aplica a las variantes que lo heredan.
                  Los precios especiales se conservan. Para nombres,
                  descripciones y fotos puedes conservar excepciones
                  individuales.
                </p>
              </fieldset>
              <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t bg-white p-4">
                <div>
                  {modo === "editar" && (
                    <button
                      className="text-sm font-semibold text-red-600 disabled:opacity-40"
                      disabled={ocupado || dirty}
                      onClick={() => void separar()}
                    >
                      Deshacer agrupación sin borrar productos
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className={boton}
                    disabled={ocupado}
                    onClick={() => void cerrar()}
                  >
                    Cancelar
                  </button>
                  <button
                    className={`${boton} !border-sky-600 !bg-sky-600 !text-white`}
                    disabled={ocupado}
                    onClick={() => void guardar()}
                  >
                    {ocupado
                      ? "Guardando…"
                      : modo === "agrupar"
                        ? "Agrupar sin cambiar datos"
                        : "Guardar producto y variantes"}
                  </button>
                </div>
              </footer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
