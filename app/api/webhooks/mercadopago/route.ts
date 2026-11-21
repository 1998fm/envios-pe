import { validarFirmaMP } from "@/lib/billing/signature";
import {
  guardarEventoMP,
  procesarEventoMP,
  type TipoEventoMP,
} from "@/lib/billing/events";
export const maxDuration = 300;
export async function POST(request: Request) {
  if (!process.env.MP_WEBHOOK_SECRET)
    return new Response("Webhook no configurado", { status: 503 });
  const signature = request.headers.get("x-signature"),
    requestId = request.headers.get("x-request-id");
  if (!signature || !requestId)
    return new Response("Falta la firma", { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object")
    return new Response("Solicitud no válida", { status: 400 });
  const url = new URL(request.url);
  const signed = url.searchParams.get("data.id") || body.data?.id;
  if (!signed || !/^[\w-]{1,100}$/.test(String(signed)))
    return new Response("Falta el identificador", { status: 400 });
  const id = String(signed).toLowerCase();
  try {
    validarFirmaMP(signature, requestId, id, process.env.MP_WEBHOOK_SECRET);
  } catch (e) {
    // Sin escrituras por entradas no autenticadas: evita que un atacante llene la cola.
    const motivo =
      e instanceof Error &&
      ["fecha_formato", "fecha_fuera_de_plazo"].includes(e.message)
        ? e.message
        : "firma_rechazada";
    console.warn("[mp-firma]", JSON.stringify({ motivo, recurso: id }));
    return new Response("Firma no válida", { status: 401 });
  }
  // Nunca usar body.id: identifica la notificación, no el recurso firmado.
  const otros = [url.searchParams.get("id"), body.data?.id].filter(
    (v) => v !== null && v !== undefined,
  );
  if (otros.some((v) => String(v).toLowerCase() !== id))
    return new Response("Identificadores no coincidentes", { status: 400 });
  const topic = String(
    body.type || url.searchParams.get("topic") || "",
  ).toLowerCase();
  const tipo = topic === "preapproval" ? "subscription_preapproval" : topic;
  if (
    ![
      "payment",
      "subscription_preapproval",
      "subscription_authorized_payment",
    ].includes(tipo)
  )
    return new Response("Evento no utilizado", { status: 200 });
  try {
    const evento = await guardarEventoMP(
      tipo as TipoEventoMP,
      id,
      `${requestId}:${signature}`,
    );
    await procesarEventoMP(evento);
    return new Response("OK", { status: 200 });
  } catch {
    console.error(
      "[mp-webhook] No se pudo verificar o registrar el cobro; se solicita reintento.",
    );
    return new Response("No se pudo procesar la notificación", { status: 503 });
  }
}
export async function GET() {
  return new Response("OK", { status: 200 });
}
