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
  const method = init?.method ?? "GET";
  const ruta = path.split("?")[0];
  const operacion =
    ruta === "/v1/payments/search"
      ? "Buscar pagos"
      : ruta === "/authorized_payments/search"
        ? "Buscar facturas"
        : ruta.startsWith("/authorized_payments/")
          ? "Consultar factura"
          : ruta.startsWith("/v1/payments/")
            ? "Consultar pago"
            : ruta === "/preapproval/search"
              ? "Buscar contratos"
              : method === "PUT"
                ? "Actualizar contrato"
                : method === "POST"
                  ? "Crear contrato"
                  : "Consultar contrato";
  // Solo lecturas: nunca repetir automáticamente una creación o cancelación.
  for (let intento = 0; ; intento++) {
    let res: Response;
    try {
      // Evitar ráfagas de consultas al recorrer varios contratos.
      if (method === "GET") await new Promise((r) => setTimeout(r, 250));
      res = await fetch(`${baseMP()}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(init?.key ? { "X-Idempotency-Key": init.key } : {}),
        },
        body: init?.body ? JSON.stringify(init.body) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      if (method === "GET" && intento === 0) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      throw new ErrorBilling(
        `${operacion}: no se recibió respuesta de Mercado Pago a tiempo. No se confirma la operación.`,
        503,
        undefined,
        operacion,
      );
    }
    if (res.ok) return res.json();
    // No publicar cuerpos del proveedor: pueden contener datos de clientes.
    const body = await res.json().catch(() => null);
    const rawCode = body?.error ?? body?.cause?.[0]?.code;
    const codigo =
      typeof rawCode === "number"
        ? String(rawCode)
        : typeof rawCode === "string" &&
            /^[a-z][a-z0-9_.-]{0,63}$/i.test(rawCode) &&
            !/APP_USR|bearer|TEST-/i.test(rawCode)
          ? rawCode
          : undefined;
    if (
      method === "GET" &&
      intento === 0 &&
      (res.status === 429 || res.status >= 500)
    ) {
      const after = Number(res.headers.get("retry-after"));
      await new Promise((r) =>
        setTimeout(
          r,
          Math.min(
            2000,
            Math.max(500, (Number.isFinite(after) ? after : 1) * 1000),
          ),
        ),
      );
      continue;
    }
    const motivos: Record<number, string> = {
      400: "Mercado Pago rechazó los parámetros de la solicitud",
      401: "Mercado Pago rechazó la credencial de la integración",
      403: "Mercado Pago no autoriza esta operación para la cuenta conectada",
      404: "Mercado Pago no encontró el recurso solicitado; no se interpreta como historial vacío",
      429: "Mercado Pago limitó las consultas; se agotó el reintento controlado",
    };
    console.error(
      "[mp-api]",
      JSON.stringify({ operacion, http: res.status, codigo }),
    );
    throw new ErrorBilling(
      `${operacion}: ${motivos[res.status] ?? "Mercado Pago no pudo completar la operación"} (HTTP ${res.status}${codigo ? `, código ${codigo}` : ""}).`,
      res.status >= 500 || res.status === 429
        ? 503
        : res.status === 404
          ? 404
          : 502,
      res.status,
      operacion,
      codigo,
    );
  }
}
export async function* paginasMP<T>(path: string): AsyncGenerator<T> {
  let offset = 0,
    limite = 20;
  for (;;) {
    const r = await mp<{
      results?: T[];
      paging?: { total?: number; limit?: number; offset?: number };
      total?: number;
    }>(
      `${path}${path.includes("?") ? "&" : "?"}limit=${limite}&offset=${offset}`,
    );
    if (!Array.isArray(r.results))
      throw new ErrorBilling("Respuesta incompleta de Mercado Pago.");
    if (r.paging?.offset !== undefined && Number(r.paging.offset) !== offset)
      throw new ErrorBilling(
        "Mercado Pago devolvió una página diferente a la solicitada. Sincronización incompleta.",
      );
    for (const item of r.results) yield item;
    offset += r.results.length;
    const total = r.paging?.total ?? r.total;
    const tamanoReal = Number(r.paging?.limit);
    if (Number.isInteger(tamanoReal) && tamanoReal > 0)
      limite = Math.min(limite, tamanoReal);
    if (
      !r.results.length ||
      (total !== undefined
        ? offset >= Number(total)
        : r.results.length < limite)
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
