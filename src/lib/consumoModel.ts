export const METRICAS_CONSUMO = [
  {
    key: "egress",
    nombre: "Salida de datos (Egress)",
    unidad: "GB",
    limite: 5,
  },
  { key: "database", nombre: "Base de datos", unidad: "MB", limite: 500 },
  {
    key: "mau",
    nombre: "Usuarios activos mensuales",
    unidad: "usuarios",
    limite: 50000,
  },
  { key: "storage", nombre: "Archivos almacenados", unidad: "GB", limite: 1 },
  { key: "logs", nombre: "Ingesta de logs", unidad: "GB", limite: 1 },
  { key: "logQuery", nombre: "Consultas de logs", unidad: "GB", limite: 100 },
] as const;
export type MetricaConsumo = (typeof METRICAS_CONSUMO)[number]["key"];
export type MedidasOficiales = Record<
  MetricaConsumo,
  { uso: number; limite: number }
>;
export type DatosTecnicos = {
  databaseBytes: number;
  tablas: { nombre: string; filas: number; bytes: number }[];
  storage: { bucket: string; archivos: number; bytes: number }[];
  postgres: {
    transacciones: number;
    filasProcesadas: number;
    reinicio: string | null;
  };
};
export type SnapshotTecnico = {
  id?: string;
  tomado_en: string;
  datos: DatosTecnicos;
};
export type SnapshotOficial = {
  id: string;
  tomado_en: string;
  ciclo: string;
  datos: { medidas: MedidasOficiales; nota: string };
};
export type ConsumoData = {
  actual: SnapshotTecnico | null;
  oficial: SnapshotOficial | null;
  baseTecnica: SnapshotTecnico | null;
  oficialAnterior: SnapshotOficial | null;
  baseOficial: SnapshotOficial | null;
  tecnicos: { tomado_en: string; databaseBytes: number }[];
  oficiales: SnapshotOficial[];
};

/** No mezcla ciclos ni interpreta una cuota reiniciada como ahorro. */
export function compararOficiales(
  actual: SnapshotOficial,
  anterior: SnapshotOficial | undefined,
  key: MetricaConsumo,
) {
  if (
    !anterior ||
    anterior.ciclo !== actual.ciclo ||
    anterior.tomado_en >= actual.tomado_en
  )
    return null;
  const delta = actual.datos.medidas[key].uso - anterior.datos.medidas[key].uso;
  return {
    delta,
    reinicio: delta < 0 && ["egress", "mau", "logs", "logQuery"].includes(key),
    horas:
      (Date.parse(actual.tomado_en) - Date.parse(anterior.tomado_en)) / 36e5,
  };
}

export function validarLecturaOficial(input: unknown): {
  ciclo: string;
  tomado_en: string;
  datos: SnapshotOficial["datos"];
} | null {
  if (!input || typeof input !== "object") return null;
  const b = input as Record<string, unknown>;
  if (
    typeof b.ciclo !== "string" ||
    !b.ciclo.trim() ||
    b.ciclo.length > 80 ||
    typeof b.tomado_en !== "string"
  )
    return null;
  const fecha = Date.parse(b.tomado_en);
  if (
    !Number.isFinite(fecha) ||
    fecha < Date.UTC(2000, 0, 1) ||
    fecha > Date.now() + 300000
  )
    return null;
  if (!b.medidas || typeof b.medidas !== "object" || Array.isArray(b.medidas))
    return null;
  const medidas = {} as MedidasOficiales;
  for (const m of METRICAS_CONSUMO) {
    const v = (b.medidas as Record<string, unknown>)[m.key];
    if (!v || typeof v !== "object") return null;
    const { uso, limite } = v as { uso: unknown; limite: unknown };
    if (
      typeof uso !== "number" ||
      typeof limite !== "number" ||
      !Number.isFinite(uso) ||
      !Number.isFinite(limite) ||
      uso < 0 ||
      limite <= 0 ||
      uso > 1e12 ||
      limite > 1e12
    )
      return null;
    if (
      m.key === "mau" &&
      (!Number.isInteger(uso) || !Number.isInteger(limite))
    )
      return null;
    medidas[m.key] = { uso, limite };
  }
  const nota = typeof b.nota === "string" ? b.nota.trim() : "";
  if (nota.length > 500) return null;
  return {
    ciclo: b.ciclo.trim(),
    tomado_en: new Date(fecha).toISOString(),
    datos: { medidas, nota },
  };
}
