import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { leerLanding } from "@/lib/landing/storage";
import LandingPreview from "@/components/landing/editor/LandingPreview";
export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
  title: "Vista previa privada de la landing",
};
export default async function Preview() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) redirect("/admin");
  const borrador = await leerLanding("borrador");
  const inicial = borrador.revision
    ? borrador.documento
    : (await leerLanding("publicado")).documento;
  return <LandingPreview inicial={inicial} />;
}
