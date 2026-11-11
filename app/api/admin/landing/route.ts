import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin, registrarAuditoria } from "@/lib/adminAuth";
import { validarDocumentoLanding } from "@/lib/landing/model";
import {
  guardarLanding,
  historialLanding,
  leerLanding,
} from "@/lib/landing/storage";

export async function GET(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const revision = new URL(request.url).searchParams.get("revision");
    if (revision !== null) {
      const n = Number(revision);
      if (!Number.isSafeInteger(n) || n < 1 || n > 999999999999)
        return NextResponse.json(
          { error: "Versión no válida." },
          { status: 400 },
        );
      return NextResponse.json(await leerLanding("publicado", n), {
        headers: { "Cache-Control": "no-store" },
      });
    }
    const [borrador, publicado, historial] = await Promise.all([
      leerLanding("borrador"),
      leerLanding("publicado"),
      historialLanding("publicado"),
    ]);
    return NextResponse.json(
      {
        borrador: borrador.revision
          ? borrador
          : { ...borrador, documento: publicado.documento },
        publicado,
        historial,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "No se pudo cargar la landing.",
      },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    if (Number(request.headers.get("content-length")) > 800000)
      return NextResponse.json(
        { error: "Contenido demasiado grande." },
        { status: 413 },
      );
    const texto = await request.text();
    if (Buffer.byteLength(texto) > 800000)
      return NextResponse.json(
        { error: "Contenido demasiado grande." },
        { status: 413 },
      );
    let body;
    try {
      body = JSON.parse(texto);
    } catch {
      return NextResponse.json(
        { error: "Solicitud no válida." },
        { status: 400 },
      );
    }
    if (
      !["borrador", "publicar"].includes(body.accion) ||
      !validarDocumentoLanding(body.documento) ||
      !Number.isSafeInteger(body.revision) ||
      body.revision < 0 ||
      body.revision > 999999999998
    )
      return NextResponse.json(
        {
          error:
            "Contenido o versión no válidos. Revisa los textos, colores y enlaces.",
        },
        { status: 400 },
      );
    const canal = body.accion === "publicar" ? "publicado" : "borrador";
    const resultado = await guardarLanding(
      canal,
      body.documento,
      body.revision,
      auth.userId,
    );
    if (resultado.conflicto)
      return NextResponse.json(
        {
          error:
            "Otra sesión guardó cambios. Recarga el editor antes de continuar; tus cambios siguen en pantalla.",
        },
        { status: 409 },
      );
    await registrarAuditoria(auth, `landing_${body.accion}`, {
      revision: resultado.version.revision,
      canal,
      secciones: body.documento.secciones.map(
        (s: { id: string; visible: boolean; eliminada: boolean }) => ({
          id: s.id,
          visible: s.visible,
          eliminada: s.eliminada,
        }),
      ),
    });
    if (canal === "publicado") revalidatePath("/");
    return NextResponse.json({ version: resultado.version });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "No se pudo guardar la landing.",
      },
      { status: 503 },
    );
  }
}
