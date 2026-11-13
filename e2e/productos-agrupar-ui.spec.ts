import { expect, test } from "./support/test";
import { appApi, createUser, randomIp, dbSelect } from "./support/stack";
import { crearProducto } from "./support/app";
import { abrirDashboard } from "./support/ui";

test("Agrupar muestra primero los datos generales, lleva al campo faltante y conserva los productos", async ({
  page,
  context,
}) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
  const u = await createUser(),
    api = await appApi(u.token);
  const p = await crearProducto(api, {
    nombre: "Biker denim 30 - azul",
    precio_venta: 58,
    precio_compra: 35,
    stock_actual: 1,
  });
  const q = await crearProducto(api, {
    nombre: "Biker denim 32 - celeste",
    precio_venta: 59.5,
    precio_compra: 36.25,
    stock_actual: 2,
  });
  const antes = await dbSelect("productos", `profile_id=eq.${u.id}&order=id`);
  await abrirDashboard(page, u, "productos");
  await page.getByRole("button", { name: "Variantes", exact: true }).click();
  await page.getByRole("button", { name: /Agrupar existentes/ }).click();
  const modal = page.getByRole("dialog", {
    name: "Agrupar productos existentes",
    exact: true,
  });
  const nombre = modal.getByRole("textbox", {
    name: "Nombre general",
    exact: true,
  });
  await expect(nombre).toBeInViewport();
  await modal
    .getByRole("button", { name: "Agrupar sin cambiar datos", exact: true })
    .click();
  await expect(nombre).toBeFocused();
  await expect(modal.getByRole("alert")).toContainText("Escribe el nombre");
  await nombre.fill("Biker denim");
  await modal
    .getByRole("textbox", { name: "Precio general", exact: true })
    .fill("59.00");
  await modal
    .getByRole("combobox", { name: "Nombre de opción 1", exact: true })
    .selectOption("Talla");
  await modal.getByRole("checkbox", { name: new RegExp(p.nombre) }).check();
  await modal.getByRole("checkbox", { name: new RegExp(q.nombre) }).check();
  await page.setViewportSize({ width: 360, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  page.once("dialog", (d) => d.accept());
  await modal
    .getByRole("button", { name: "Agrupar sin cambiar datos", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Editar producto y variantes",
      exact: true,
    }),
  ).toBeVisible();
  expect(await dbSelect("productos", `profile_id=eq.${u.id}&order=id`)).toEqual(
    antes,
  );
  const familias = (await (await api.get("/api/productos/familias")).json())
    .data;
  expect(familias).toHaveLength(1);
  expect(familias[0]).toMatchObject({ nombre: "Biker denim", cantidad: 2 });
  await api.dispose();
});
