import { initialConfigState, type ConfigState } from "@/types/config";
import type { SesionApp } from "@/lib/clienteApi";

/** Conserva la configuración guardada al volver al asistente. No guarda datos en el navegador. */
export function configInicialDesdeSesion(sesion: SesionApp): ConfigState {
  const profile = sesion.profile;
  return {
    ...initialConfigState,
    empresa: profile?.empresa || "",
    telefonoEmpresa: profile?.telefono || "",
    direccionEmpresa: profile?.direccion || "",
    nuevoOrigen: profile?.origen_shalom || "",
    logoUrl: profile?.logo_url || "",
    redirectUrl: profile?.redirect_url || "",
    redirectMessage: profile?.redirect_message || "",
    redirectMessageImage: profile?.redirect_message_image || "",
    instagramUrl: profile?.instagram_url || "",
    facebookUrl: profile?.facebook_url || "",
    tiktokUrl: profile?.tiktok_url || "",
    webUrl: profile?.web_url || "",
    whatsappUrl: profile?.whatsapp_url || "",
    metodoMotorizado: profile?.metodo_motorizado ?? true,
    metodoShalom: profile?.metodo_shalom ?? true,
    metodoOlva: profile?.metodo_olva ?? false,
    metodoMarvisur: profile?.metodo_marvisur ?? false,
    metodoFlores: profile?.metodo_flores ?? false,
    metodoOtro: profile?.metodo_otro ?? false,
    nombreMetodoOtro: profile?.nombre_metodo_otro || "",
    metodoRecojo: profile?.metodo_recojo ?? false,
    mensajeRecojo:
      profile?.mensaje_recojo ||
      "Recoge tu pedido en nuestra tienda. Te esperamos!",
    logisticaMotoDias: profile?.logistica_moto_dias ?? ["MONDAY"],
    logisticaMotoHoraCorte: profile?.logistica_moto_hora_corte ?? "18:00",
    logisticaMotoUsaHoraCorte: profile?.logistica_moto_usa_hora_corte ?? false,
    logisticaMotoAnticipacion: profile?.logistica_moto_anticipacion ?? 1,
    logisticaMotoAnticipacionSoloHabiles:
      profile?.logistica_moto_anticipacion_solo_habiles ?? false,
    logisticaMotoLimitar: profile?.logistica_moto_limitar ?? false,
    logisticaMotoCupo: profile?.logistica_moto_cupo ?? 0,
    logisticaAgenciasDias: profile?.logistica_agencias_dias ?? ["MONDAY"],
    logisticaAgenciasHoraCorte:
      profile?.logistica_agencias_hora_corte ?? "18:00",
    logisticaAgenciasUsaHoraCorte:
      profile?.logistica_agencias_usa_hora_corte ?? false,
    logisticaAgenciasAnticipacion:
      profile?.logistica_agencias_anticipacion ?? 1,
    logisticaAgenciasAnticipacionSoloHabiles:
      profile?.logistica_agencias_anticipacion_solo_habiles ?? false,
    logisticaAgenciasLimitar: profile?.logistica_agencias_limitar ?? false,
    logisticaAgenciasCupo: profile?.logistica_agencias_cupo ?? 0,
    solicitarCantidadProductos: profile?.solicitar_cantidad_productos ?? false,
    mostrarEscogerFecha: profile?.mostrar_escoger_fecha ?? true,
    mostrarTracking: profile?.mostrar_tracking ?? true,
    cerrarFormulario: profile?.cerrar_formulario ?? false,
    cerradoFormularioMensaje: profile?.cerrar_formulario_mensaje ?? "",
    cerrarFormularioDias: profile?.cerrar_formulario_dias ?? [],
    motoRegion: (profile?.moto_region ?? "lima") as "lima" | "provincia",
    colorPrimario: profile?.color_formulario_primario ?? "#0284c7",
    colorSecundario: profile?.color_formulario_secundario ?? "#4f46e5",
    tarifas: Object.fromEntries(
      Object.entries(sesion.tarifas).map(([k, v]) => [k, String(v)]),
    ),
  };
}
export const hayAgencias = (
  c: Pick<
    ConfigState,
    | "metodoShalom"
    | "metodoOlva"
    | "metodoMarvisur"
    | "metodoFlores"
    | "metodoOtro"
  >,
) =>
  c.metodoShalom ||
  c.metodoOlva ||
  c.metodoMarvisur ||
  c.metodoFlores ||
  c.metodoOtro;
