"use client";

import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  type ReactNode,
  type Ref,
  type ComponentProps,
} from "react";
import Link from "next/link";
import Image from "next/image";
import LogoTori from "@/components/LogoTori";
import {
  claveTexto,
  enlaceLandingSeguro,
  type DocumentoLanding,
  type SeccionLanding,
} from "@/lib/landing/model";

const LandingContext = createContext<{
  documento: DocumentoLanding;
  editor: boolean;
} | null>(null);
const SeccionContext = createContext("inicio");
export function LandingProvider({
  documento,
  editor = false,
  children,
}: {
  documento: DocumentoLanding;
  editor?: boolean;
  children: ReactNode;
}) {
  return (
    <LandingContext.Provider value={{ documento, editor }}>
      {children}
    </LandingContext.Provider>
  );
}
export function LandingValue({ value }: { value: ReactNode }) {
  const ctx = useContext(LandingContext);
  const seccion = useContext(SeccionContext);
  if (typeof value !== "string" || !value.trim() || !ctx) return <>{value}</>;
  const key = `${seccion}:${claveTexto(value)}`;
  const cambio = ctx.documento.textos[key];
  if (cambio?.oculto && !ctx.editor) return null;
  if (!cambio && !ctx.editor) return <>{value}</>;
  return (
    <span
      data-landing-text={ctx.editor ? key : undefined}
      data-original={ctx.editor ? value : undefined}
      style={{
        color: cambio?.color,
        fontSize: cambio?.tamano ? `${cambio.tamano}px` : undefined,
        fontWeight:
          cambio?.negrita === undefined
            ? undefined
            : cambio.negrita
              ? 800
              : 400,
        opacity: cambio?.oculto ? 0.35 : undefined,
        whiteSpace: cambio ? "pre-wrap" : undefined,
      }}
    >
      {cambio?.texto ?? value}
    </span>
  );
}
function useDestino(href: string) {
  const ctx = useContext(LandingContext);
  const seccion = useContext(SeccionContext);
  const key = `${seccion}:${claveTexto(href)}`;
  const cambio = ctx?.documento.enlaces[key];
  const destino = cambio && enlaceLandingSeguro(cambio) ? cambio : href;
  const anchor = destino.startsWith("#") ? destino.slice(1) : null;
  const hidden =
    anchor &&
    ctx?.documento.secciones.some(
      (s) =>
        s.id === (anchor === "solucion" ? "comparacion" : anchor) &&
        (!s.visible || s.eliminada),
    );
  return { href: destino, key, editor: ctx?.editor, hidden };
}
export function LandingLink({ href, ...props }: ComponentProps<typeof Link>) {
  const d = useDestino(
    typeof href === "string" ? href : (href.pathname ?? "/"),
  );
  if (d.hidden && !d.editor) return null;
  return (
    <Link
      {...props}
      href={d.href}
      data-landing-link={d.editor ? d.key : undefined}
      data-original-href={d.editor ? String(href) : undefined}
    />
  );
}
export function LandingAnchor({
  href = "#inicio",
  ...props
}: ComponentProps<"a">) {
  const d = useDestino(href);
  if (d.hidden && !d.editor) return null;
  return (
    <a
      {...props}
      href={d.href}
      data-landing-link={d.editor ? d.key : undefined}
      data-original-href={d.editor ? href : undefined}
    />
  );
}
export function LandingLogo({ size = 28 }: { size?: number }) {
  const ctx = useContext(LandingContext);
  const id = useContext(SeccionContext);
  const imagen = ctx?.documento.secciones.find((s) => s.id === id)?.imagen;
  return imagen ? (
    <Image
      unoptimized
      width={size}
      height={size}
      src={imagen}
      alt="Logo"
      className="object-contain"
    />
  ) : (
    <LogoTori size={size} />
  );
}
export function LandingSection({
  id,
  children,
  elementRef,
}: {
  id: string;
  children: ReactNode;
  elementRef?: Ref<HTMLDivElement>;
}) {
  const ctx = useContext(LandingContext);
  const seccion = ctx?.documento.secciones.find((s) => s.id === id);
  const visible = !seccion || (seccion.visible && !seccion.eliminada);
  return (
    <SeccionContext.Provider value={id}>
      <div
        ref={elementRef}
        data-landing-section={id}
        style={{
          display: !visible
            ? "none"
            : elementRef || seccion?.fondo || seccion?.imagen
              ? "block"
              : "contents",
          backgroundColor: seccion?.fondo,
        }}
      >
        {visible && (
          <>
            {seccion?.fondo && (
              <style>{`[data-landing-section="${id}"] > section, [data-landing-section="${id}"] > footer, [data-landing-section="${id}"] > header nav {background-color:${seccion.fondo}}`}</style>
            )}
            {seccion?.imagen && !["navegacion", "pie"].includes(id) && (
              <div className="mx-auto max-w-6xl px-6 pt-8">
                <Image
                  unoptimized
                  width={1200}
                  height={400}
                  src={seccion.imagen}
                  alt={seccion.imagenAlt || ""}
                  className="max-h-96 w-full rounded-2xl object-cover"
                />
              </div>
            )}
            {children}
          </>
        )}
      </div>
    </SeccionContext.Provider>
  );
}
function CustomSection({ seccion }: { seccion: SeccionLanding }) {
  return (
    <LandingSection id={seccion.id}>
      <section id={seccion.id} className="px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-black text-slate-900">
            {seccion.titulo}
          </h2>
          <p className="mt-6 whitespace-pre-wrap text-lg text-slate-600">
            {seccion.descripcion}
          </p>
          {seccion.boton && seccion.enlace && (
            <LandingLink
              href={seccion.enlace}
              className="mt-8 inline-flex rounded-xl bg-sky-600 px-7 py-3 font-bold text-white"
            >
              {seccion.boton}
            </LandingLink>
          )}
        </div>
      </section>
    </LandingSection>
  );
}
export function LandingSections({ children }: { children: ReactNode }) {
  const ctx = useContext(LandingContext);
  const disponibles = new Map(
    Children.toArray(children)
      .filter(isValidElement)
      .map((el) => [(el.props as { id: string }).id, el]),
  );
  if (!ctx) return <>{children}</>;
  return (
    <>
      {ctx.documento.secciones.map((s) =>
        s.id.startsWith("custom-") ? (
          <CustomSection key={s.id} seccion={s} />
        ) : (
          <Fragment key={s.id}>{disponibles.get(s.id)}</Fragment>
        ),
      )}
    </>
  );
}
