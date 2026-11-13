"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

/** Carga el video al abrir la ayuda y conserva el formulario que queda detrás. */
type Props = {
  titulo: string;
  etiquetaBoton: string;
  video: string;
  portada: string;
  guia: string;
  duracion?: string;
  tono?: "claro" | "oscuro";
};
export default function TutorialEnVideo({
  titulo,
  etiquetaBoton,
  video,
  portada,
  guia,
  duracion,
  tono = "claro",
}: Props) {
  const tituloId = useId();
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const disparador = boton.current;
    cerrar.current?.focus();
    const fondo = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')]
      .filter((el) => el !== dialogo.current && !el.contains(dialogo.current))
      .map((el) => ({ el, inert: el.inert }));
    fondo.forEach(({ el }) => {
      el.inert = true;
    });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      fondo.forEach(({ el, inert }) => {
        el.inert = inert;
      });
      document.body.style.overflow = overflow;
      disparador?.focus();
    };
  }, [abierto]);

  return (
    <>
      <button
        ref={boton}
        type="button"
        aria-label={etiquetaBoton}
        aria-haspopup="dialog"
        title={titulo}
        onClick={() => setAbierto(true)}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${tono === "claro" ? "border-white/25 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:outline-tori-600"}`}
      >
        <Info size={18} />
      </button>
      {abierto &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) setAbierto(false);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Escape") {
                e.preventDefault();
                setAbierto(false);
              }
              if (e.key !== "Tab") return;
              const elementos = [
                ...dialogo.current!.querySelectorAll<HTMLElement>(
                  "button, a, video",
                ),
              ].filter((el) => el.getClientRects().length);
              const primero = elementos[0],
                ultimo = elementos.at(-1);
              if (e.shiftKey && document.activeElement === primero) {
                e.preventDefault();
                ultimo?.focus();
              } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault();
                primero?.focus();
              }
            }}
          >
            <div
              ref={dialogo}
              role="dialog"
              aria-modal="true"
              aria-labelledby={tituloId}
              className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
            >
              <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-tori-700 to-tori-600 px-6 py-5">
                <div
                  className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
                  aria-hidden
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[1.5px] text-tori-200">
                      Guía visual{duracion ? ` · ${duracion}` : ""}
                    </p>
                    <h3
                      id={tituloId}
                      className="mt-1 text-2xl font-extrabold tracking-tight text-white"
                    >
                      {titulo}
                    </h3>
                  </div>
                  <button
                    ref={cerrar}
                    type="button"
                    aria-label="Cerrar tutorial"
                    onClick={() => setAbierto(false)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                <video
                  controls
                  autoPlay
                  playsInline
                  tabIndex={0}
                  preload="metadata"
                  poster={portada}
                  aria-label={titulo}
                  className="mx-auto max-h-[65vh] w-full rounded-2xl bg-slate-950 object-contain"
                >
                  <source src={video} type="video/mp4" />
                  Tu navegador no puede reproducir el video. Puedes abrir la
                  guía completa con el enlace de abajo.
                </video>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Puedes pausar y repetir. En celular, gira la pantalla y usa
                  pantalla completa para ver mejor los campos.
                </p>
              </div>
              <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                <a
                  href={guia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-tori-700 underline-offset-4 hover:underline"
                >
                  Abrir guía completa ↗
                </a>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="min-h-12 rounded-xl bg-gradient-to-r from-tori-600 to-tori-700 px-5 text-sm font-extrabold text-white shadow-lg shadow-tori-600/30"
                >
                  Volver
                </button>
              </footer>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
