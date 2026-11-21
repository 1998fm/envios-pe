"use client";
import { useCallback, useEffect, useState } from "react";
type Evento = {
  id: string;
  tipo: string;
  recurso: string;
  estado: string;
  intentos: number;
  detalle: string | null;
  creado_en: string;
};
type Ejecucion = {
  resultado?: { contratosDetalle?: string; descubrimientoDetalle?: string };
  id: string;
  inicio: string;
  fin: string | null;
  origen: string;
  ok: boolean | null;
};
type Datos = {
  ahora: string;
  eventos: Evento[];
  ejecuciones: Ejecucion[];
  configuracion: { credencial: boolean; firma: boolean; cron: boolean };
};
const fecha = (v: string) =>
  new Date(v).toLocaleString("es-PE", { timeZone: "America/Lima" });
export default function AdminPagosDiagnostico({
  revision = 0,
}: {
  revision?: number;
}) {
  const [datos, setDatos] = useState<Datos | null>(null),
    [error, setError] = useState(""),
    [mensaje, setMensaje] = useState(""),
    [busy, setBusy] = useState(false),
    [operacion, setOperacion] = useState("");
  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/facturacion/eventos", {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setDatos(j);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cargar el diagnóstico.",
      );
    }
  }, []);
  useEffect(() => {
    const inicio = setTimeout(() => void cargar(), 0);
    return () => clearTimeout(inicio);
  }, [cargar, revision]);
  async function actuar(body: object) {
    setBusy(true);
    setError("");
    setMensaje("");
    try {
      const r = await fetch("/api/admin/facturacion/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setMensaje(j.mensaje ?? "Reintento completado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar.");
    } finally {
      await cargar();
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">
          Activación de pagos y recuperación
        </h3>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setError("");
            void cargar();
          }}
          className="text-sm font-semibold text-sky-700"
        >
          Actualizar diagnóstico
        </button>
      </div>
      <p className="text-sm text-slate-600">
        Consulta las operaciones pendientes. Reintentar verifica el pago en
        Mercado Pago y recupera su comprobante y acceso; no vuelve a cobrar ni
        duplica períodos. Las fechas se muestran en hora de Perú.
      </p>
      {datos && (
        <>
          <p className="text-xs text-slate-600">
            Configuración presente: credencial{" "}
            {datos.configuracion.credencial ? "sí" : "NO"} · firma{" "}
            {datos.configuracion.firma ? "sí" : "NO"} · cron{" "}
            {datos.configuracion.cron ? "sí" : "NO"}. Esto no confirma que las
            credenciales sean válidas ni que Mercado Pago entregue las
            notificaciones.
          </p>
          <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
            <p className="font-semibold">Últimas conciliaciones</p>
            {datos.ejecuciones.length ? (
              datos.ejecuciones.map((e) => (
                <p key={e.id}>
                  {fecha(e.inicio)} ·{" "}
                  {e.origen === "cron" ? "Automática" : "Superadmin"} ·{" "}
                  {!e.fin
                    ? "Sin finalización confirmada"
                    : e.ok
                      ? "Completada"
                      : "Con incidencias"}
                  {e.resultado?.contratosDetalle &&
                    ` · ${e.resultado.contratosDetalle}`}
                  {e.resultado?.descubrimientoDetalle &&
                    ` · ${e.resultado.descubrimientoDetalle}`}
                </p>
              ))
            ) : (
              <p>
                No hay ejecuciones registradas. La conciliación automática
                todavía no está verificada.
              </p>
            )}
            {!datos.ejecuciones.some(
              (e) =>
                e.origen === "cron" &&
                e.ok &&
                e.fin &&
                Date.parse(datos.ahora) - Date.parse(e.fin) < 36 * 3600000,
            ) && (
              <p className="text-amber-800">
                No hay una conciliación automática exitosa confirmada en las
                últimas 36 horas. Revisa el cron de Vercel y usa la
                sincronización manual mientras se resuelve.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Pendientes e incidencias (hasta 50)
            </p>
            {!datos.eventos.length ? (
              <p className="text-sm text-slate-600">
                Sin incidencias registradas. Esto no certifica que todos los
                pagos externos hayan llegado.
              </p>
            ) : (
              datos.eventos.map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl border border-slate-200 p-3 text-sm break-words"
                >
                  <p>
                    Operación {e.recurso} · {e.estado} · {e.intentos} intentos
                  </p>
                  <p className="text-slate-600">
                    {fecha(e.creado_en)} · {e.tipo}
                  </p>
                  {e.detalle && <p className="text-amber-800">{e.detalle}</p>}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void actuar({ accion: "reintentar", id: e.id })
                    }
                    className="mt-2 font-semibold text-sky-700"
                  >
                    Reintentar operación
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void actuar({ accion: "operacion", operacion });
        }}
      >
        <label className="text-sm text-slate-700">
          Número de operación de Mercado Pago
          <input
            required
            inputMode="numeric"
            pattern="[0-9]{1,30}"
            value={operacion}
            onChange={(e) => setOperacion(e.target.value)}
            className="mt-1 block rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <button
          disabled={busy}
          className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Verificar y recuperar pago
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {mensaje && (
        <p role="status" className="text-sm text-emerald-700">
          {mensaje}
        </p>
      )}
    </section>
  );
}
