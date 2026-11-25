import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { mensajeDb } from "@/lib/erroresEs";
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (
    !userId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  )
    return NextResponse.json({ error: "Negocio no válido." }, { status: 400 });
  const { data, error } = await supabaseAdmin.rpc("tori_fechas_logistica", {
    p_owner: userId,
    p_metodo: "MOTORIZADO",
    p_cantidad: 3,
  });
  if (error)
    return NextResponse.json(
      { error: mensajeDb(error) },
      { status: error.code === "P0001" ? 409 : 503 },
    );
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
