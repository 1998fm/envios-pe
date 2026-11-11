import "server-only";
import {
  ErrorBilling,
  type SuscripcionMP,
  type FacturaMP,
  type PagoMP,
} from "./types";
function baseMP() {
  // Únicamente el stack efímero puede usar el simulador; no es una URL de API configurable en producción.
  const local = process.env.LOCAL_MP_API_URL;
  if (
    local &&
    process.env.MP_ACCESS_TOKEN === "local-mp-token" &&
    /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(
      process.env.SUPABASE_URL ?? "",
    )
  )
    return local;
  return "https://api.mercadopago.com";
}
export async function mp<T>(
  path: string,
  init?: { method?: string; body?: unknown; key?: string },
): Promise<T> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token)
    throw new ErrorBilling(
      "Los pagos no están configurados. Contacta con soporte.",
    );
  const res = await fetch(`${baseMP()}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.key ? { "X-Idempotency-Key": init.key } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok)
    throw new ErrorBilling(
      "Mercado Pago no pudo completar la operación. Intenta nuevamente.",
      res.status >= 500 ? 503 : res.status === 404 ? 404 : 502,
      res.status,
    );
  return res.json();
}
export async function* paginasMP<T>(path: string): AsyncGenerator<T> {
  let offset = 0;
  for (;;) {
    const r = await mp<{
      results?: T[];
      paging?: { total?: number };
      total?: number;
    }>(`${path}${path.includes("?") ? "&" : "?"}limit=100&offset=${offset}`);
    if (!Array.isArray(r.results))
      throw new ErrorBilling("Respuesta incompleta de Mercado Pago.");
    for (const item of r.results) yield item;
    offset += r.results.length;
    const total = r.paging?.total ?? r.total;
    if (
      !r.results.length ||
      (total !== undefined ? offset >= total : r.results.length < 100)
    )
      return;
    if (offset > 1000000)
      throw new ErrorBilling("La conciliación necesita una nueva ejecución.");
  }
}
export const obtenerSuscripcionMP = (id: string) =>
  mp<SuscripcionMP>(`/preapproval/${encodeURIComponent(id)}`);
export const obtenerFacturaMP = (id: string) =>
  mp<FacturaMP>(`/authorized_payments/${encodeURIComponent(id)}`);
export const obtenerPagoMP = (id: string) =>
  mp<PagoMP>(`/v1/payments/${encodeURIComponent(id)}`);
export function referenciaMP(sub: SuscripcionMP) {
  const [owner, plan, intento, ...extra] = String(
    sub.external_reference ?? "",
  ).split("__");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      owner,
    ) ||
    !["pro", "business_plus"].includes(plan) ||
    extra.length ||
    (intento && !/^[\w-]{1,60}$/.test(intento))
  )
    return null;
  return { owner, plan: plan as "pro" | "business_plus" };
}
