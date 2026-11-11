export const SECCIONES_LANDING = [
  ["navegacion", "Menú de navegación"],
  ["inicio", "Portada"],
  ["diagnostico", "¿Te pasa esto?"],
  ["problema", "El problema y el flujo"],
  ["comparacion", "Antes y después"],
  ["demo", "Demostración del dashboard"],
  ["funciones", "Funciones y soluciones"],
  ["facilidad", "Facilidad de uso"],
  ["momento", "Mensaje de Tori"],
  ["historias", "Testimonios"],
  ["paraquien", "Para quién es Tori"],
  ["pasos", "Primeros pasos"],
  ["precios", "Planes y precios"],
  ["faq", "Preguntas frecuentes"],
  ["cierre", "Llamada final a la acción"],
  ["pie", "Pie de página"],
  ["movil", "Botón flotante en celular"],
] as const;
export type TextoLanding = {
  texto: string;
  color?: string;
  tamano?: number;
  negrita?: boolean;
  oculto?: boolean;
};
export type SeccionLanding = {
  id: string;
  nombre: string;
  visible: boolean;
  eliminada: boolean;
  fondo?: string;
  imagen?: string;
  imagenAlt?: string;
  titulo?: string;
  descripcion?: string;
  boton?: string;
  enlace?: string;
};
export type DocumentoLanding = {
  schema: 1;
  secciones: SeccionLanding[];
  textos: Record<string, TextoLanding>;
  enlaces: Record<string, string>;
  seo: { titulo: string; descripcion: string };
};
export const SEO_LANDING = {
  titulo:
    "Vender por WhatsApp debería darte más ventas, no más desorden — Tori",
  descripcion:
    "Tori es el compañero de negocio de los emprendedores que venden por WhatsApp. Organiza tus pedidos, ventas, inventario y envíos para perder menos tiempo ordenando y tener más tiempo para vender. 14 días gratis, sin tarjeta.",
};
export function landingInicial(): DocumentoLanding {
  return {
    schema: 1,
    secciones: SECCIONES_LANDING.map(([id, nombre]) => ({
      id,
      nombre,
      visible: true,
      eliminada: false,
    })),
    textos: {},
    enlaces: {},
    seo: { ...SEO_LANDING },
  };
}
export function claveTexto(valor: string): string {
  let hash = 2166136261;
  for (let i = 0; i < valor.length; i++)
    hash = Math.imul(hash ^ valor.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
}
export function enlaceLandingSeguro(valor: string): boolean {
  if (!valor || valor.length > 2048 || /[\u0000-\u0020\\]/.test(valor))
    return false;
  if (/^#[a-zA-Z][\w-]*$/.test(valor)) return true;
  if (/^\/(?!\/)/.test(valor)) return true;
  try {
    const url = new URL(valor);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function imagenLandingSegura(valor: string): boolean {
  if (!valor) return true;
  if (valor.startsWith("/media/"))
    return !valor.includes("..") && !/[?#\\]/.test(valor);
  try {
    return new URL(valor).protocol === "https:" && enlaceLandingSeguro(valor);
  } catch {
    return false;
  }
}
export function validarDocumentoLanding(v: unknown): v is DocumentoLanding {
  if (!v || typeof v !== "object") return false;
  const d = v as DocumentoLanding;
  if (
    d.schema !== 1 ||
    !Array.isArray(d.secciones) ||
    d.secciones.length > 50 ||
    !d.textos ||
    !d.enlaces ||
    !d.seo
  )
    return false;
  const ids = new Set<string>();
  for (const s of d.secciones) {
    if (
      !s ||
      typeof s.id !== "string" ||
      !/^(?:[a-z]+|custom-[\w-]{1,50})$/.test(s.id) ||
      ids.has(s.id)
    )
      return false;
    ids.add(s.id);
    if (
      typeof s.nombre !== "string" ||
      s.nombre.length > 150 ||
      typeof s.visible !== "boolean" ||
      typeof s.eliminada !== "boolean"
    )
      return false;
    if (
      !SECCIONES_LANDING.some(([id]) => id === s.id) &&
      !s.id.startsWith("custom-")
    )
      return false;
    for (const k of ["titulo", "descripcion", "boton", "imagenAlt"] as const)
      if (
        s[k] !== undefined &&
        (typeof s[k] !== "string" || s[k]!.length > 10000)
      )
        return false;
    if (s.fondo && !/^#[0-9a-fA-F]{6}$/.test(s.fondo)) return false;
    if (
      s.imagen &&
      (typeof s.imagen !== "string" || !imagenLandingSegura(s.imagen))
    )
      return false;
    if (
      s.enlace &&
      (typeof s.enlace !== "string" || !enlaceLandingSeguro(s.enlace))
    )
      return false;
  }
  if (!SECCIONES_LANDING.every(([id]) => ids.has(id))) return false;
  if (
    Object.keys(d.textos).length > 1500 ||
    Object.keys(d.enlaces).length > 300
  )
    return false;
  for (const [k, t] of Object.entries(d.textos)) {
    if (
      !/^[\w-]+:[\w-]+$/.test(k) ||
      !t ||
      typeof t.texto !== "string" ||
      t.texto.length > 10000
    )
      return false;
    if (t.color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(t.color))
      return false;
    if (
      t.tamano !== undefined &&
      (!Number.isFinite(t.tamano) || t.tamano < 8 || t.tamano > 100)
    )
      return false;
    if (t.negrita !== undefined && typeof t.negrita !== "boolean") return false;
    if (t.oculto !== undefined && typeof t.oculto !== "boolean") return false;
  }
  for (const [k, valor] of Object.entries(d.enlaces))
    if (
      !/^[\w-]+:[\w-]+$/.test(k) ||
      typeof valor !== "string" ||
      !enlaceLandingSeguro(valor)
    )
      return false;
  return (
    typeof d.seo.titulo === "string" &&
    d.seo.titulo.length <= 180 &&
    typeof d.seo.descripcion === "string" &&
    d.seo.descripcion.length <= 500
  );
}

/** No enviar a visitantes los textos personalizados de secciones retiradas. */
export function documentoParaPublico(d: DocumentoLanding): DocumentoLanding {
  const visibles = new Set(
    d.secciones.filter((s) => s.visible && !s.eliminada).map((s) => s.id),
  );
  return {
    ...d,
    secciones: d.secciones.map((s) =>
      visibles.has(s.id)
        ? s
        : { id: s.id, nombre: "", visible: false, eliminada: s.eliminada },
    ),
    textos: Object.fromEntries(
      Object.entries(d.textos)
        .filter(([k]) => visibles.has(k.split(":")[0]))
        .map(([k, t]) => [k, t.oculto ? { texto: "", oculto: true } : t]),
    ),
    enlaces: Object.fromEntries(
      Object.entries(d.enlaces).filter(([k]) => visibles.has(k.split(":")[0])),
    ),
  };
}
