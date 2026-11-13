import { expect, test } from "./support/test";
import { appApi, createUser, randomIp, dbSelect } from "./support/stack";
import { crearPersona, crearVenta } from "./support/app";
import { abrirDashboard } from "./support/ui";
import type { APIRequestContext } from "@playwright/test";
async function crear(api: APIRequestContext) {
  const r = await api.post("/api/productos/familias", {
    data: {
      accion: "crear",
      datos: {
        nombre: "Serie para eliminar",
        descripcion: "Ejemplo",
        precio_base: 25.5,
        unidad: "unidad",
        imagen_url: null,
        opciones: ["Color"],
      },
      variantes: [
        { opciones: { Color: "Rojo" }, stock_actual: 10 },
        { opciones: { Color: "Azul" }, stock_actual: 8 },
      ],
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  const { id } = await r.json();
  return (await api.get(`/api/productos/familias?id=${id}`)).json();
}
test("Eliminación completa: cancelar conserva y confirmar borra ficha y variantes sin borrar compras ni ventas", async ({
  page,
  context,
}) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
  const u = await createUser(),
    api = await appApi(u.token);
  const f = await crear(api),
    p = f.variantes[0].producto;
  const persona = await crearPersona(api);
  await crearVenta(api, persona, [
    {
      producto_id: p.id,
      producto_nombre: p.nombre,
      cantidad: 1,
      precio_unitario: 25.5,
    },
  ]);
  const compra = await api.post("/api/compras", {
    data: {
      proveedor: "Proveedor anterior",
      items: [
        {
          producto_id: p.id,
          producto_nombre: p.nombre,
          cantidad: 2,
          precio_unitario: 12.5,
        },
      ],
    },
  });
  expect(compra.status()).toBe(200);
  const ventaAntes = (
    await dbSelect("venta_items", `producto_id=eq.${p.id}`)
  )[0];
  const compraAntes = (
    await dbSelect("compra_items", `producto_id=eq.${p.id}`)
  )[0];
  await abrirDashboard(page, u, "productos");
  await page.getByRole("button", { name: "Variantes", exact: true }).click();
  await page
    .getByRole("button", { name: /Serie para eliminar.*2 variantes/ })
    .click();
  const boton = page.getByRole("button", {
    name: "Eliminar producto y todas sus variantes",
    exact: true,
  });
  page.once("dialog", (d) => d.dismiss());
  await boton.click();
  expect(
    (await api.get(`/api/productos/familias?id=${f.familia.id}`)).status(),
  ).toBe(200);
  page.once("dialog", async (d) => {
    expect(d.message()).toContain("2 variantes");
    await d.accept();
  });
  await boton.click();
  await expect(page.getByRole("status")).toContainText(
    "todas sus variantes eliminados",
  );
  expect(
    (await api.get(`/api/productos/familias?id=${f.familia.id}`)).status(),
  ).toBe(404);
  expect(
    (await (await api.get("/api/productos?limit=1000")).json()).data,
  ).toHaveLength(0);
  expect(
    await dbSelect("producto_variantes", `familia_id=eq.${f.familia.id}`),
  ).toHaveLength(0);
  const ventaDespues = (
    await dbSelect("venta_items", `id=eq.${ventaAntes.id}`)
  )[0];
  const compraDespues = (
    await dbSelect("compra_items", `id=eq.${compraAntes.id}`)
  )[0];
  expect(ventaDespues).toEqual({ ...ventaAntes, producto_id: null });
  expect(compraDespues).toEqual({ ...compraAntes, producto_id: null });
  expect(
    await dbSelect("movimientos_inventario", `producto_id=eq.${p.id}`),
  ).toHaveLength(0);
  await api.dispose();
});
test("Eliminar ficha exige confirmación, sesión, plan, propietario y versión vigente", async () => {
  const u = await createUser(),
    api = await appApi(u.token),
    otro = await appApi((await createUser()).token),
    basico = await appApi(
      (await createUser({ plan: "basic", trial: false })).token,
    ),
    anon = await appApi(null);
  const f = await crear(api),
    datos = {
      id: f.familia.id,
      esperado: f.familia.updated_at,
      confirmar: true,
    };
  expect(
    (await anon.delete("/api/productos/familias", { data: datos })).status(),
  ).toBe(401);
  expect(
    (await basico.delete("/api/productos/familias", { data: datos })).status(),
  ).toBe(403);
  expect(
    (await otro.delete("/api/productos/familias", { data: datos })).status(),
  ).toBe(404);
  expect(
    (
      await api.delete("/api/productos/familias", {
        data: { ...datos, confirmar: false },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await api.delete("/api/productos/familias", {
        data: { ...datos, esperado: "2000-01-01T00:00:00Z" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (await (await api.get("/api/productos?limit=1000")).json()).data,
  ).toHaveLength(2);
  await Promise.all([
    api.dispose(),
    otro.dispose(),
    basico.dispose(),
    anon.dispose(),
  ]);
});
