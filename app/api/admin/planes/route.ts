import { NextResponse } from "next/server";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { catalogoPlanes, invalidarPlanes } from "@/lib/planesServidor";
import { FUNCIONES_PLAN, LIMITES_PLAN } from "@/lib/planCatalogo";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    return NextResponse.json(
      { planes: await catalogoPlanes() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron cargar los planes." },
      { status: 503 },
    );
  }
}
export async function PUT(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => null);
  const planes = ["basic", "business_plus"];
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 2 ||
    !planes.every((p) => body[p])
  )
    return NextResponse.json(
      { error: "Envía ambos planes completos." },
      { status: 400 },
    );
  const claves = new Set([
    "plan",
    "revision",
    "permisos",
    ...LIMITES_PLAN.map((l) => l.key),
  ]);
  for (const plan of planes) {
    const p = body[plan];
    if (
      typeof p !== "object" ||
      Array.isArray(p) ||
      p.plan !== plan ||
      Object.keys(p).some((k) => !claves.has(k)) ||
      !Number.isSafeInteger(p.revision) ||
      p.revision < 0 ||
      !p.permisos ||
      typeof p.permisos !== "object" ||
      Object.keys(p.permisos).length !== FUNCIONES_PLAN.length ||
      !FUNCIONES_PLAN.every((f) => typeof p.permisos[f.key] === "boolean") ||
      !LIMITES_PLAN.every(
        (l) =>
          p[l.key] === null ||
          (Number.isInteger(p[l.key]) &&
            p[l.key] >= 0 &&
            p[l.key] <= 2147483647),
      )
    )
      return NextResponse.json(
        {
          error:
            "Revisa los permisos y los límites: usa enteros desde cero o sin límite.",
        },
        { status: 400 },
      );
  }
  const { error } = await supabaseAdmin.rpc("tori_publicar_planes", {
    p_actor: auth.userId,
    p_email: auth.email,
    p_planes: body,
  });
  if (error)
    return NextResponse.json(
      {
        error:
          error.code === "40001"
            ? "Los planes cambiaron. Recarga antes de publicar."
            : "No se publicaron los cambios. Intenta nuevamente.",
      },
      { status: error.code === "40001" ? 409 : 500 },
    );
  invalidarPlanes();
  return NextResponse.json({ ok: true, planes: await catalogoPlanes() });
}
