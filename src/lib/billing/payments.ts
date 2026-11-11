import "server-only";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { PRECIOS_PLAN } from "@/lib/mercadopago";
import { cambiarCuenta, leerCuenta } from "./store";
import {
  obtenerFacturaMP,
  obtenerPagoMP,
  obtenerSuscripcionMP,
  paginasMP,
  referenciaMP,
} from "./mp";
import {
  ErrorBilling,
  type FacturaMP,
  type Recibo,
  type SuscripcionMP,
} from "./types";
export const reciboVigente = (r: Recibo) =>
  r.estado === "approved" || r.estado === "partially_refunded";
export function sumarMesesUTC(iso: string, meses: number): string {
  const inicio = new Date(iso);
  if (!Number.isFinite(inicio.getTime()))
    throw new ErrorBilling("Fecha de cobro no válida.");
  const dia = inicio.getUTCDate();
  inicio.setUTCDate(1);
  inicio.setUTCMonth(inicio.getUTCMonth() + meses);
  const ultimo = new Date(
    Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0),
  ).getUTCDate();
  inicio.setUTCDate(Math.min(dia, ultimo));
  return inicio.toISOString();
}
function condiciones(sub: SuscripcionMP, plan: "pro" | "business_plus") {
  const a = sub.auto_recurring;
  if (
    !a ||
    a.currency_id !== "PEN" ||
    a.frequency_type !== "months" ||
    ![1, 3].includes(Number(a.frequency))
  )
    throw new ErrorBilling("La suscripción tiene condiciones no reconocidas.");
  const meses = Number(a.frequency);
  const esperado =
    PRECIOS_PLAN[plan][meses === 3 ? "trimestral" : "mensual"].valor;
  if (
    Math.round(Number(a.transaction_amount) * 100) !==
    Math.round(esperado * 100)
  )
    throw new ErrorBilling(
      "El importe de la suscripción requiere revisión de soporte.",
    );
  return { meses, monto: esperado };
}
export async function inicializarCuenta(owner: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("plan, pro_until")
    .eq("id", owner)
    .maybeSingle();
  if (error || !data)
    throw new ErrorBilling("No se encontró la cuenta de facturación.");
  return cambiarCuenta(owner, (s) => {
    if (s.inicializada) return null;
    s.inicializada = true;
    // Compatibilidad: no recortar períodos previos o extensiones manuales.
    s.baseHasta = data.pro_until
      ? new Date(data.pro_until).toISOString()
      : null;
    return s;
  });
}
// Proyección reintentable: leer perfil ANTES del registro y comparar al escribir
// evita que un worker antiguo sobrescriba la proyección de otro más reciente.
export async function proyectarAcceso(owner: string) {
  for (let intento = 0; intento < 12; intento++) {
    const { data: p, error } = await supabaseAdmin
      .from("profiles")
      .select("plan, pro_until, trial_end")
      .eq("id", owner)
      .maybeSingle();
    if (error || !p)
      throw new ErrorBilling("No se pudo comprobar el acceso de la cuenta.");
    const s = await leerCuenta(owner);
    const actualRaw = p.pro_until as string | null;
    const actual = actualRaw ? new Date(actualRaw).toISOString() : null;
    const aprobados = Object.values(s.recibos).filter(reciboVigente);
    const candidatos = [
      ...aprobados.map((r) => r.fin),
      ...(s.baseHasta ? [s.baseHasta] : []),
    ].sort();
    const hasta = candidatos.at(-1) ?? null;
    const nuevoPago = s.bloqueoManual
      ? aprobados.some((r) => r.aprobado > s.bloqueoManual!)
      : aprobados.length > 0;
    const activo =
      hasta &&
      new Date(hasta) > new Date() &&
      (aprobados.length > 0 || p.plan !== "basic") &&
      (!s.bloqueoManual || nuevoPago);
    const prueba =
      p.trial_end && new Date(p.trial_end) > new Date() && p.plan !== "basic";
    const plan = activo || prueba ? "business_plus" : "basic";
    if (p.plan === plan && actual === hasta) {
      await cambiarCuenta(owner, (st) => {
        if (st.proyeccion?.plan === plan && st.proyeccion?.hasta === hasta)
          return null;
        st.proyeccion = { plan, hasta };
        return st;
      });
      return;
    }
    let query = supabaseAdmin
      .from("profiles")
      .update({ plan, pro_until: hasta })
      .eq("id", owner)
      .eq("plan", p.plan);
    query = actual
      ? query.eq("pro_until", actualRaw!)
      : query.is("pro_until", null);
    query = p.trial_end
      ? query.eq("trial_end", p.trial_end)
      : query.is("trial_end", null);
    const r = await query.select("id");
    if (r.error)
      throw new ErrorBilling(
        "No se pudo actualizar el acceso. El pago está registrado y se reintentará.",
      );
    if (!r.data?.length) continue;
    await cambiarCuenta(owner, (st) => {
      st.proyeccion = { plan, hasta };
      return st;
    });
    // Si hubo otro cobro durante esta escritura, volver a proyectar el registro actual.
    if ((await leerCuenta(owner)).revision > s.revision + 1) continue;
    return;
  }
  throw new ErrorBilling(
    "La cuenta está actualizándose. La notificación debe reintentarse.",
    409,
  );
}
export async function procesarFactura(
  factura: FacturaMP,
  origen = "webhook",
  expectedPayment?: string,
): Promise<boolean> {
  if (!factura.payment?.id) return false; // Factura programada: todavía no acredita un pago.
  const id = String(factura.payment.id);
  if (expectedPayment && id !== expectedPayment)
    throw new ErrorBilling("El pago no corresponde a la factura.", 400);
  const [sub, pago] = await Promise.all([
    obtenerSuscripcionMP(String(factura.preapproval_id)),
    obtenerPagoMP(id),
  ]);
  if (
    String(pago.id) !== id ||
    String(sub.id) !== String(factura.preapproval_id)
  )
    throw new ErrorBilling("Identificadores de pago no coincidentes.", 400);
  const referencia = referenciaMP(sub);
  if (!referencia) return false; // Otra integración de la misma cuenta de Mercado Pago.
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", referencia.owner)
    .maybeSingle();
  if (error) throw new ErrorBilling("No se pudo validar la cuenta del cobro.");
  if (!profile) return false;
  const { meses, monto } = condiciones(sub, referencia.plan);
  if (
    pago.currency_id !== "PEN" ||
    factura.currency_id !== "PEN" ||
    Math.round(Number(pago.transaction_amount) * 100) !==
      Math.round(monto * 100) ||
    Math.round(Number(factura.transaction_amount) * 100) !==
      Math.round(monto * 100)
  )
    throw new ErrorBilling(
      "El importe o moneda del cobro no corresponde al plan.",
      400,
    );
  if (
    !pago.payer?.id ||
    !sub.payer_id ||
    String(pago.payer.id) !== String(sub.payer_id) ||
    (pago.collector_id &&
      sub.collector_id &&
      String(pago.collector_id) !== String(sub.collector_id))
  )
    throw new ErrorBilling("El pagador no corresponde a la suscripción.", 400);
  const actualizado = new Date(pago.date_last_updated ?? "").toISOString();
  const aprobado = pago.date_approved
    ? new Date(pago.date_approved).toISOString()
    : "";
  if (
    pago.status === "approved" &&
    (!aprobado || new Date(aprobado).getTime() > Date.now() + 300000)
  )
    throw new ErrorBilling("El cobro aún no tiene una aprobación válida.");
  const inicio = new Date(
    factura.debit_date ?? pago.date_approved ?? pago.date_last_updated!,
  ).toISOString();
  const estado =
    pago.status === "approved" && Number(pago.transaction_amount_refunded) > 0
      ? Number(pago.transaction_amount_refunded) >= monto
        ? "refunded"
        : "partially_refunded"
      : pago.status;
  const recibo: Recibo = {
    id,
    factura: String(factura.id),
    suscripcion: String(sub.id),
    plan: referencia.plan,
    monto,
    meses,
    estado,
    inicio,
    fin: sumarMesesUTC(inicio, meses),
    aprobado,
    actualizado,
  };
  await inicializarCuenta(referencia.owner);
  await cambiarCuenta(referencia.owner, (s) => {
    const anterior = s.recibos[id];
    if (
      anterior &&
      (anterior.actualizado > actualizado ||
        (anterior.actualizado === actualizado &&
          (["refunded", "charged_back", "cancelled"].includes(
            anterior.estado,
          ) ||
            anterior.estado === estado)))
    )
      return null;
    s.recibos[id] = recibo;
    return s;
  });
  await guardarComprobante(referencia.owner, id, origen);
  await proyectarAcceso(referencia.owner);
  return true;
}
async function guardarComprobante(owner: string, id: string, origen: string) {
  const key = `mp-payment:${id}`;
  for (let i = 0; i < 12; i++) {
    const anterior = await supabaseAdmin
      .from("pagos")
      .select("id, user_id, origen, updated_at")
      .eq("preapproval_id", key)
      .maybeSingle();
    if (anterior.data && anterior.data.user_id !== owner)
      throw new ErrorBilling("El cobro ya está vinculado a otra cuenta.", 409);
    if (anterior.error)
      throw new ErrorBilling(
        "No se pudo consultar el comprobante. Se reintentará.",
      );
    const actual = (await leerCuenta(owner)).recibos[id];
    if (!actual)
      throw new ErrorBilling("El registro del cobro no está disponible.");
    const valores = {
      user_id: owner,
      preapproval_id: key,
      plan: actual.plan,
      monto: actual.monto,
      periodo_meses: actual.meses,
      pro_until: actual.fin,
      origen: JSON.stringify({
        tipo: "mp-payment",
        canal: origen,
        payment_id: id,
        preapproval_id: actual.suscripcion,
        estado: actual.estado,
        aprobado: actual.aprobado,
      }),
      updated_at: actual.actualizado,
    };
    if (!anterior.data) {
      const r = await supabaseAdmin.from("pagos").upsert(valores, {
        onConflict: "preapproval_id",
        ignoreDuplicates: true,
      });
      if (r.error)
        throw new ErrorBilling(
          "No se pudo guardar el comprobante. Se reintentará sin duplicarlo.",
        );
      continue;
    }
    if (anterior.data.origen === valores.origen) return;
    const r = await supabaseAdmin
      .from("pagos")
      .update(valores)
      .eq("id", anterior.data.id)
      .eq("user_id", owner)
      .eq("origen", anterior.data.origen)
      .eq("updated_at", anterior.data.updated_at)
      .select("id");
    if (r.error)
      throw new ErrorBilling(
        "No se pudo actualizar el comprobante. Se reintentará.",
      );
    if (r.data?.length) return;
  }
  throw new ErrorBilling(
    "El comprobante está actualizándose. Se reintentará.",
    409,
  );
}
export async function sincronizarSuscripcion(
  sub: SuscripcionMP,
  origen = "reconciliacion",
) {
  if (!referenciaMP(sub)) return 0;
  let procesadas = 0;
  for await (const factura of paginasMP<FacturaMP>(
    `/authorized_payments/search?preapproval_id=${encodeURIComponent(sub.id)}`,
  ))
    if (await procesarFactura(factura, origen)) procesadas++;
  return procesadas;
}
export async function sincronizarPago(id: string) {
  for await (const factura of paginasMP<FacturaMP>(
    `/authorized_payments/search?payment_id=${encodeURIComponent(id)}`,
  ))
    await procesarFactura(factura, "webhook", id);
}
export async function procesarFacturaPorId(id: string) {
  const factura = await obtenerFacturaMP(id);
  if (String(factura.id) !== id)
    throw new ErrorBilling("Factura no coincidente.", 400);
  return procesarFactura(factura);
}

export async function registrarCambioManual(
  owner: string,
  plan: string,
  hasta?: string | null,
) {
  await inicializarCuenta(owner);
  await cambiarCuenta(owner, (s) => {
    if (plan === "basic") s.bloqueoManual = new Date().toISOString();
    else {
      s.baseHasta =
        hasta === null
          ? null
          : hasta
            ? new Date(hasta).toISOString()
            : s.baseHasta;
      s.bloqueoManual = undefined;
    }
    s.proyeccion = { plan, hasta: hasta ?? null };
    return s;
  });
  await proyectarAcceso(owner);
}
