import "server-only";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { ErrorBilling, type CuentaBilling } from "./types";
const BUCKET = "tori-billing";
export const cuentaVacia = (): CuentaBilling => ({
  revision: 0,
  inicializada: false,
  baseHasta: null,
  recibos: {},
});
const falta = (e: { message?: string; statusCode?: string | number } | null) =>
  !!e &&
  (/not found|does not exist/i.test(e.message ?? "") ||
    String(e.statusCode) === "404");
export async function leerCuenta(owner: string): Promise<CuentaBilling> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(`accounts/${owner}`, {
      limit: 1,
      sortBy: { column: "name", order: "desc" },
    });
  if (falta(error)) return cuentaVacia();
  if (error)
    throw new ErrorBilling(
      "No se pudo consultar el registro de la suscripción.",
    );
  const file = data?.find((f) => /^\d{12}\.json$/.test(f.name));
  if (!file) return cuentaVacia();
  const blob = await supabaseAdmin.storage
    .from(BUCKET)
    .download(`accounts/${owner}/${file.name}`);
  if (blob.error || !blob.data)
    throw new ErrorBilling("No se pudo leer el registro de la suscripción.");
  const state = JSON.parse(await blob.data.text()) as CuentaBilling;
  if (
    !state ||
    !Number.isSafeInteger(state.revision) ||
    !state.recibos ||
    state.revision !== Number(file.name.slice(0, 12))
  )
    throw new ErrorBilling("El registro de facturación no es válido.");
  return state;
}
export async function escribirCuenta(
  owner: string,
  state: CuentaBilling,
): Promise<boolean> {
  const bucket = await supabaseAdmin.storage.getBucket(BUCKET);
  if (!bucket.data) {
    if (bucket.error && !falta(bucket.error))
      throw new ErrorBilling("No se pudo preparar el registro de facturación.");
    const r = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: false,
      allowedMimeTypes: ["application/json"],
      fileSizeLimit: 8388608,
    });
    if (r.error && !/already exists|duplicate/i.test(r.error.message))
      throw new ErrorBilling("No se pudo preparar el registro de facturación.");
  } else if (bucket.data.public)
    throw new ErrorBilling("El registro de facturación debe ser privado.");
  const contenido = JSON.stringify({ ...state, revision: state.revision + 1 });
  if (Buffer.byteLength(contenido) > 8000000)
    throw new ErrorBilling(
      "El registro necesita mantenimiento antes de continuar.",
    );
  const r = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(
      `accounts/${owner}/${String(state.revision + 1).padStart(12, "0")}.json`,
      contenido,
      { contentType: "application/json", cacheControl: "0", upsert: false },
    );
  if (r.error) {
    if (
      /already exists|duplicate/i.test(r.error.message) ||
      String(r.error.statusCode) === "409"
    )
      return false;
    throw new ErrorBilling(
      "No se pudo guardar el registro de facturación. Intenta nuevamente.",
    );
  }
  return true;
}
export async function cambiarCuenta(
  owner: string,
  fn: (s: CuentaBilling) => CuentaBilling | null,
): Promise<CuentaBilling> {
  for (let i = 0; i < 12; i++) {
    const state = await leerCuenta(owner);
    const next = fn(structuredClone(state));
    if (!next) return state;
    if (await escribirCuenta(owner, next))
      return { ...next, revision: state.revision + 1 };
  }
  throw new ErrorBilling(
    "Otra operación está actualizando la suscripción. Intenta nuevamente.",
    409,
  );
}
