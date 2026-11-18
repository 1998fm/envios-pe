import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";

// Catálogos públicos compartidos, sin información de cuentas ni pedidos.
// La sincronización invalida la etiqueta cuando termina de guardar la lista.
export const leerShalomPublico = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("agencias_shalom")
      .select("etiqueta")
      .eq("activa", true)
      .eq("recibe", true)
      .order("etiqueta", { ascending: true });
    if (error) throw new Error("No se pudo leer el catálogo público Shalom.");
    return (data ?? []).map((r) => r.etiqueta).filter(Boolean);
  },
  ["agencias-shalom-v1"],
  { revalidate: 3600, tags: ["agencias-shalom"] },
);

export const leerOlvaPublico = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("agencias_olva")
      .select(
        "office_id, nombres, direccion, department, province, district, office_type, lat, lng",
      )
      .eq("activa", true)
      .order("nombres", { ascending: true });
    if (error) throw new Error("No se pudo leer el catálogo público Olva.");
    return data ?? [];
  },
  ["agencias-olva-v1"],
  { revalidate: 3600, tags: ["agencias-olva"] },
);
