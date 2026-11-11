import { contratar, exigirTitular } from "@/lib/billing/subscriptions";
import { ErrorBilling } from "@/lib/billing/types";
export async function POST(request: Request) {
  try {
    const auth = await exigirTitular();
    const body = await request.json().catch(() => null);
    if (
      body?.plan !== "business_plus" ||
      !["mensual", "trimestral"].includes(body?.periodo)
    )
      return Response.json(
        { error: "Plan o período inválido" },
        { status: 400 },
      );
    if (!auth.email)
      return Response.json(
        { error: "Tu cuenta no tiene correo" },
        { status: 400 },
      );
    return Response.json(
      await contratar(auth.userId, auth.email, body.periodo),
    );
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof ErrorBilling
            ? e.message
            : "No se pudo conectar con Mercado Pago.",
      },
      { status: e instanceof ErrorBilling ? e.status : 503 },
    );
  }
}
