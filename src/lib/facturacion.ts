import {
  paginasMP,
  referenciaMP,
  obtenerSuscripcionMP,
} from "@/lib/billing/mp";
import { sincronizarSuscripcion } from "@/lib/billing/payments";
import { trimestreHistoricoIncorrecto } from "@/lib/billing/legacy";
import { ErrorBilling, type SuscripcionMP } from "@/lib/billing/types";
export async function conciliarContratos(
  contratos: AsyncIterable<SuscripcionMP> | Iterable<SuscripcionMP>,
) {
  let revisadas = 0,
    sincronizadas = 0,
    errores = 0,
    renovacionesDetenidas = 0;
  const detalleErrores: {
    suscripcion: string;
    usuario: string;
    error: string;
    http?: number;
    operacion?: string;
    codigo?: string;
  }[] = [];
  for await (const sub of contratos) {
    const ref = referenciaMP(sub);
    if (!ref) continue;
    revisadas++;
    try {
      const actual = await obtenerSuscripcionMP(sub.id);
      if (referenciaMP(actual)?.owner !== ref.owner)
        throw new ErrorBilling("Referencia del contrato no coincidente.");
      sincronizadas += await sincronizarSuscripcion(actual);
      if (trimestreHistoricoIncorrecto(actual)) renovacionesDetenidas++;
    } catch (e) {
      errores++;
      detalleErrores.push({
        suscripcion: sub.id,
        usuario: ref.owner,
        ...(e instanceof ErrorBilling
          ? {
              http: e.providerStatus,
              operacion: e.providerOperation,
              codigo: e.providerCode,
            }
          : {}),
        error:
          e instanceof ErrorBilling
            ? e.message
            : "No se pudo verificar o registrar el contrato. Reintenta la sincronización.",
      });
    }
  }
  return {
    revisadas,
    sincronizadas,
    errores,
    renovacionesDetenidas,
    detalleErrores,
  };
}
// Incluye canceladas: conservan pagos y pueden recibir devoluciones posteriores.
export async function sincronizarPagosMP() {
  return conciliarContratos(paginasMP<SuscripcionMP>("/preapproval/search"));
}
