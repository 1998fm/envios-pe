import { expect, test } from "./support/test";
import { createUser, randomIp } from "./support/stack";
import { abrirDashboard } from "./support/ui";

for (const caso of [
  {
    seccion: "productos",
    nombre: "Productos",
    boton: "Nuevo producto",
    modal: "Nuevo producto",
    campo: "Ej: Polera básica",
  },
  {
    seccion: "compras",
    nombre: "Compras",
    boton: "Nueva compra",
    modal: "Nueva compra",
    campo: "Nombre del proveedor",
  },
  {
    seccion: "ventas",
    nombre: "Ventas",
    boton: "Nueva venta",
    modal: "Nueva venta",
    campo: "DNI o teléfono del cliente",
  },
]) {
  test(`${caso.nombre}: guía reproducible y formulario conservado`, async ({
    page,
    context,
  }) => {
    await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
    await page.addInitScript(() => {
      for (const id of ["nuevo-producto", "nueva-compra", "nueva-venta"])
        localStorage.setItem(`tori_tour_modal-${id}_done`, "true");
    });
    const u = await createUser({ plan: "business_plus" });
    await abrirDashboard(page, u, caso.seccion);
    const etiqueta = `Ver tutorial de ${caso.seccion}`;
    await expect(
      page.getByRole("button", { name: etiqueta, exact: true }),
    ).toHaveCount(1);
    await page
      .getByRole("button", { name: caso.boton, exact: true })
      .first()
      .click();
    const formulario = page.getByRole("dialog", {
      name: caso.modal,
      exact: true,
    });
    const valor =
      caso.seccion === "ventas" ? "999888777" : "Ejemplo sin guardar";
    await formulario.getByPlaceholder(caso.campo, { exact: true }).fill(valor);
    const ayuda = formulario.getByRole("button", {
      name: etiqueta,
      exact: true,
    });
    await expect(ayuda).toHaveCount(1);
    await ayuda.click();
    const tutorial = page.getByRole("dialog", {
      name: `Cómo usar ${caso.nombre}`,
      exact: true,
    });
    await expect(tutorial).toBeVisible();
    await expect(tutorial.locator("video source")).toHaveAttribute(
      "src",
      `/recursos/${caso.seccion}/${caso.seccion}.mp4`,
    );
    await expect
      .poll(() =>
        tutorial
          .locator("video")
          .evaluate((v) => (v as HTMLVideoElement).currentTime),
      )
      .toBeGreaterThan(0);
    const capitulos = tutorial.getByRole("button", { name: /Ver capítulo/ });
    expect(await capitulos.count()).toBeGreaterThan(2);
    await capitulos.nth(1).click();
    await expect
      .poll(() =>
        tutorial
          .locator("video")
          .evaluate((v) => (v as HTMLVideoElement).currentTime),
      )
      .toBeGreaterThan(2);
    await page.setViewportSize({ width: 360, height: 740 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(tutorial).toHaveCount(0);
    await expect(
      formulario.getByPlaceholder(caso.campo, { exact: true }),
    ).toHaveValue(valor);
    await expect(ayuda).toBeFocused();
    const r = await page.request.get(
      `/recursos/${caso.seccion}/${caso.seccion}.mp4`,
      { headers: { Range: "bytes=0-1023" } },
    );
    expect(r.status()).toBe(206);
  });
}
