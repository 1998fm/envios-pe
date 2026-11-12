import "server-only";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
/** Una foto general puede ser compartida por variantes: no borrar mientras se use. */
export async function imagenEnUso(url: string): Promise<boolean> {
  const p = await supabaseAdmin
    .from("productos")
    .select("id")
    .eq("imagen_url", url)
    .limit(1);
  if (p.error || p.data?.length) return true;
  const f = await supabaseAdmin
    .from("productos_familias")
    .select("id")
    .eq("imagen_url", url)
    .limit(1);
  if (f.error && !["42P01", "PGRST205"].includes(f.error.code ?? ""))
    return true;
  return !!f.data?.length;
}
