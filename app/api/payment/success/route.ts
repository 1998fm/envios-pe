// Endpoint retirado. Antes activaba un plan de pago para cualquier userId sin
// verificar ningún pago. Los planes solo se activan desde el webhook firmado de
// MercadoPago (/api/webhooks/mercadopago), que valida la suscripción en su API.
export async function POST() {
  return Response.json({ error: 'Endpoint retirado' }, { status: 410 })
}
