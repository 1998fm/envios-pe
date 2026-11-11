export type PlanPago = "pro" | "business_plus";
export type Periodo = "mensual" | "trimestral";
export type SuscripcionMP = {
  id: string;
  status: string;
  external_reference: string;
  init_point?: string;
  payer_id?: number | string;
  collector_id?: number | string;
  auto_recurring?: {
    frequency?: number;
    frequency_type?: string;
    transaction_amount?: number;
    currency_id?: string;
  };
};
export type FacturaMP = {
  id: number | string;
  preapproval_id: string;
  debit_date?: string;
  currency_id?: string;
  transaction_amount?: number;
  payment?: { id?: number | string; status?: string };
};
export type PagoMP = {
  id: number | string;
  status: string;
  date_approved?: string;
  date_last_updated?: string;
  transaction_amount?: number;
  transaction_amount_refunded?: number;
  currency_id?: string;
  payer?: { id?: number | string };
  collector_id?: number | string;
};
export type Recibo = {
  id: string;
  factura: string;
  suscripcion: string;
  plan: PlanPago;
  monto: number;
  meses: number;
  estado: string;
  inicio: string;
  fin: string;
  aprobado: string;
  actualizado: string;
};
export type Checkout = {
  token: string;
  periodo: Periodo;
  fecha: string;
  estado: "creando" | "desconocido" | "cancelando" | "listo" | "fallido";
  suscripcion?: string;
};
export type CuentaBilling = {
  suscripciones?: string[];
  revision: number;
  inicializada: boolean;
  baseHasta: string | null;
  bloqueoManual?: string;
  recibos: Record<string, Recibo>;
  checkout?: Checkout;
  proyeccion?: { plan: string; hasta: string | null };
};
export class ErrorBilling extends Error {
  constructor(
    message: string,
    public status = 503,
    public providerStatus?: number,
  ) {
    super(message);
  }
}
