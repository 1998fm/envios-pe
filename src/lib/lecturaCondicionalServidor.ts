import { NextResponse } from "next/server";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { mensajeDb } from "@/lib/erroresEs";
import { createHash } from "node:crypto";

/** Se llama DESPUÉS de autorizar cada petición; no cachea permisos ni planes. */
export async function controlarCambios(
  request: Request,
  ownerId: string,
  tabla: "envios" | "ventas" | "productos",
  permisos: unknown,
) {
  const params = new URL(request.url).searchParams;
  if (params.get("control_cambios") !== "1")
    return { revision: undefined, response: null };
  const { data, error } = await supabaseAdmin.rpc("tori_revision_lectura", {
    p_owner: ownerId,
    p_tabla: tabla,
  });
  if (error)
    return {
      revision: undefined,
      response: NextResponse.json({ error: mensajeDb(error) }, { status: 503 }),
    };
  const consulta = new URLSearchParams(params);
  consulta.delete("revision");
  consulta.sort();
  // Cambiar filtros o permisos exige una respuesta nueva aunque los datos
  // sigan iguales. La comprobación de acceso se ejecuta en cada petición.
  const revision = createHash("sha256")
    .update(
      JSON.stringify([ownerId, tabla, data, consulta.toString(), permisos]),
    )
    .digest("hex");
  return {
    revision,
    response:
      params.get("revision") === revision
        ? NextResponse.json({ sinCambios: true, revision })
        : null,
  };
}
