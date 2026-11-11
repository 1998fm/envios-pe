import { WebhookSignatureValidator } from "mercadopago";
import { obtenerSuscripcionMP } from "@/lib/billing/mp";
import {
  procesarFacturaPorId,
  sincronizarPago,
  sincronizarSuscripcion,
} from "@/lib/billing/payments";
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
    WebhookSignatureValidator.validate({
      xSignature: signature,
      xRequestId: requestId,
      dataId: id,
      secret: process.env.MP_WEBHOOK_SECRET,
      toleranceSeconds: 600,
    });
  } catch {
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
  try {
    if (topic === "subscription_preapproval" || topic === "preapproval")
      await sincronizarSuscripcion(await obtenerSuscripcionMP(id), "webhook");
    else if (topic === "subscription_authorized_payment")
      await procesarFacturaPorId(id);
    else if (topic === "payment") await sincronizarPago(id);
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
