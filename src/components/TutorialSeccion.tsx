"use client";
import TutorialEnVideo from "./TutorialEnVideo";
import productos from "../../public/recursos/productos/pasos.json";
import compras from "../../public/recursos/compras/pasos.json";
import ventas from "../../public/recursos/ventas/pasos.json";
type Guia = { duration: number; marks: { title: string; start: number }[] };
const guias: Record<"productos" | "compras" | "ventas", Guia> = {
  productos,
  compras,
  ventas,
};
export default function TutorialSeccion({
  seccion,
  tono = "claro",
}: {
  seccion: keyof typeof guias;
  tono?: "claro" | "oscuro";
}) {
  const guia = guias[seccion];
  const segundos = Math.round(guia.duration);
  const nombre = seccion.charAt(0).toUpperCase() + seccion.slice(1);
  const capitulos = guia.marks
    .filter((paso, i) => i === 0 || paso.title.includes("·"))
    .map((p) => ({ titulo: p.title.split("·")[0].trim(), segundos: p.start }));
  return (
    <TutorialEnVideo
      titulo={`Cómo usar ${nombre}`}
      etiquetaBoton={`Ver tutorial de ${seccion}`}
      video={`/recursos/${seccion}/${seccion}.mp4`}
      portada={`/recursos/${seccion}/portada.jpg`}
      guia={`/recursos/${seccion}/index.html`}
      duracion={`${Math.floor(segundos / 60)} min ${segundos % 60} s`}
      tono={tono}
      capitulos={capitulos}
    />
  );
}
