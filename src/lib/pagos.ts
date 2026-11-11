// Compatibilidad de tipos: los cobros solo se registran tras verificar factura y
// pago en billing/payments. No existe una activación por autorización de contrato.
export type PlanPagoDb = "pro" | "business_plus";