export function pasosIniciales(c: ConfigState) {
  return [
    1,
    2,
    ...(c.metodoMotorizado || hayAgencias(c) ? [3] : []),
    ...(c.metodoMotorizado ? [4] : []),
  ];
}
type DatosIniciales = Omit<
  ConfigState,
  "logoFile" | "redirectMessageImageFile"
>;
const DIAS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
export function validarPasoInicial(
  paso: number,
  c: DatosIniciales,
): string | null {
  if (!c || typeof c !== "object" || Array.isArray(c))
    return "Configuración no válida";
  if (![1, 2, 3, 4].includes(paso)) return "Paso no válido";
  if (paso === 1 && (typeof c.empresa !== "string" || !c.empresa.trim()))
    return "Escribe el nombre de tu negocio.";
  if (paso === 2) {
    if (
      ![
        c.metodoMotorizado,
        c.metodoShalom,
        c.metodoOlva,
        c.metodoMarvisur,
        c.metodoFlores,
        c.metodoOtro,
        c.metodoRecojo,
      ].some(Boolean)
    )
      return "Selecciona al menos un método de entrega.";
    if (
      c.metodoShalom &&
      (typeof c.nuevoOrigen !== "string" || !c.nuevoOrigen.trim())
    )
      return "Selecciona la agencia Shalom desde la que despachas.";
    if (
      c.metodoOtro &&
      (typeof c.nombreMetodoOtro !== "string" || !c.nombreMetodoOtro.trim())
    )
      return "Escribe el nombre del otro método de entrega.";
  }
  if (paso === 3) {
    for (const [
      activo,
      nombre,
      dias,
      anticipacion,
      usaHora,
      hora,
      limitar,
      cupo,
    ] of [
      [
        c.metodoMotorizado,
        "Motorizado",
        c.logisticaMotoDias,
        c.logisticaMotoAnticipacion,
        c.logisticaMotoUsaHoraCorte,
        c.logisticaMotoHoraCorte,
        c.logisticaMotoLimitar,
        c.logisticaMotoCupo,
      ],
      [
        hayAgencias(c),
        "Agencias",
        c.logisticaAgenciasDias,
        c.logisticaAgenciasAnticipacion,
        c.logisticaAgenciasUsaHoraCorte,
        c.logisticaAgenciasHoraCorte,
        c.logisticaAgenciasLimitar,
        c.logisticaAgenciasCupo,
      ],
    ] as const) {
      if (!activo) continue;
      if (
        !Array.isArray(dias) ||
        !dias.length ||
        dias.some((d) => !DIAS.includes(d))
      )
        return `Elige al menos un día de atención para ${nombre}.`;
      if (!Number.isInteger(Number(anticipacion)) || Number(anticipacion) < 1)
        return `La anticipación de ${nombre} debe ser de al menos un día.`;
      if (usaHora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora ?? ""))
        return `Revisa la hora de corte de ${nombre}.`;
      if (limitar && (!Number.isInteger(Number(cupo)) || Number(cupo) < 1))
        return `Indica un cupo diario mayor a cero para ${nombre}.`;
    }
  }
  if (paso === 4 && c.metodoMotorizado) {
    const valores = Object.values(c.tarifas ?? {});
    if (
      valores.some(
        (v) =>
          String(v).trim() !== "" &&
          (!Number.isFinite(Number(v)) || (Number(v) < 0 && Number(v) !== -1)),
      )
    )
      return "Revisa las tarifas: usa importes válidos o retira el distrito de tu cobertura.";
    if (
      !valores.some(
        (v) =>
          String(v).trim() !== "" &&
          Number.isFinite(Number(v)) &&
          Number(v) >= 0,
      )
    )
      return "Agrega al menos una tarifa para los distritos que atiendes.";
  }
  return null;
}
export const claveInicio = (userId: string) => `tori_inicio_v2_${userId}`;
export const clavePaso = (userId: string) => `tori_config_paso_v2_${userId}`;
