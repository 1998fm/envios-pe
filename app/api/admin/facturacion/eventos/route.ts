import { requireSuperAdmin, registrarAuditoria } from "@/lib/adminAuth";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import {
  guardarEventoMP,
  procesarEventoMP,
  reintentarEventosMP,
} from "@/lib/billing/events";
import { ErrorBilling } from "@/lib/billing/types";
export const maxDuration = 300;
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return Response.json({ error: auth.error }, { status: auth.status });
  const [eventos, ejecuciones] = await Promise.all([
    supabaseAdmin
      .from("mp_eventos")
      .select(
        "id,tipo,recurso,estado,intentos,creado_en,actualizado_en,proximo_intento,codigo,detalle,origen",
      )
      .in("estado", ["error", "pendiente", "procesando"])
      .order("creado_en", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("mp_conciliaciones")
      .select("id,inicio,fin,origen,ok,resultado")
      .order("inicio", { ascending: false })
      .limit(5),
  ]);
  if (eventos.error || ejecuciones.error)
    return Response.json(
      { error: "No se pudo consultar el diagnóstico de pagos." },
      { status: 503 },
    );
  return Response.json(
    {
      ahora: new Date().toISOString(),
      eventos: eventos.data,
      ejecuciones: ejecuciones.data,
      configuracion: {
        credencial: !!process.env.MP_ACCESS_TOKEN,
        firma: !!process.env.MP_WEBHOOK_SECRET,
        cron: !!process.env.CRON_SECRET,
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return Response.json({ error: auth.error }, { status: auth.status });
  const b = await request.json().catch(() => null);
  if (
    !b ||
    !["reintentar", "operacion"].includes(b.accion) ||
    (b.accion === "operacion" && !/^\d{1,30}$/.test(b.operacion ?? "")) ||
    (b.id && !/^[a-f0-9]{64}$/.test(b.id))
  )
    return Response.json({ error: "Operación no válida." }, { status: 400 });
  await registrarAuditoria(auth, "mp_recuperacion", {
    accion: b.accion,
    operacion: b.operacion ?? null,
    evento: b.id ?? null,
  });
  try {
    if (b.accion === "operacion") {
      const id = await guardarEventoMP(
        "payment",
        b.operacion,
        `admin:${crypto.randomUUID()}`,
        "admin",
      );
      await procesarEventoMP(id);
    } else if (b.id) await procesarEventoMP(b.id);
    else {
      const r = await reintentarEventosMP();
      if (r.errores)
        return Response.json(
          {
            error:
              "Persisten incidencias. Consulta el detalle de cada operación.",
            ...r,
          },
          { status: 503 },
        );
    }
    return Response.json({
      ok: true,
      mensaje: "Procesamiento completado. No se generan nuevos cargos.",
    });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof ErrorBilling
            ? e.message
            : "No se pudo completar la recuperación.",
      },
      { status: 503 },
    );
  }
}
