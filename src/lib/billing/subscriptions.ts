import "server-only";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { requireOwner } from "@/lib/ownerAuth";
import { PRECIOS_PLUS, computeEffectivePlan } from "@/lib/planGating";
import { cambiarCuenta, leerCuenta } from "./store";
import { mp, obtenerSuscripcionMP, paginasMP, referenciaMP } from "./mp";
import { inicializarCuenta } from "./payments";
import {
  ErrorBilling,
  type Periodo,
  type SuscripcionMP,
  type Checkout,
} from "./types";
export async function exigirTitular() {
  const auth = await requireOwner();
  if (!auth.ok) throw new ErrorBilling(auth.error, auth.status);
  const r = await supabaseAdmin
    .from("business_members")
    .select("user_id")
    .eq("user_id", auth.userId)
    .limit(1);
  if (r.error && r.error.code !== "42P01")
    throw new ErrorBilling("No se pudo verificar la titularidad.");
  if (r.data?.length)
    throw new ErrorBilling(
      "Solo el dueño puede gestionar la suscripción del negocio.",
      403,
    );
  return auth;
}
export async function suscripcionesDe(owner: string) {
  const state = await leerCuenta(owner);
  // La API oficial no documenta un filtro exacto por external_reference.
  // Paginar en servidor y comprobar la referencia evita perder contratos o
  // confiar en resultados parciales de una búsqueda libre.
  const encontradas = new Map<string, SuscripcionMP>();
  for await (const sub of paginasMP<SuscripcionMP>("/preapproval/search")) {
    if (referenciaMP(sub)?.owner === owner) encontradas.set(sub.id, sub);
  }
  const ids = new Set([
    ...(state.suscripciones ?? []),
    ...Object.values(state.recibos).map((r) => r.suscripcion),
    ...(state.checkout?.suscripcion ? [state.checkout.suscripcion] : []),
  ]);
  for (const id of ids) {
    if (encontradas.has(id)) continue;
    const sub = await obtenerSuscripcionMP(id);
    if (referenciaMP(sub)?.owner !== owner)
      throw new ErrorBilling("Referencia de suscripción no válida.");
    encontradas.set(id, sub);
  }
  return [...encontradas.values()];
}
function mismoPeriodo(sub: SuscripcionMP, periodo: Periodo) {
  const precio = PRECIOS_PLUS[periodo];
  return (
    sub.auto_recurring?.frequency === precio.meses &&
    Number(sub.auto_recurring.transaction_amount) === precio.valor &&
    sub.auto_recurring.currency_id === "PEN"
  );
}
export function destinoRetorno() {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL;
  const fallback = "https://hey-tori.vercel.app";
  try {
    const url = new URL(configurada || fallback);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hostname === "tori-efd4b.web.app"
    )
      return `${fallback}/dashboard`;
    return `${url.origin}/dashboard`;
  } catch {
    return `${fallback}/dashboard`;
  }
}
async function resultadoExistente(owner: string, periodo: Periodo) {
  const existentes = (await suscripcionesDe(owner)).filter((s) =>
    ["authorized", "pending", "paused"].includes(s.status),
  );
  if (!existentes.length) return null;
  if (
    existentes.some((s) => s.status === "authorized" || s.status === "paused")
  )
    throw new ErrorBilling(
      "Ya tienes una suscripción activa o pausada. Puedes gestionarla o cancelarla antes de contratar otra.",
      409,
    );
  const pendiente = existentes.find((s) => mismoPeriodo(s, periodo));
  if (!pendiente?.init_point)
    throw new ErrorBilling(
      "Ya existe una contratación pendiente. Cancélala antes de cambiar de período.",
      409,
    );
  return {
    init_point: pendiente.init_point,
    preapproval_id: pendiente.id,
    reutilizada: true,
  };
}
export async function contratar(
  owner: string,
  email: string,
  periodo: Periodo,
) {
  const tabla = await supabaseAdmin.from("pagos").select("id").limit(1);
  if (tabla.error)
    throw new ErrorBilling(
      "La facturación necesita una revisión de soporte antes de contratar. No se creará una suscripción.",
    );
  await inicializarCuenta(owner);
  const previa = await resultadoExistente(owner, periodo);
  if (previa) return previa;
  const token = crypto.randomUUID();
  await cambiarCuenta(owner, (s) => {
    if (
      s.checkout &&
      ["creando", "desconocido", "cancelando"].includes(s.checkout.estado)
    )
      throw new ErrorBilling(
        "Estamos verificando una operación previa con Mercado Pago. No se creará otra suscripción mientras siga pendiente.",
        409,
      );
    s.checkout = {
      token,
      periodo,
      fecha: new Date().toISOString(),
      estado: "creando",
    };
    return s;
  });
  try {
    // Segunda lectura después de obtener el turno: evita competir con un checkout anterior.
    const existente = await resultadoExistente(owner, periodo);
    if (existente) {
      await finalizarOperacion(owner, token, {
        estado: "listo",
        suscripcion: existente.preapproval_id,
      });
      return existente;
    }
    const perfil = await supabaseAdmin
      .from("profiles")
      .select("plan,pro_until,trial_end")
      .eq("id", owner)
      .single();
    if (perfil.error)
      throw new ErrorBilling(
        "No se pudo verificar la vigencia antes de contratar.",
      );
    const vigencia =
      perfil.data && computeEffectivePlan(perfil.data).plan !== "basic"
        ? [perfil.data.pro_until, perfil.data.trial_end]
            .filter((v) => v && new Date(v) > new Date())
            .map((v) => new Date(v!).toISOString())
            .sort()
            .at(-1)
        : undefined;
    const p = PRECIOS_PLUS[periodo];
    const creado = await mp<SuscripcionMP>("/preapproval", {
      method: "POST",
      key: token,
      body: {
        payer_email: email,
        reason: `Tori Plus - ${periodo}`,
        external_reference: `${owner}__business_plus__${token}`,
        status: "pending",
        auto_recurring: {
          ...(vigencia ? { start_date: vigencia } : {}),
          frequency: p.meses,
          frequency_type: "months",
          transaction_amount: p.valor,
          currency_id: "PEN",
        },
        back_url: destinoRetorno(),
      },
    });
    if (
      !creado.id ||
      !creado.init_point ||
      referenciaMP(creado)?.owner !== owner
    )
      throw new ErrorBilling(
        "Mercado Pago aún no confirmó el enlace de contratación.",
      );
    await finalizarOperacion(owner, token, {
      estado: "listo",
      suscripcion: creado.id,
    });
    return {
      init_point: creado.init_point,
      preapproval_id: creado.id,
      reutilizada: false,
    };
  } catch (error) {
    // Una respuesta perdida NO autoriza crear otra: se recupera consultando MP.
    await finalizarOperacion(owner, token, {
      estado:
        error instanceof ErrorBilling &&
        [400, 401, 403, 404, 422].includes(error.providerStatus ?? 0)
          ? "fallido"
          : "desconocido",
    });
    throw error;
  }
}
async function finalizarOperacion(
  owner: string,
  token: string,
  patch: Partial<Checkout>,
) {
  await cambiarCuenta(owner, (s) => {
    if (s.checkout?.token !== token) return null;
    s.checkout = { ...s.checkout, ...patch };
    if (patch.suscripcion)
      s.suscripciones = [
        ...new Set([...(s.suscripciones ?? []), patch.suscripcion]),
      ];
    return s;
  });
}
export async function cancelar(owner: string, id: string) {
  const sub = await obtenerSuscripcionMP(id);
  if (referenciaMP(sub)?.owner !== owner)
    throw new ErrorBilling("Suscripción no encontrada.", 404);
  await inicializarCuenta(owner);
  const token = crypto.randomUUID();
  await cambiarCuenta(owner, (s) => {
    if (
      s.checkout?.estado === "creando" ||
      (s.checkout?.estado === "cancelando" &&
        Date.now() - Date.parse(s.checkout.fecha) < 30000)
    )
      throw new ErrorBilling(
        "Hay otra operación en curso. Intenta nuevamente.",
        409,
      );
    s.checkout = {
      token,
      estado: "cancelando",
      periodo: "mensual",
      fecha: new Date().toISOString(),
      suscripcion: id,
    };
    return s;
  });
  try {
    if (sub.status !== "cancelled") {
      const r = await mp<SuscripcionMP>(
        `/preapproval/${encodeURIComponent(id)}`,
        { method: "PUT", key: token, body: { status: "cancelled" } },
      );
      if (r.status !== "cancelled")
        throw new ErrorBilling("Mercado Pago aún no confirmó la cancelación.");
    }
    await finalizarOperacion(owner, token, { estado: "listo" });
  } catch (e) {
    await finalizarOperacion(owner, token, { estado: "desconocido" });
    throw e;
  }
}
export async function verSuscripcion(owner: string) {
  const [subs, cuenta, perfil] = await Promise.all([
    suscripcionesDe(owner),
    leerCuenta(owner),
    supabaseAdmin
      .from("profiles")
      .select("pro_until")
      .eq("id", owner)
      .maybeSingle(),
  ]);
  if (perfil.error)
    throw new ErrorBilling("No se pudo leer la vigencia del plan.");
  // Recuperar una respuesta perdida solo si MP confirma la referencia del intento.
  if (
    cuenta.checkout &&
    ["creando", "desconocido"].includes(cuenta.checkout.estado)
  ) {
    const encontrada = subs.find(
      (s) =>
        s.external_reference ===
        `${owner}__business_plus__${cuenta.checkout!.token}`,
    );
    if (encontrada)
      await finalizarOperacion(owner, cuenta.checkout.token, {
        estado: "listo",
        suscripcion: encontrada.id,
      });
  }
  const vigente = await leerCuenta(owner);
  if (
    vigente.checkout &&
    ["desconocido", "cancelando"].includes(vigente.checkout.estado) &&
    vigente.checkout.suscripcion &&
    subs.find((s) => s.id === vigente.checkout!.suscripcion)?.status ===
      "cancelled"
  ) {
    await finalizarOperacion(owner, vigente.checkout.token, {
      estado: "listo",
    });
  }
  const final = await leerCuenta(owner);
  return {
    suscripciones: subs.map((s) => ({
      id: s.id,
      estado: s.status,
      monto: s.auto_recurring?.transaction_amount,
      meses: s.auto_recurring?.frequency,
      init_point: s.status === "pending" ? s.init_point : undefined,
    })),
    hasta: perfil.data?.pro_until ?? null,
    operacionPendiente:
      final.checkout &&
      ["creando", "desconocido", "cancelando"].includes(final.checkout.estado),
    recibos: Object.values(cuenta.recibos)
      .sort((a, b) => b.actualizado.localeCompare(a.actualizado))
      .slice(0, 30),
  };
}
