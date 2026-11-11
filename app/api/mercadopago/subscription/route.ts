import {
  cancelar,
  exigirTitular,
  verSuscripcion,
} from "@/lib/billing/subscriptions";
import { ErrorBilling } from "@/lib/billing/types";
function fallo(e: unknown) {
  return Response.json(
    {
      error:
        e instanceof ErrorBilling
          ? e.message
          : "No se pudo consultar Mercado Pago.",
    },
    { status: e instanceof ErrorBilling ? e.status : 503 },
  );
}
export async function GET() {
  try {
    const auth = await exigirTitular();
    return Response.json(await verSuscripcion(auth.userId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return fallo(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const auth = await exigirTitular();
    const b = await request.json().catch(() => null);
    if (typeof b?.id !== "string" || !/^[\w-]{1,100}$/.test(b.id))
      return Response.json(
        { error: "Suscripción no válida." },
        { status: 400 },
      );
    await cancelar(auth.userId, b.id);
    return Response.json({
      ok: true,
      mensaje:
        "Renovación cancelada. Conservas el acceso hasta el final del período pagado.",
    });
  } catch (e) {
    return fallo(e);
  }
}
