import "server-only";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { PRECIOS_PLAN } from "@/lib/mercadopago";
import { mp, obtenerSuscripcionMP, referenciaMP } from "./mp";
import { cambiarCuenta, leerCuenta } from "./store";
import { ErrorBilling, type SuscripcionMP } from "./types";

// Solo el formato histórico, creado antes de corregir la frecuencia, con el
// importe trimestral exacto. Nunca reinterpretar contratos nuevos o ajenos.
export function trimestreHistoricoIncorrecto(sub: SuscripcionMP) {
  const ref = referenciaMP(sub),
    a = sub.auto_recurring;
  return (
    !!ref &&
    sub.external_reference.split("__").length === 2 &&
    Number.isFinite(Date.parse(sub.date_created ?? "")) &&
    Date.parse(sub.date_created!) < Date.parse("2026-11-10T21:36:58Z") &&
    a?.frequency_type === "months" &&
    Number(a.frequency) === 1 &&
    a.currency_id === "PEN" &&
    Math.round(Number(a.transaction_amount) * 100) ===
      Math.round(PRECIOS_PLAN[ref.plan].trimestral.valor * 100)
  );
}

export async function detenerTrimestreHistorico(sub: SuscripcionMP) {
  if (!trimestreHistoricoIncorrecto(sub)) return false;
  const ref = referenciaMP(sub)!;
  const perfil = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", ref.owner)
    .maybeSingle();
  if (perfil.error || !perfil.data)
    throw new ErrorBilling(
      "No se pudo verificar el negocio del contrato histórico.",
    );
  const actual = await obtenerSuscripcionMP(sub.id);
  if (
    referenciaMP(actual)?.owner !== ref.owner ||
    !trimestreHistoricoIncorrecto(actual)
  )
    throw new ErrorBilling(
      "El contrato cambió durante la revisión. Reintenta la sincronización.",
    );
  if (
    actual.status === "cancelled" &&
    (await leerCuenta(ref.owner)).incidencias?.[sub.id]?.estado === "cancelado"
  )
    return true;
  await cambiarCuenta(ref.owner, (s) => {
    s.incidencias ??= {};
    s.incidencias[sub.id] = {
      motivo: "Importe trimestral con renovación mensual histórica",
      estado: "pendiente",
      actualizado: new Date().toISOString(),
    };
    return s;
  });
  if (actual.status !== "cancelled") {
    if (!["authorized", "paused", "pending"].includes(actual.status))
      throw new ErrorBilling(
        "Contrato trimestral incorrecto: no se pudo confirmar su cancelación.",
      );
    await mp(`/preapproval/${encodeURIComponent(sub.id)}`, {
      method: "PUT",
      key: `legacy-quarter-${sub.id}`,
      body: { status: "cancelled" },
    });
  }
  // No basta con una respuesta al PUT: confirmar el estado del contrato real.
  const verificada = await obtenerSuscripcionMP(sub.id);
  if (
    verificada.status !== "cancelled" ||
    referenciaMP(verificada)?.owner !== ref.owner
  )
    throw new ErrorBilling(
      "Mercado Pago no confirmó la cancelación del contrato trimestral incorrecto.",
    );
  await cambiarCuenta(ref.owner, (s) => {
    s.incidencias ??= {};
    s.incidencias[sub.id] = {
      motivo:
        "Renovación mensual incorrecta cancelada y confirmada en Mercado Pago",
      estado: "cancelado",
      actualizado: new Date().toISOString(),
    };
    return s;
  });
  return true;
}
