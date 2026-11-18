import { NextResponse } from "next/server";
import { requireSuperAdmin, registrarAuditoria } from "@/lib/adminAuth";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { medirConsumo } from "@/lib/consumoServidor";
import { validarLecturaOficial } from "@/lib/consumoModel";

export async function GET(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const dias = Number(new URL(request.url).searchParams.get("dias") || 7);
  if (![1, 7, 30, 90].includes(dias))
    return NextResponse.json({ error: "Período no válido." }, { status: 400 });
  const { data, error } = await supabaseAdmin.rpc("tori_ver_consumo", {
    p_dias: dias,
  });
  if (error)
    return NextResponse.json(
      { error: "No se pudo consultar el historial de consumo." },
      { status: 503 },
    );
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const b = await request.json().catch(() => null);
  if (b?.accion === "medir") {
    try {
      return NextResponse.json(await medirConsumo(), {
        headers: { "Cache-Control": "private, no-store" },
      });
    } catch {
      return NextResponse.json(
        { error: "No se pudo registrar la medición técnica." },
        { status: 503 },
      );
    }
  }
  if (b?.accion !== "oficial")
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  const lectura = validarLecturaOficial(b);
  if (!lectura)
    return NextResponse.json(
      {
        error:
          "Revisa el ciclo, la fecha y los seis valores de consumo y sus límites.",
      },
      { status: 400 },
    );
  const { error } = await supabaseAdmin
    .from("supabase_usage_snapshots")
    .insert({ ...lectura, tipo: "oficial", admin_id: auth.userId });
  if (error?.code === "23505")
    return NextResponse.json(
      { error: "Ya existe una lectura de ese ciclo en esa fecha y hora." },
      { status: 409 },
    );
  if (error)
    return NextResponse.json(
      { error: "No se pudo guardar la lectura oficial." },
      { status: 503 },
    );
  await registrarAuditoria(auth, "consumo.lectura_oficial", {
    ciclo: lectura.ciclo,
    tomado_en: lectura.tomado_en,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
