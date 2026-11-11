import { paginasMP, referenciaMP } from "@/lib/billing/mp";
import { sincronizarSuscripcion } from "@/lib/billing/payments";
import type { SuscripcionMP } from "@/lib/billing/types";
// Paginar también las canceladas: pueden tener un reembolso posterior.
export async function sincronizarPagosMP() {
  let revisadas = 0,
    sincronizadas = 0,
    errores = 0;
  for await (const sub of paginasMP<SuscripcionMP>("/preapproval/search")) {
    if (!referenciaMP(sub)) continue;
    revisadas++;
    try {
      sincronizadas += await sincronizarSuscripcion(sub);
    } catch {
      errores++;
    }
  }
  return { revisadas, sincronizadas, errores };
}
