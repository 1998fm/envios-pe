"use client";
import TutorialEnVideo from "./TutorialEnVideo";
import guia from "../../public/recursos/serie-variantes/pasos.json";
const duracion = Math.round(guia.duration);
const paso = (prefijo: string) =>
  guia.marks.find((p) => p.title.startsWith(prefijo))?.start ?? 0;
const capitulos = [
  { titulo: "Inicio", segundos: 0 },
  { titulo: "Costo general", segundos: paso("COSTO") },
  { titulo: "SKU y excepciones", segundos: paso("SKU") },
  { titulo: "Stock", segundos: paso("6.") },
  { titulo: "Editar el conjunto", segundos: paso("Para editar") },
];
export default function TutorialSerieVariantes() {
  return (
    <TutorialEnVideo
      titulo="Cómo crear una serie con variantes"
      etiquetaBoton="Ver tutorial de serie con variantes"
      video="/recursos/serie-variantes/serie-con-variantes.mp4"
      portada="/recursos/serie-variantes/portada.jpg"
      guia="/recursos/serie-variantes/index.html"
      duracion={`${Math.floor(duracion / 60)} min ${duracion % 60} s`}
      capitulos={capitulos}
    />
  );
}
