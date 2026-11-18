import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
export async function medirConsumo() {
  const { data, error } = await supabaseAdmin.rpc("tori_medir_consumo");
  if (error)
    throw new Error(
      "No se pudo registrar la medición de consumo. Revisa la instalación del monitor.",
    );
  return data;
}
