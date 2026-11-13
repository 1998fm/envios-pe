"use client";

import TutorialEnVideo from "./TutorialEnVideo";
import guia from "../../public/recursos/configuracion/pasos.json";

const segundo = (prefijo: string) =>
  guia.marks.find((paso) => paso.title.startsWith(prefijo))?.start ?? 0;
const capitulos = [
  { titulo: "Inicio", segundos: 0 },
  { titulo: "Logística", segundos: segundo("LOGÍSTICA") },
  { titulo: "Tarifas Lima", segundos: segundo("TARIFAS") },
  { titulo: "Tarifas Provincia", segundos: segundo("PROVINCIA") },
];
const duracion = Math.round(guia.duration);

export default function TutorialConfiguracion({
  vista,
  region,
}: {
  vista: string;
  region: string;
}) {
  const inicio =
    vista === "LOGISTICA"
      ? capitulos[1].segundos
      : vista === "TARIFAS"
        ? capitulos[region === "provincia" ? 3 : 2].segundos
        : 0;
  return (
    <TutorialEnVideo
      titulo="Cómo configurar tu negocio"
      etiquetaBoton="Ver tutorial de configuración"
      video="/recursos/configuracion/configuracion.mp4"
      portada="/recursos/configuracion/portada.jpg"
      guia="/recursos/configuracion/index.html"
      duracion={`${Math.floor(duracion / 60)} min ${duracion % 60} s`}
      tono="oscuro"
      capitulos={capitulos}
      inicio={inicio}
    />
  );
}
