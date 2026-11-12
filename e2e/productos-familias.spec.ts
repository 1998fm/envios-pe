import { test, expect } from "@playwright/test";
import { appApi, createUser, supabase } from "./support/stack";
import { abrirDashboard } from "./support/ui";
import { crearProducto, crearPersona, crearVenta } from "./support/app";
const datos = {
  nombre: "Polo integrado",
  descripcion: "Algodón",
  precio_base: 25.5,
  imagen_url: null,
  unidad: "unidad",
  opciones: ["Color"],
};

test("agrupar existentes conserva registros e históricos; herencia explícita, excepciones y separación", async () => {
  const u = await createUser(),
    api = await appApi(u.token),
    db = await supabase("service");
  const p = await crearProducto(api, {
      nombre: "Polo antiguo rojo",
      precio_venta: 30.5,
      stock_actual: 12,
    }),
    q = await crearProducto(api, {
      nombre: "Polo antiguo azul",
      precio_venta: 35.7,
      stock_actual: 8,
    });
  const cliente = await crearPersona(api);
  const venta = await crearVenta(api, cliente, [
    { producto_id: p.id, producto_nombre: p.nombre, precio_unitario: 30.5 },
  ]);
  expect(venta.status(), await venta.text()).toBe(200);
  const snapshot = async () => ({
    productos: await (
      await db.get(`/rest/v1/productos?profile_id=eq.${u.id}&order=id`)
    ).json(),
    ventas: await (
      await db.get(`/rest/v1/ventas?profile_id=eq.${u.id}&order=id`)
    ).json(),
    items: await (
      await db.get(`/rest/v1/venta_items?producto_id=eq.${p.id}&order=id`)
    ).json(),
    movimientos: await (
      await db.get(
        `/rest/v1/movimientos_inventario?profile_id=eq.${u.id}&order=id`,
      )
    ).json(),
  });
  const antes = await snapshot();
  let res = await api.post("/api/productos/familias", {
    data: {
      accion: "agrupar",
      datos,
      variantes: [
        { producto_id: p.id, opciones: { Color: "Rojo" } },
        { producto_id: q.id, opciones: { Color: "Azul" } },
      ],
    },
  });
  expect(res.status(), await res.text()).toBe(200);
  const id = (await res.json()).id;
  expect(await snapshot()).toEqual(antes);
  expect(
    (await (await api.get("/api/productos?catalogo=1")).json()).data,
  ).toHaveLength(0);
  expect((await (await api.get("/api/productos")).json()).data).toHaveLength(2);
  let ficha = await (await api.get(`/api/productos/familias?id=${id}`)).json();
  const guardar = (precio: number, variantes: unknown[] = []) =>
    api.post("/api/productos/familias", {
      data: {
        accion: "guardar",
        id,
        esperado: ficha.familia.updated_at,
        datos: { ...datos, precio_base: precio },
        variantes,
      },
    });
  res = await guardar(40.5);
  expect(res.status(), await res.text()).toBe(200);
  expect(
    (await (await db.get(`/rest/v1/productos?id=eq.${p.id}`)).json())[0]
      .precio_venta,
  ).toBe(30.5);
  res = await guardar(99);
  expect(res.status()).toBe(409);
  ficha = await (await api.get(`/api/productos/familias?id=${id}`)).json();
  res = await guardar(40.5, [
    { producto_id: p.id, opciones: { Color: "Rojo" }, precio_especial: false },
  ]);
  expect(res.status(), await res.text()).toBe(200);
  expect(
    (await (await db.get(`/rest/v1/productos?id=eq.${p.id}`)).json())[0]
      .precio_venta,
  ).toBe(40.5);
  const despues = await snapshot();
  expect(despues.ventas).toEqual(antes.ventas);
  expect(despues.items).toEqual(antes.items);
  expect(despues.movimientos).toEqual(antes.movimientos);
  ficha = await (await api.get(`/api/productos/familias?id=${id}`)).json();
  res = await api.post("/api/productos/familias", {
    data: {
      accion: "disolver",
      id,
      esperado: ficha.familia.updated_at,
      variantes: [],
    },
  });
  expect(res.status(), await res.text()).toBe(200);
  expect(
    (await (await api.get("/api/productos?catalogo=1")).json()).data,
  ).toHaveLength(2);
  expect((await snapshot()).productos).toEqual(despues.productos);
  await Promise.all([api.dispose(), db.dispose()]);
});

