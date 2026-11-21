import "server-only";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import {
  procesarFacturaPorId,
  sincronizarPago,
  sincronizarSuscripcion,
} from "./payments";
import { obtenerSuscripcionMP } from "./mp";
import { ErrorBilling } from "./types";
export type TipoEventoMP =
  "payment" | "subscription_authorized_payment" | "subscription_preapproval";
type Evento = {
  id: string;
  tipo: TipoEventoMP;
  recurso: string;
  estado: string;
  intentos: number;
  lease: string;
};
export async function guardarEventoMP(
  tipo: TipoEventoMP,
  recurso: string,
  entrega: string,
  origen = "webhook",
) {
  const id = createHash("sha256")
    .update(`${tipo}:${recurso}:${entrega}`)
    .digest("hex");
  const { error } = await supabaseAdmin
    .from("mp_eventos")
    .upsert(
      { id, tipo, recurso, origen },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (error)
    throw new ErrorBilling(
      "No se pudo conservar la notificación para reintento.",
    );
  return id;
}
export async function procesarEventoMP(id?: string) {
  const { data, error } = await supabaseAdmin.rpc("tori_tomar_evento_mp", {
    p_id: id ?? null,
  });
  if (error)
    throw new ErrorBilling("No se pudo obtener la notificación pendiente.");
  if (!data) {
    if (!id) return null;
    const actual = await supabaseAdmin
      .from("mp_eventos")
      .select("estado")
      .eq("id", id)
      .single();
    if (
      actual.error ||
      !["completado", "ignorado"].includes(actual.data.estado)
    )
      throw new ErrorBilling(
        "La notificación sigue en proceso. Debe reintentarse.",
      );
    return { ok: true };
  }
  const evento = data as Evento;
  let fallo: unknown;
  let ignorado = false;
  try {
    if (evento.tipo === "payment")
      ignorado = (await sincronizarPago(evento.recurso)) === 0;
    else if (evento.tipo === "subscription_authorized_payment")
      ignorado = !(await procesarFacturaPorId(evento.recurso));
    else
      await sincronizarSuscripcion(
        await obtenerSuscripcionMP(evento.recurso),
        "webhook",
      );
  } catch (e) {
    fallo = e;
  }
  const codigo =
    fallo instanceof ErrorBilling
      ? fallo.providerOperation
        ? `proveedor_${fallo.providerStatus ?? "red"}`
        : "validacion_o_registro"
      : "error_interno";
  const detalle =
    fallo instanceof ErrorBilling
      ? fallo.message
      : "No se pudo completar el procesamiento. Requiere reintento.";
  const salida = await supabaseAdmin
    .from("mp_eventos")
    .update({
      estado: fallo ? "error" : ignorado ? "ignorado" : "completado",
      actualizado_en: new Date().toISOString(),
      proximo_intento: new Date(
        Date.now() +
          Math.min(3600000, 60000 * 2 ** Math.min(evento.intentos, 6)),
      ).toISOString(),
      codigo: fallo ? codigo : null,
      detalle: fallo ? detalle : null,
    })
    .eq("id", evento.id)
    .eq("lease", evento.lease)
    .select("id");
  if (salida.error || !salida.data?.length)
    throw new ErrorBilling(
      "No se pudo confirmar el resultado del procesamiento. Se reintentará.",
    );
  if (fallo) {
    console.error(
      "[mp-evento]",
      JSON.stringify({ id: evento.id, recurso: evento.recurso, codigo }),
    );
    throw fallo;
  }
  return { ok: true };
}
export async function reintentarEventosMP(limite = 10) {
  let procesados = 0,
    errores = 0;
  const inicio = Date.now();
  for (let i = 0; i < limite && Date.now() - inicio < 90000; i++) {
    try {
      if (!(await procesarEventoMP())) break;
      procesados++;
    } catch {
      errores++;
    }
  }
  return { procesados, errores };
}
