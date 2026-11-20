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
  // Caché de imágenes públicas. Cada vez que el navegador/CDN las pide de nuevo
  // es egress de Storage.
  //  · productos: el nombre de archivo lleva fecha + sufijo aleatorio, nunca se
  //    reescribe → inmutable, un año.
  //  · logos: se guardan como <negocio>/logo.<ext> y se REEMPLAZAN al cambiarlos,
  //    así que solo caché corta (5 min en navegador, 1 h en CDN).
  async headers() {
    return [
      {
        source: '/media/productos/:ruta*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/media/logos/:ruta*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
