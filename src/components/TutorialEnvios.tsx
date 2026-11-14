"use client";
import TutorialEnVideo from "./TutorialEnVideo";
import datos from "../../public/recursos/envios/pasos.json";
const guia: { duration: number; marks: { title: string; start: number }[] } =
  datos;
const inicio = (prefijo: string) =>
  guia.marks.find((p) => p.title.startsWith(prefijo))?.start ?? 0;
const capitulos = [
  { titulo: "Inicio y formulario", segundos: 0 },
  { titulo: "Lista y filtros", segundos: inicio("LISTA ·") },
  { titulo: "Detalle y fecha", segundos: inicio("DETALLE") },
  { titulo: "Contenido y validación", segundos: inicio("CONTENIDO") },
  { titulo: "Estados y tamaño", segundos: inicio("ESTADOS") },
  { titulo: "Etiquetas", segundos: inicio("ETIQUETAS") },
  { titulo: "Copiar datos", segundos: inicio("COPIAR") },
  { titulo: "Cambios masivos", segundos: inicio("CAMBIO MASIVO") },
  { titulo: "Shalom Pro", segundos: inicio("SHALOM") },
  { titulo: "Despacho y eliminación", segundos: inicio("DESPACHAR") },
];
const segundos = Math.round(guia.duration);
export default function TutorialEnvios({
  detalle = false,
}: {
  detalle?: boolean;
}) {
  return (
    <TutorialEnVideo
      titulo="Envíos: guía completa paso a paso"
      etiquetaBoton="Ver guía completa de envíos"
      video="/recursos/envios/envios.mp4"
      portada="/recursos/envios/portada.jpg"
      guia="/recursos/envios/index.html"
      duracion={`${Math.floor(segundos / 60)} min ${segundos % 60} s`}
      tono="oscuro"
      capitulos={capitulos}
      inicio={detalle ? inicio("DETALLE") : 0}
    />
  );
}
