import { expect, test } from "./support/test";
import { appApi, createUser, randomIp } from "./support/stack";
import { crearProducto, stockDe } from "./support/app";
import { abrirDashboard } from "./support/ui";

test("Editar precio conserva el stock actualizado y persiste decimales", async ({
  page,
  context,
}) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
  const u = await createUser();
  const api = await appApi(u.token);
  const p = await crearProducto(api, {
    nombre: "Biker denim 30 - azul",
    precio_venta: 58,
    precio_compra: 35,
    stock_actual: 8,
  });
  await abrirDashboard(page, u, "productos");
  const fila = page
    .getByRole("row")
    .filter({ has: page.getByText(p.nombre, { exact: true }) });
  await fila.getByRole("button", { name: "Editar", exact: true }).click();
  // Mientras se edita el precio, otra operación actualiza las existencias.
  const ajuste = await api.put(`/api/productos/${p.id}`, {
    data: { ...p, stock_actual: 7, motivo: "Conteo simultáneo" },
  });
  expect(ajuste.status(), await ajuste.text()).toBe(200);
  const editando = page
    .getByRole("row")
    .filter({ has: page.locator(`input[value="${p.nombre}"]`) });
  await editando.locator('input[inputmode="decimal"]').nth(0).fill("59.50");
  await editando.locator('input[inputmode="decimal"]').nth(1).fill("35.25");
  const respuesta = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/api/productos/${p.id}`) &&
      r.request().method() === "PUT",
  );
  await editando.getByRole("button", { name: "Guardar", exact: true }).click();
  const r = await respuesta;
  expect(r.status(), await r.text()).toBe(200);
  expect(r.request().postDataJSON()).not.toHaveProperty("stock_actual");
  expect((await r.json()).data).toMatchObject({
    precio_venta: 59.5,
    precio_compra: 35.25,
    stock_actual: 7,
  });
  await expect(
    page.getByText("Producto actualizado", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("S/ 59.50", { exact: true }).first(),
  ).toBeVisible();
  expect(await stockDe(api, p.id)).toBe(7);
  // La opción Editar dentro de Variantes debe permitir el mismo cambio.
  await page.getByRole("button", { name: "Variantes", exact: true }).click();
  await page
    .getByText(p.nombre, { exact: true })
    .locator("..")
    .locator("..")
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  await editando.locator('input[inputmode="decimal"]').nth(0).fill("60.75");
  const desdeVariantes = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/api/productos/${p.id}`) &&
      r.request().method() === "PUT",
  );
  await editando.getByRole("button", { name: "Guardar", exact: true }).click();
  const rv = await desdeVariantes;
  expect(rv.status(), await rv.text()).toBe(200);
  expect((await rv.json()).data).toMatchObject({
    precio_venta: 60.75,
    precio_compra: 35.25,
    stock_actual: 7,
  });
  await page.reload();
  await expect(
    page.getByText("S/ 60.75", { exact: true }).first(),
  ).toBeVisible();
  const mov = await (
    await api.get(`/api/productos/${p.id}/movimientos`)
  ).json();
  expect(mov.data).toHaveLength(2); // Stock inicial y conteo; cambiar precio no ajusta stock.
  await api.dispose();
});
