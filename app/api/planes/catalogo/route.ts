import { catalogoPlanes, mapaPublico } from "@/lib/planesServidor";
export async function GET() {
  try {
    return Response.json(
      { planes: mapaPublico(await catalogoPlanes()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "No se pudo consultar los planes." },
      { status: 503 },
    );
  }
}
