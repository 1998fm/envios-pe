import type { NextConfig } from "next";

// Las imágenes públicas (logos, fotos de producto) se piden como /media/... y el
// servidor de Next las trae del almacenamiento. El navegador nunca ve la
// dirección real de la base de datos.
const ALMACEN = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

const nextConfig: NextConfig = {
  // El stack local (npm run dev:local) usa su propio directorio para poder
  // convivir con un `next dev` normal en la misma carpeta.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // No generar AGENTS.md automáticamente.
  agentRules: false,
  async rewrites() {
    if (!ALMACEN) return []
    return ['logos', 'productos'].map((bucket) => ({
      source: `/media/${bucket}/:ruta*`,
      destination: `${ALMACEN}/storage/v1/object/public/${bucket}/:ruta*`,
    }))
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
