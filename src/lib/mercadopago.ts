// Catálogo histórico de importes: solo Plus admite nuevas contrataciones.
export type Periodo = "mensual" | "trimestral";
export type PlanPago = "pro" | "business_plus";

export type Precio = {
  label: string;
  precio: string;
  valor: number;
  detalle: string;
  meses: number;
};

export const PRECIOS_PLAN: Record<PlanPago, Record<Periodo, Precio>> = {
  pro: {
    mensual: {
      label: "Mensual",
      precio: "S/ 29.90",
      valor: 29.9,
      detalle: "/mes",
      meses: 1,
    },
    trimestral: {
      label: "Trimestral",
      precio: "S/ 79.90",
      valor: 79.9,
      detalle: "cada 3 meses",
      meses: 3,
    },
  },
  business_plus: {
    mensual: {
      label: "Mensual",
      precio: "S/ 49.90",
      valor: 49.9,
      detalle: "/mes",
      meses: 1,
    },
    trimestral: {
      label: "Trimestral",
      precio: "S/ 129.90",
      valor: 129.9,
      detalle: "cada 3 meses",
      meses: 3,
    },
  },
};

export const PRECIOS = PRECIOS_PLAN.business_plus;
