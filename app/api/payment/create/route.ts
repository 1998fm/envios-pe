// Endpoint retirado (flujo de pago antiguo, reemplazado por las suscripciones
// de /api/mercadopago/create-subscription).
export async function POST() {
  return Response.json({ error: 'Endpoint retirado' }, { status: 410 })
}
