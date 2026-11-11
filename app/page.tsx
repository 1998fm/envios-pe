import LandingPage from "@/components/LandingPage";
import { LandingProvider } from "@/components/landing/editor/LandingEditable";
import { landingPublicada } from "@/lib/landing/storage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const documento = await landingPublicada();
  return {
    title: documento.seo.titulo,
    description: documento.seo.descripcion,
  };
}
export default async function Home() {
  const documento = await landingPublicada();
  return (
    <LandingProvider documento={documento}>
      <LandingPage />
    </LandingProvider>
  );
}
