"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/clienteApi";
type Suscripcion = {
  id: string;
  estado: string;
  monto?: number;
  meses?: number;
  init_point?: string;
  proximoCobro?: string | null;
  creada?: string | null;
  incidencia?: boolean;
};
type Datos = {
  suscripciones: Suscripcion[];
  hasta: string | null;
  operacionPendiente?: boolean;
  recibos: {
    id: string;
    monto: number;
    estado: string;
    aprobado: string;
    fin: string;
    inicio: string;
    meses: number;
    suscripcion: string;
    factura: string;
    reembolsado?: number;
  }[];
};
const ignorar = () => {};
export default function SubscriptionManager({
  onEstado = ignorar,
  endpoint = "/api/mercadopago/subscription",
  requiereMotivo = false,
}: {
  onEstado?: (bloqueado: boolean) => void;
  endpoint?: string;
  requiereMotivo?: boolean;
}) {
  const [datos, setDatos] = useState<Datos | null>(null),
    [error, setError] = useState(""),
    [ocupado, setOcupado] = useState(false),
    [mensaje, setMensaje] = useState("");
  const cargar = useCallback(async () => {
    try {
      const d = await api<Datos>(endpoint);
      setDatos(d);
      setError("");
      onEstado(
        !!d.operacionPendiente ||
          d.suscripciones.some((s) =>
            ["authorized", "paused"].includes(s.estado),
          ),
      );
    } catch (e) {
      setError((e as Error).message);
      onEstado(true);
    }
  }, [onEstado, endpoint]);
  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);
  const sincronizar = async () => {
    if (
      !window.confirm(
        "Sincronizará todos los pagos de este negocio. Si detecta un contrato histórico con importe trimestral y frecuencia mensual, cancelará esa renovación incorrecta y conservará el período pagado. No realiza cobros ni devoluciones. ¿Continuar?",
      )
    )
      return;
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const r = await res.json();
      await cargar();
      const detalle = (r.detalleErrores ?? [])
        .map(
          (e: { suscripcion: string; error: string }) =>
            `${e.suscripcion}: ${e.error}`,
        )
        .join(" · ");
      if (!res.ok)
        throw new Error(
          `${r.error ?? "Sincronización incompleta."} ${detalle}`,
        );
      setMensaje(
        `Sincronización completa: ${r.revisadas} contratos revisados, ${r.sincronizadas} cobros verificados, ${r.renovacionesDetenidas} contratos históricos con renovación incorrecta detenida.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };
  const cancelar = async (s: Suscripcion) => {
    if (
      !window.confirm(
        "¿Cancelar la renovación automática en Mercado Pago? Conservarás el acceso hasta el final del período pagado.",
      )
    )
      return;
    const motivo = requiereMotivo
      ? window
          .prompt("Motivo de la cancelación (mínimo 10 caracteres):")
          ?.trim()
      : undefined;
    if (
      requiereMotivo &&
      (!motivo || motivo.length < 10 || motivo.length > 1000)
    )
      return;
    setOcupado(true);
    setError("");
    try {
      await api(endpoint, {
        method: "DELETE",
        json: { id: s.id, motivo },
      });
      setMensaje(
        "Renovación cancelada en Mercado Pago. Conservas el período pagado.",
      );
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };
  return (
    <section
      aria-label="Mi suscripción"
      className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
    >
      <h3 className="font-bold text-slate-900">Mi suscripción y cobros</h3>
      {!datos && !error && (
        <p className="mt-2 text-slate-500">Consultando Mercado Pago…</p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-red-700">
          {error}
        </p>
      )}
      {mensaje && (
        <p role="status" className="mt-2 text-emerald-700">
          {mensaje}
        </p>
      )}
      {datos?.operacionPendiente && (
        <p className="mt-2 text-amber-700">
          Hay una operación pendiente de verificar. Actualiza su estado antes de
          intentar otra contratación; si continúa pendiente, contacta con
          soporte.
        </p>
      )}
      {datos?.suscripciones
        .filter(
          (s) =>
            requiereMotivo ||
            ["authorized", "paused", "pending"].includes(s.estado),
        )
        .map((s) => (
          <div
            key={s.id}
            className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3"
          >
            <div>
              <p className="font-semibold">
                {s.estado === "authorized"
                  ? "Renovación automática activa"
                  : s.estado === "paused"
                    ? "Suscripción pausada"
                    : s.estado === "pending"
                      ? "Contratación pendiente"
                      : s.estado === "cancelled"
                        ? "Renovación cancelada"
                        : s.estado}
              </p>
              <p className="text-xs text-slate-500">
                S/ {Number(s.monto).toFixed(2)} cada {s.meses}{" "}
                {s.meses === 1 ? "mes" : "meses"}
              </p>
              {requiereMotivo && (
                <div className="mt-2 break-all text-xs text-slate-600">
                  <p>Contrato MP: {s.id}</p>
                  <p>
                    Próximo cobro:{" "}
                    {s.estado === "cancelled"
                      ? "Sin renovación"
                      : s.proximoCobro
                        ? new Date(s.proximoCobro).toLocaleString("es-PE", {
                            timeZone: "America/Lima",
                          })
                        : "Mercado Pago no informa fecha"}
                  </p>
                  {s.incidencia && (
                    <p className="text-amber-800">
                      Contrato histórico con importe trimestral y frecuencia
                      mensual.{" "}
                      {s.estado === "cancelled"
                        ? "Renovación detenida."
                        : "Sincroniza para detener la renovación incorrecta y recuperar la cobertura pagada."}
                    </p>
                  )}
                </div>
              )}
            </div>
            {s.estado !== "cancelled" && (
              <button
                type="button"
                disabled={ocupado}
                onClick={() => void cancelar(s)}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
              >
                {s.estado === "pending"
                  ? "Cancelar contratación pendiente"
                  : "Cancelar renovación"}
              </button>
            )}
          </div>
        ))}
      {datos?.hasta && (
        <p className="mt-3 text-xs text-slate-600">
          Vigencia del acceso:{" "}
          {new Date(datos.hasta).toLocaleDateString("es-PE", {
            timeZone: "America/Lima",
          })}
          .
        </p>
      )}
      {!!datos?.recibos.length && (
        <details className="mt-3">
          <summary className="cursor-pointer font-semibold">
            Historial de cobros
          </summary>
          <ul className="mt-2 space-y-2">
            {datos.recibos.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap justify-between gap-2 border-b pb-2 text-xs"
              >
                <span>
                  {r.aprobado
                    ? new Date(r.aprobado).toLocaleDateString("es-PE", {
                        timeZone: "America/Lima",
                      })
                    : "Sin aprobación"}{" "}
                  · S/ {r.monto.toFixed(2)}
                </span>
                <span>
                  {(
                    {
                      approved: "Aprobado",
                      partially_refunded: "Reembolso parcial",
                      refunded: "Reembolsado",
                      charged_back: "Contracargo",
                      rejected: "Rechazado",
                      pending: "Pendiente",
                    } as Record<string, string>
                  )[r.estado] ?? r.estado}
                </span>
                <details className="w-full break-all">
                  <summary className="cursor-pointer text-sky-700">
                    Ver detalle del pago
                  </summary>
                  <p>
                    Pago MP: {r.id} · Factura: {r.factura}
                  </p>
                  <p>Contrato: {r.suscripcion}</p>
                  <p>
                    Período: {r.meses} meses · Desde{" "}
                    {new Date(r.inicio).toLocaleString("es-PE", {
                      timeZone: "America/Lima",
                    })}{" "}
                    hasta{" "}
                    {new Date(r.fin).toLocaleString("es-PE", {
                      timeZone: "America/Lima",
                    })}
                  </p>
                  <p>
                    Reembolsado: S/ {Number(r.reembolsado ?? 0).toFixed(2)}.{" "}
                    {r.estado === "refunded" || r.estado === "charged_back"
                      ? "Este pago no concede acceso."
                      : "Cobertura sujeta al estado del pago."}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </details>
      )}
      {requiereMotivo && (
        <button
          type="button"
          disabled={ocupado}
          onClick={() => void sincronizar()}
          className="mt-3 mr-4 rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {ocupado
            ? "Procesando…"
            : "Sincronizar pagos y corregir contratos históricos"}
        </button>
      )}
      <button
        type="button"
        disabled={ocupado}
        onClick={() => void cargar()}
        className="mt-3 text-xs font-semibold text-sky-700 underline"
      >
        Actualizar estado de Mercado Pago
      </button>
    </section>
  );
}
