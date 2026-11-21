import "server-only";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { guardarEventoMP, reintentarEventosMP } from "./events";
import { paginasMP, referenciaMP } from "./mp";
import { sincronizarPagosMP } from "@/lib/facturacion";
import { ErrorBilling, type PagoMP } from "./types";
// Segunda vía independiente de la entrega del webhook. Solo pagos con referencia
// Tori exacta; el procesador sigue exigiendo factura, contrato, pagador e importe.
async function descubrirPagos() {
  const hasta = new Date().toISOString(),
    desde = new Date(Date.now() - 30 * 86400000).toISOString();
  let encontrados = 0;
  for await (const pago of paginasMP<PagoMP>(
    `/v1/payments/search?range=date_created&begin_date=${encodeURIComponent(desde)}&end_date=${encodeURIComponent(hasta)}&sort=date_created&criteria=desc`,
  )) {
    if (
      !referenciaMP({
        id: "",
        status: "",
        external_reference: pago.external_reference ?? "",
      })
    )
      continue;
    const id = String(pago.id);
    if (!/^\d{1,30}$/.test(id)) continue;
    await guardarEventoMP(
      "payment",
      id,
      `recuperacion:${pago.date_last_updated ?? "sin-fecha"}`,
      "conciliacion",
    );
    encontrados++;
  }
  return encontrados;
}
export async function recuperarPagosMP(origen: "cron" | "admin") {
  const registro = await supabaseAdmin
    .from("mp_conciliaciones")
    .insert({ origen })
    .select("id")
    .single();
  if (registro.error)
    throw new ErrorBilling(
      "No se pudo registrar el inicio de la conciliación.",
    );
  let encontrados = 0,
    descubrimientoError = false,
    contratosError = false;
  let descubrimientoDetalle: string | undefined,
    contratosDetalle: string | undefined;
  let pagos: Awaited<ReturnType<typeof sincronizarPagosMP>> = {
    revisadas: 0,
    sincronizadas: 0,
    errores: 0,
    renovacionesDetenidas: 0,
    detalleErrores: [],
  };
  try {
    encontrados = await descubrirPagos();
  } catch (e) {
    descubrimientoError = true;
    descubrimientoDetalle =
      e instanceof ErrorBilling
        ? e.message
        : "No se pudo buscar pagos recientes.";
  }
  const eventos = await reintentarEventosMP();
  try {
    pagos = await sincronizarPagosMP();
  } catch (e) {
    contratosError = true;
    contratosDetalle =
      e instanceof ErrorBilling
        ? e.message
        : "No se pudieron conciliar los contratos.";
  }
  const ok =
    !descubrimientoError &&
    !contratosError &&
    !eventos.errores &&
    !pagos.errores;
  const resultado = {
    ...pagos,
    eventos,
    encontrados,
    descubrimientoError,
    contratosError,
    contratosDetalle,
    descubrimientoDetalle,
  };
  const fin = await supabaseAdmin
    .from("mp_conciliaciones")
    .update({ fin: new Date().toISOString(), ok, resultado })
    .eq("id", registro.data.id);
  if (fin.error)
    throw new ErrorBilling(
      "No se pudo confirmar el resultado de la conciliación.",
    );
  return { ok, ...resultado };
}
