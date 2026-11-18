type UltimaLectura = { clave: string; revision: string } | null;
export type ControlLectura = { current: UltimaLectura };

/** El control pertenece al componente y su URL completa, nunca a una caché global. */
export async function leerConRevision(
  url: string,
  control: ControlLectura,
  comprobar = false,
) {
  const params = new URLSearchParams({ control_cambios: "1" });
  if (comprobar && control.current?.clave === url)
    params.set("revision", control.current.revision);
  const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}${params}`);
  const json = await res.json();
  if (res.ok && typeof json.revision === "string")
    control.current = { clave: url, revision: json.revision };
  return { res, json };
}
