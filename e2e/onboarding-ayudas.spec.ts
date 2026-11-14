import { expect, test } from "./support/test";
import { createUser, appApi, randomIp } from "./support/stack";
import { abrirDashboard } from "./support/ui";

test("Las herramientas de Envíos abren la guía en su capítulo y conservan el borrador", async ({
  page,
  context,
}) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
  const u = await createUser(),
    api = await appApi(u.token);
  for (const [nombre, metodo, dni] of [
    ["Cliente Motorizado", "MOTORIZADO", "12348765"],
    ["Cliente Shalom", "SHALOM", "87651234"],
  ]) {
    const r = await api.post("/api/envios", {
      data: {
        user_id: u.id,
        nombre,
        dni,
        telefono: metodo === "SHALOM" ? "999234567" : "999345678",
        metodo,
        destino:
          metodo === "SHALOM" ? "AREQUIPA / AREQUIPA / CAYMA" : "Miraflores",
        direccion: "Calle de ejemplo 123",
      },
    });
    expect(r.status(), await r.text()).toBe(200);
    if (metodo === "SHALOM") {
      const id = (await r.json()).envio.id;
      expect(
        (
          await api.patch(`/api/envios/${id}`, { data: { estado: "EMPACADO" } })
        ).status(),
      ).toBe(200);
    }
  }
  await abrirDashboard(page, u, "envios");
  const moto = page
      .locator('[data-tour="envio-card"]')
      .filter({ hasText: "Cliente Motorizado" }),
    shalom = page
      .locator('[data-tour="envio-card"]')
      .filter({ hasText: "Cliente Shalom" });
  await moto.locator('[data-tour="checkbox"]').check();
  const guia = await (
    await page.request.get("/recursos/envios/pasos.json")
  ).json();
  for (const [accion, nombre, prefijo] of [
    ["generar-etiquetas", "Generar etiquetas", "ETIQUETAS"],
    ["copiar-datos", "Copiar datos para Motorizado", "COPIAR"],
    ["cambio-masivo", "Cambio Masivo", "CAMBIO MASIVO"],
    ["exportar-shalom", "Exportar Shalom", "SHALOM"],
  ]) {
    if (prefijo === "SHALOM") {
      await moto.locator('[data-tour="checkbox"]').uncheck();
      await shalom.locator('[data-tour="checkbox"]').check();
    }
    await page.getByTitle("Abrir menú", { exact: true }).hover();
    await page
      .locator(`[data-tour="${accion}"]`)
      .filter({ visible: true })
      .click();
    const modal = page.getByRole("dialog", { name: nombre, exact: true });
    await expect(modal).toBeVisible();
    if (prefijo === "ETIQUETAS")
      await modal.getByRole("radio", { name: /Etiqueta individual/ }).check();
    if (prefijo === "CAMBIO MASIVO")
      await modal.locator("select").last().selectOption("EMPACADO");
    await expect(
      modal.getByRole("button", {
        name: "Ver guía completa de envíos",
        exact: true,
      }),
    ).toHaveCount(1);
    await modal
      .getByRole("button", { name: "Ver guía completa de envíos", exact: true })
      .click();
    const video = page
      .getByRole("dialog", {
        name: "Envíos: guía completa paso a paso",
        exact: true,
      })
      .locator("video");
    await expect
      .poll(() => video.evaluate((v) => (v as HTMLVideoElement).currentTime))
      .toBeGreaterThanOrEqual(
        guia.marks.find((p: { title: string }) => p.title.startsWith(prefijo))
          .start,
      );
    await page.getByRole("button", { name: "Volver", exact: true }).click();
    if (prefijo === "ETIQUETAS")
      await expect(
        modal.getByRole("radio", { name: /Etiqueta individual/ }),
      ).toBeChecked();
    if (prefijo === "CAMBIO MASIVO")
      await expect(modal.locator("select").last()).toHaveValue("EMPACADO");
    await modal
      .getByRole("button", {
        name: prefijo === "CAMBIO MASIVO" ? "Cerrar" : "Cancelar",
        exact: true,
      })
      .click();
  }
  await api.dispose();
});
