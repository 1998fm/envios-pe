"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/clienteApi";
type Suscripcion = {
  id: string;
  estado: string;
  monto?: number;
  meses?: number;
  init_point?: string;
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
        .filter((s) => ["authorized", "paused", "pending"].includes(s.estado))
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
                    : "Contratación pendiente"}
              </p>
              <p className="text-xs text-slate-500">
                S/ {Number(s.monto).toFixed(2)} cada {s.meses}{" "}
                {s.meses === 1 ? "mes" : "meses"}
              </p>
            </div>
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
              </li>
            ))}
          </ul>
        </details>
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
