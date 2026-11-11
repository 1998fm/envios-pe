import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import {
  landingInicial,
  documentoParaPublico,
  validarDocumentoLanding,
  type DocumentoLanding,
} from "./model";

// Versiones inmutables en un bucket privado. Crear el siguiente nombre sin upsert
// actúa como comparación de versión atómica, incluso entre instancias de Vercel.
const BUCKET = "tori-landing";
export type CanalLanding = "borrador" | "publicado";
export type VersionLanding = {
  revision: number;
  documento: DocumentoLanding;
  fecha: string | null;
  autor?: string;
};
const vacia = (): VersionLanding => ({
  revision: 0,
  documento: landingInicial(),
  fecha: null,
});
const nombreVersion = (n: number) => `${String(n).padStart(12, "0")}.json`;
function ausente(
  error: { message?: string; statusCode?: string | number } | null,
) {
  return (
    error &&
    (/not found|does not exist/i.test(error.message ?? "") ||
      String(error.statusCode) === "404")
  );
}
export async function historialLanding(canal: CanalLanding, limit = 20) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(canal, { limit, sortBy: { column: "name", order: "desc" } });
  if (ausente(error)) return [];
  if (error) throw new Error("No se pudo leer el historial de la landing.");
  return (data ?? [])
    .filter((f) => /^\d{12}\.json$/.test(f.name))
    .map((f) => ({
      revision: Number(f.name.slice(0, 12)),
      fecha: f.created_at,
    }));
}
export async function leerLanding(
  canal: CanalLanding,
  revision?: number,
): Promise<VersionLanding> {
  const rev = revision ?? (await historialLanding(canal, 1))[0]?.revision;
  if (!rev) return vacia();
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(`${canal}/${nombreVersion(rev)}`);
  if (error || !data)
    throw new Error("No se pudo leer la versión de la landing.");
  const version = JSON.parse(await data.text()) as VersionLanding;
  if (!validarDocumentoLanding(version.documento) || version.revision !== rev)
    throw new Error("La versión de la landing no es válida.");
  return version;
}
export const landingPublicada = cache(async (): Promise<DocumentoLanding> => {
  try {
    return documentoParaPublico((await leerLanding("publicado")).documento);
  } catch {
    console.error(
      "No se pudo cargar la landing publicada; se muestra la versión original.",
    );
    return landingInicial();
  }
});
export async function guardarLanding(
  canal: CanalLanding,
  documento: DocumentoLanding,
  esperada: number,
  autor: string,
) {
  const actual = await leerLanding(canal);
  if (actual.revision !== esperada) return { conflicto: true as const };
  const version: VersionLanding = {
    revision: esperada + 1,
    documento,
    fecha: new Date().toISOString(),
    autor,
  };
  const contenido = JSON.stringify(version);
  if (Buffer.byteLength(contenido) > 750000)
    throw new Error("El contenido supera el tamaño permitido.");
  const { data: bucket, error: bucketError } =
    await supabaseAdmin.storage.getBucket(BUCKET);
  if (!bucket) {
    if (bucketError && !ausente(bucketError))
      throw new Error("No se pudo preparar el almacenamiento de la landing.");
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 1048576,
      allowedMimeTypes: ["application/json"],
    });
    if (error && !/already exists|duplicate/i.test(error.message))
      throw new Error("No se pudo crear el almacenamiento de la landing.");
  } else if (bucket.public) {
    throw new Error("El almacenamiento de borradores debe ser privado.");
  }
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(`${canal}/${nombreVersion(version.revision)}`, contenido, {
      contentType: "application/json",
      cacheControl: "0",
      upsert: false,
    });
  if (error) {
    if (
      /already exists|duplicate/i.test(error.message) ||
      String(error.statusCode) === "409"
    )
      return { conflicto: true as const };
    throw new Error("No se pudieron guardar los cambios de la landing.");
  }
  return { conflicto: false as const, version };
}
