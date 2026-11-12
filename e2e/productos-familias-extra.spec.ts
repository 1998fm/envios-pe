import { test, expect } from "@playwright/test";
import { appApi, createUser, dbInsert, supabase } from "./support/stack";
const datos = {
  nombre: "Modelo",
  descripcion: "General",
  precio_base: 25.5,
  unidad: "unidad",
  imagen_url: null,
  opciones: ["Color"],
};
test("compras operan por variante; la edición individual marca excepción y conserva histórico", async () => {
  const u = await createUser(),
    api = await appApi(u.token),
    db = await supabase("service");
  let r = await api.post("/api/productos/familias", {
    data: {
      accion: "crear",
      datos,
      variantes: [
        { opciones: { Color: "Rojo" }, stock_actual: 10 },
        { opciones: { Color: "Azul" }, stock_actual: 8 },
      ],
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  const id = (await r.json()).id;
  let f = await (await api.get(`/api/productos/familias?id=${id}`)).json();
  const rojo = f.variantes.find(
    (v: { opciones: { Color: string } }) => v.opciones.Color === "Rojo",
  ).producto;
  r = await api.post("/api/compras", {
    data: {
      proveedor: "Proveedor",
      items: [
        {
          producto_id: rojo.id,
          producto_nombre: rojo.nombre,
          cantidad: 3,
          precio_unitario: 12.75,
        },
      ],
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  const compra = await (
    await db.get(`/rest/v1/compra_items?producto_id=eq.${rojo.id}`)
  ).json();
  r = await api.put(`/api/productos/${rojo.id}`, {
    data: {
      ...rojo,
      precio_venta: 55.75,
      precio_compra: 12.75,
      stock_actual: undefined,
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  f = await (await api.get(`/api/productos/familias?id=${id}`)).json();
  expect(
    f.variantes.find((v: { producto_id: string }) => v.producto_id === rojo.id)
      .precio_especial,
  ).toBe(true);
  r = await api.post("/api/productos/familias", {
    data: {
      accion: "guardar",
      id,
      esperado: f.familia.updated_at,
      datos: { ...datos, precio_base: 35.9 },
      variantes: [],
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  f = await (await api.get(`/api/productos/familias?id=${id}`)).json();
  expect(
    f.variantes.find((v: { producto_id: string }) => v.producto_id === rojo.id)
      .producto,
  ).toMatchObject({ stock_actual: 13, precio_venta: 55.75 });
  expect(
    f.variantes.find((v: { producto_id: string }) => v.producto_id !== rojo.id)
      .producto,
  ).toMatchObject({ stock_actual: 8, precio_venta: 35.9 });
  expect(
    await (
      await db.get(`/rest/v1/compra_items?producto_id=eq.${rojo.id}`)
    ).json(),
  ).toEqual(compra);
  await Promise.all([api.dispose(), db.dispose()]);
});
test("un miembro sin ganancias edita la ficha sin obtener ni modificar costos", async () => {
  const u = await createUser(),
    m = await createUser({ plan: "basic" }),
    api = await appApi(u.token);
  const rol = await dbInsert<{ id: string }>("business_roles", {
    owner_id: u.id,
    nombre: "Catálogo sin costos",
    vista_default: "productos",
    permisos: { ver_productos: true, ver_ganancia_producto: false },
  });
  await dbInsert("business_members", {
    owner_id: u.id,
    user_id: m.id,
    role_id: rol.id,
  });
  const miembro = await appApi(m.token);
  let r = await api.post("/api/productos/familias", {
    data: {
      accion: "crear",
      datos,
      variantes: [
        { opciones: { Color: "Rojo" }, stock_actual: 10, precio_compra: 19.55 },
      ],
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  const id = (await r.json()).id;
  const f = await (
    await miembro.get(`/api/productos/familias?id=${id}`)
  ).json();
  expect(JSON.stringify(f)).not.toContain("precio_compra");
  expect(
    JSON.stringify(await (await miembro.get("/api/productos/familias")).json()),
  ).not.toContain("precio_compra");
  r = await miembro.post("/api/productos/familias", {
    data: {
      accion: "guardar",
      id,
      esperado: f.familia.updated_at,
      datos: { ...datos, precio_base: 39.9 },
      variantes: [
        {
          producto_id: f.variantes[0].producto_id,
          opciones: { Color: "Rojo" },
          precio_compra: 0,
        },
      ],
    },
  });
  expect(r.status()).toBe(400);
  r = await miembro.post("/api/productos/familias", {
    data: {
      accion: "guardar",
      id,
      esperado: f.familia.updated_at,
      datos: { ...datos, precio_base: 39.9 },
      variantes: [],
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  const actualizado = await (
    await api.get(`/api/productos/familias?id=${id}`)
  ).json();
  expect(actualizado.variantes[0].producto.precio_compra).toBe(19.55);
  await Promise.all([api.dispose(), miembro.dispose()]);
});
