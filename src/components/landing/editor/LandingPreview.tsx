"use client";
import { useEffect, useState } from "react";
import LandingPage from "@/components/LandingPage";
import { LandingProvider } from "./LandingEditable";
import {
  validarDocumentoLanding,
  type DocumentoLanding,
} from "@/lib/landing/model";

export default function LandingPreview({
  inicial,
}: {
  inicial: DocumentoLanding;
}) {
  const [documento, setDocumento] = useState(inicial);
  const [seleccionar, setSeleccionar] = useState(true);
  useEffect(() => {
    const enviar = (tipo: string, datos: object = {}) => {
      if (window.parent !== window)
        window.parent.postMessage(
          { origen: "tori-landing-preview", tipo, ...datos },
          window.location.origin,
        );
    };
    function recibir(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.origen !== "tori-landing-editor"
      )
        return;
      if (
        event.data.tipo === "documento" &&
        validarDocumentoLanding(event.data.documento)
      ) {
        setDocumento(event.data.documento);
        setSeleccionar(event.data.seleccionar !== false);
      }
      if (event.data.tipo === "seccion" && typeof event.data.id === "string") {
        const bloque = [
          ...document.querySelectorAll<HTMLElement>("[data-landing-section]"),
        ].find((el) => el.dataset.landingSection === event.data.id);
        const target =
          bloque?.querySelector("section, header, footer") ?? bloque;
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    let timer: ReturnType<typeof setTimeout>;
    const catalogar = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () =>
          enviar("campos", {
            campos: [
              ...document.querySelectorAll<HTMLElement>("[data-landing-text]"),
            ].map((el) => ({
              key: el.dataset.landingText,
              original: el.dataset.original,
            })),
            enlaces: [
              ...document.querySelectorAll<HTMLElement>("[data-landing-link]"),
            ].map((el) => ({
              key: el.dataset.landingLink,
              original: el.dataset.originalHref,
            })),
          }),
        100,
      );
    };
    const observer = new MutationObserver(catalogar);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("message", recibir);
    enviar("listo");
    catalogar();
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("message", recibir);
    };
  }, []);
  useEffect(() => {
    function click(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const texto = target.closest<HTMLElement>("[data-landing-text]");
      const link = target.closest<HTMLElement>("[data-landing-link]");
      if (seleccionar && (texto || link)) {
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage(
          {
            origen: "tori-landing-preview",
            tipo: "seleccion",
            key: texto?.dataset.landingText,
            original: texto?.dataset.original,
            enlaceKey: link?.dataset.landingLink,
            enlaceOriginal: link?.dataset.originalHref,
            seccion: target.closest<HTMLElement>("[data-landing-section]")
              ?.dataset.landingSection,
          },
          window.location.origin,
        );
      } else {
        const href = target.closest("a")?.getAttribute("href");
        if (href && !href.startsWith("#")) event.preventDefault();
      }
    }
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [seleccionar]);
  return (
    <>
      <style>
        {seleccionar
          ? "[data-landing-text]:hover{outline:2px solid #0284c7;outline-offset:3px;cursor:text;background:#e0f2fe66} [data-landing-section] {scroll-margin-top:100px}"
          : ""}
      </style>
      <LandingProvider documento={documento} editor>
        <LandingPage />
      </LandingProvider>
    </>
  );
}
