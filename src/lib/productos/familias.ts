import "server-only";
import { desdeProxy } from "@/lib/mediaUrl";
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function imagenProducto(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 500)
    throw new Error("Imagen no válida");
  const canonical = desdeProxy(value);
  if (
    !canonical.startsWith(desdeProxy("/media/productos/")) ||
    canonical.includes("..")
  )
    throw new Error("La imagen debe subirse al catálogo");
  return canonical;
}
function objeto(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function importe(v: unknown) {
  return (
    typeof v === "number" &&
    Number.isFinite(v) &&
    v >= 0 &&
    v <= 99999999.99 &&
    Math.abs(v * 100 - Math.round(v * 100)) < 0.00001
  );
}
export function validarFamilia(body: unknown, verCosto: boolean) {
  if (
    !objeto(body) ||
    !["crear", "agrupar", "guardar", "desvincular", "disolver"].includes(
      String(body.accion),
    )
  )
    throw new Error("Acción no válida");
  const accion = String(body.accion);
  const id = typeof body.id === "string" && UUID.test(body.id) ? body.id : null;
  if (
    !["crear", "agrupar"].includes(accion) &&
    (!id ||
      typeof body.esperado !== "string" ||
      !Number.isFinite(Date.parse(body.esperado)))
  )
    throw new Error("Actualiza la ficha antes de continuar");
  if (!Array.isArray(body.variantes) || body.variantes.length > 200)
    throw new Error("Máximo 200 variantes por operación");
  if (["crear", "agrupar"].includes(accion) && !body.variantes.length)
    throw new Error("Añade al menos una variante");
  if (["desvincular", "disolver"].includes(accion)) {
    if (accion === "desvincular" && body.variantes.length === 0)
      throw new Error("Selecciona las variantes");
    return {
      accion,
      id,
      esperado: body.esperado ?? null,
      datos: {},
      variantes: body.variantes.map((v) => {
        if (
          !objeto(v) ||
          typeof v.producto_id !== "string" ||
          !UUID.test(v.producto_id)
        )
          throw new Error("Variante no válida");
        return { producto_id: v.producto_id };
      }),
    };
  }
  const d = body.datos;
  if (
    !objeto(d) ||
    typeof d.nombre !== "string" ||
    !d.nombre.trim() ||
    d.nombre.trim().length > 200 ||
    !importe(d.precio_base) ||
    !Array.isArray(d.opciones) ||
    d.opciones.length < 1 ||
    d.opciones.length > 3
  )
    throw new Error(
      "Completa el nombre, el precio y las opciones del producto",
    );
  const opciones = d.opciones.map((x) => {
    if (
      typeof x !== "string" ||
      !x.trim() ||
      x.length > 40 ||
      ["__proto__", "prototype", "constructor"].includes(x.trim())
    )
      throw new Error("Nombre de opción no válido");
    return x.trim();
  });
  if (new Set(opciones.map((x) => x.toLowerCase())).size !== opciones.length)
    throw new Error("No repitas las opciones");
  if (
    d.descripcion !== null &&
    d.descripcion !== undefined &&
    (typeof d.descripcion !== "string" || d.descripcion.length > 5000)
  )
    throw new Error("Descripción demasiado larga");
  if (typeof d.unidad !== "string" || !d.unidad || d.unidad.length > 30)
    throw new Error("Unidad no válida");
  const datos = {
    nombre: d.nombre.trim(),
    descripcion: d.descripcion ?? null,
    precio_base: d.precio_base,
    imagen_url: imagenProducto(d.imagen_url ?? null),
    unidad: d.unidad,
    opciones,
  };
  const combinations = new Set<string>(),
    ids = new Set<string>();
  const variantes = body.variantes.map((v) => {
    if (
      !objeto(v) ||
      !objeto(v.opciones) ||
      Object.keys(v.opciones).length !== opciones.length
    )
      throw new Error("Completa las opciones de cada variante");
    const opcionesVariante = v.opciones;
    const valores = Object.fromEntries(
      opciones.map((k) => {
        const value = opcionesVariante[k];
        if (
          typeof value !== "string" ||
          !value.trim() ||
          value.trim().length > 100
        )
          throw new Error("Completa las opciones de cada variante");
        return [k, value.trim()];
      }),
    );
    const key = JSON.stringify(opciones.map((k) => valores[k].toLowerCase()));
    if (combinations.has(key))
      throw new Error("Hay variantes con la misma combinación");
    combinations.add(key);
    const result: Record<string, unknown> = { opciones: valores };
    if (v.producto_id) {
      if (
        typeof v.producto_id !== "string" ||
        !UUID.test(v.producto_id) ||
        ids.has(v.producto_id)
      )
        throw new Error("Producto repetido o no válido");
      ids.add(v.producto_id);
      result.producto_id = v.producto_id;
    }
    if (accion === "agrupar") {
      if (!result.producto_id)
        throw new Error("Selecciona productos existentes");
      return result;
    }
    for (const k of [
      "precio_especial",
      "nombre_especial",
      "descripcion_especial",
      "imagen_especial",
      "archivado",
    ])
      if (v[k] !== undefined) {
        if (typeof v[k] !== "boolean") throw new Error("Opción no válida");
        result[k] = v[k];
      }
    for (const k of ["precio_venta", "precio_compra"])
      if (v[k] !== undefined) {
        if (k === "precio_compra" && !verCosto)
          throw new Error("No tienes permiso para editar costos");
        if (!importe(v[k])) throw new Error("Precio no válido");
        result[k] = v[k];
      }
    if (v.precio_especial === true && v.precio_venta === undefined)
      throw new Error("Indica el precio especial");
    for (const k of ["stock_actual", "stock_minimo", "stock_esperado"])
      if (v[k] !== undefined) {
        if (
          typeof v[k] !== "number" ||
          !Number.isSafeInteger(v[k]) ||
          Number(v[k]) < 0 ||
          Number(v[k]) > 2147483647
        )
          throw new Error("El stock debe ser un entero positivo o cero");
        result[k] = v[k];
      }
    if (v.producto_id && v.stock_actual !== undefined) {
      if (
        v.stock_esperado === undefined ||
        typeof v.motivo !== "string" ||
        v.motivo.trim().length < 3 ||
        v.motivo.length > 500
      )
        throw new Error(
          "Indica el motivo y actualiza el stock antes de ajustarlo",
        );
      result.motivo = v.motivo.trim();
    }
    for (const [k, max] of [
      ["nombre", 300],
      ["descripcion", 5000],
      ["sku", 100],
    ] as const)
      if (v[k] !== undefined) {
        if (
          v[k] !== null &&
          (typeof v[k] !== "string" || String(v[k]).length > max)
        )
          throw new Error("Texto de variante demasiado largo");
        if (k === "nombre" && !String(v[k] ?? "").trim())
          throw new Error("El nombre no puede estar vacío");
        result[k] = v[k];
      }
    if (v.imagen_url !== undefined)
      result.imagen_url = imagenProducto(v.imagen_url);
    return result;
  });
  return { accion, id, esperado: body.esperado ?? null, datos, variantes };
}