test("crear variantes atómicas, vender una variante y proteger stock concurrente y excepciones", async () => {
  const u = await createUser(),
    api = await appApi(u.token),
    db = await supabase("service");
  let res = await api.post("/api/productos/familias", {
    data: {
      accion: "crear",
      datos,
      variantes: [
        {
          opciones: { Color: "Rojo" },
          sku: "ROJO",
          stock_actual: 10,
          precio_compra: 10.2,
        },
        {
          opciones: { Color: "Azul" },
          sku: "AZUL",
          stock_actual: 7,
          precio_especial: true,
          precio_venta: 28.9,
        },
      ],
    },
  });
  expect(res.status(), await res.text()).toBe(200);
  const id = (await res.json()).id;
  let f = await (await api.get(`/api/productos/familias?id=${id}`)).json();
  expect(f.variantes).toHaveLength(2);
  const rojo = f.variantes.find(
      (v: { opciones: { Color: string } }) => v.opciones.Color === "Rojo",
    ),
    azul = f.variantes.find(
      (v: { opciones: { Color: string } }) => v.opciones.Color === "Azul",
    );
  const c = await crearPersona(api);
  res = await crearVenta(api, c, [
    { producto_id: rojo.producto_id, precio_unitario: 25.5 },
  ]);
  expect(res.status(), await res.text()).toBe(200);
  f = await (await api.get(`/api/productos/familias?id=${id}`)).json();
  res = await api.post("/api/productos/familias", {
    data: {
      accion: "guardar",
      id,
      esperado: f.familia.updated_at,
      datos: { ...datos, precio_base: 31.5 },
      variantes: [
        {
          producto_id: rojo.producto_id,
          opciones: { Color: "Rojo" },
          stock_actual: 15,
          stock_esperado: 10,
          motivo: "Inventario físico",
        },
      ],
    },
  });
  expect(res.status(), await res.text()).toBe(409);
  expect(
    (await (await api.get(`/api/productos/familias?id=${id}`)).json()).familia
      .precio_base,
  ).toBe(25.5);
  res = await api.post("/api/productos/familias", {
    data: {
      accion: "guardar",
      id,
      esperado: f.familia.updated_at,
      datos: { ...datos, precio_base: 31.5 },
      variantes: [],
    },
  });
  expect(res.status(), await res.text()).toBe(200);
  f = await (await api.get(`/api/productos/familias?id=${id}`)).json();
  expect(
    f.variantes.find(
      (v: { producto_id: string }) => v.producto_id === rojo.producto_id,
    ).producto,
  ).toMatchObject({ stock_actual: 9, precio_venta: 31.5 });
  expect(
    f.variantes.find(
      (v: { producto_id: string }) => v.producto_id === azul.producto_id,
    ).producto,
  ).toMatchObject({ stock_actual: 7, precio_venta: 28.9 });
  // Un SKU duplicado a mitad de la creación revierte toda la ficha y sus movimientos.
  res = await api.post("/api/productos/familias", {
    data: {
      accion: "crear",
      datos: { ...datos, nombre: "Rollback" },
      variantes: [
        { opciones: { Color: "Negro" }, sku: "NUEVO", stock_actual: 9 },
        { opciones: { Color: "Blanco" }, sku: "ROJO", stock_actual: 4 },
      ],
    },
  });
  expect(res.status()).toBe(409);
  expect(
    await (
      await db.get(`/rest/v1/productos_familias?profile_id=eq.${u.id}`)
    ).json(),
  ).toHaveLength(1);
  expect((await (await api.get("/api/productos")).json()).data).toHaveLength(2);
  await Promise.all([api.dispose(), db.dispose()]);
});

test("aislamiento de negocios, plan Básico y acceso directo cerrado", async () => {
  const a = await createUser(),
    b = await createUser(),
    basic = await createUser({ plan: "basic", trial: false }),
    api = await appApi(a.token),
    otro = await appApi(b.token),
    basico = await appApi(basic.token),
    anon = await appApi(null);
  const p = await crearProducto(otro);
  const res = await api.post("/api/productos/familias", {
    data: {
      accion: "agrupar",
      datos,
      variantes: [{ producto_id: p.id, opciones: { Color: "Ajeno" } }],
    },
  });
  expect(res.status()).toBe(400);
  expect((await (await api.get("/api/productos/familias")).json()).total).toBe(
    0,
  );
  expect((await basico.get("/api/productos/familias")).status()).toBe(403);
  expect((await anon.get("/api/productos/familias")).status()).toBe(401);
  for (const role of ["anon", { token: a.token }] as const) {
    const db = await supabase(role);
    expect((await db.get("/rest/v1/productos_familias")).ok()).toBe(false);
    expect(
      (
        await db.post("/rest/v1/rpc/gestionar_producto_familia", {
          data: {
            p_owner: a.id,
            p_accion: "crear",
            p_familia: null,
            p_esperado: null,
            p_datos: datos,
            p_variantes: [],
          },
        })
      ).ok(),
    ).toBe(false);
    await db.dispose();
  }
  await Promise.all([
    api.dispose(),
    otro.dispose(),
    basico.dispose(),
    anon.dispose(),
  ]);
});

test("interfaz crea una ficha con variantes y permite editar el precio general en móvil", async ({
  page,
}) => {
  const u = await createUser();
  await abrirDashboard(page, u, "productos");
  await page
    .getByRole("button", { name: "Nuevo producto con variantes", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Nombre general", exact: true })
    .fill("Polo visual");
  await page
    .getByRole("textbox", { name: "Precio general", exact: true })
    .fill("25.50");
  await page
    .getByRole("textbox", { name: "Valores 1", exact: true })
    .fill("Rojo, Azul, Negro");
  await page
    .getByRole("button", { name: "Generar combinaciones", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Guardar producto y variantes", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Editar producto y variantes",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar ficha", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Polo visual.*3 variantes/ }),
  ).toBeVisible();
  await page.setViewportSize({ width: 360, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /Polo visual.*3 variantes/ }).click();
  await page
    .getByRole("textbox", { name: "Precio general", exact: true })
    .fill("32.90");
  await page
    .getByRole("button", { name: "Guardar producto y variantes", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("guardados");
  const api = await appApi(u.token);
  const productos = (await (await api.get("/api/productos")).json()).data;
  expect(productos).toHaveLength(3);
  expect(
    productos.every((p: { precio_venta: number }) => p.precio_venta === 32.9),
  ).toBe(true);
  await api.dispose();
});
