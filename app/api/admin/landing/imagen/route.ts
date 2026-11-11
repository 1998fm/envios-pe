import { NextResponse } from "next/server";
import { requireSuperAdmin, registrarAuditoria } from "@/lib/adminAuth";
import { subirImagen } from "@/lib/configuracionNegocio";
import { aProxy } from "@/lib/mediaUrl";
export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File))
    return NextResponse.json(
      { error: "Selecciona una imagen." },
      { status: 400 },
    );
  const r = await subirImagen(
    "logos",
    (ext) => `landing/${crypto.randomUUID()}.${ext}`,
    file,
    2 * 1024 * 1024,
  );
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
  await registrarAuditoria(auth, "landing_imagen", { ruta: r.ruta });
  return NextResponse.json({ url: aProxy(r.url) });
}
