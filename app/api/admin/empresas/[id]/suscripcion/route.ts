import { requireSuperAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { cancelar, verSuscripcion } from "@/lib/billing/subscriptions";
import { ErrorBilling } from "@/lib/billing/types";
const uuid = /^[0-9a-f-]{36}$/i;
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return Response.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  if (!uuid.test(id))
    return Response.json({ error: "Empresa no válida." }, { status: 400 });
  try {
    return Response.json(await verSuscripcion(id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
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
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return Response.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (
    !uuid.test(id) ||
    typeof body?.id !== "string" ||
    !/^[\w-]{1,100}$/.test(body.id) ||
    typeof body.motivo !== "string" ||
    body.motivo.trim().length < 10 ||
    body.motivo.length > 1000
  )
    return Response.json(
      { error: "Falta la suscripción o un motivo de 10 a 1000 caracteres." },
      { status: 400 },
    );
  const record = {
    empresaId: id,
    suscripcionId: body.id,
    motivo: body.motivo.trim(),
  };
  const audit = await supabaseAdmin
    .from("admin_audit_log")
    .insert({
      admin_id: auth.userId,
      admin_email: auth.email,
      accion: "cancelar_suscripcion_mp",
      detalle: { ...record, estado: "solicitado" },
    })
    .select("id")
    .single();
  if (audit.error || !audit.data)
    return Response.json(
      {
        error:
          "No se pudo registrar la solicitud. No se canceló la suscripción.",
      },
      { status: 503 },
    );
  try {
    await cancelar(id, body.id);
    await supabaseAdmin
      .from("admin_audit_log")
      .update({ detalle: { ...record, estado: "aplicado" } })
      .eq("id", audit.data.id);
    return Response.json({ ok: true });
  } catch (e) {
    await supabaseAdmin
      .from("admin_audit_log")
      .update({ detalle: { ...record, estado: "no_confirmado" } })
      .eq("id", audit.data.id);
    return Response.json(
      {
        error:
          e instanceof ErrorBilling
            ? e.message
            : "No se pudo confirmar la cancelación.",
      },
      { status: e instanceof ErrorBilling ? e.status : 503 },
    );
  }
}
