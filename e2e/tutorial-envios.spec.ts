import { expect, test } from "./support/test";
import { createUser, appApi, randomIp } from "./support/stack";
import { abrirDashboard } from "./support/ui";

test("Envíos: guía completa por capítulos conserva selección y observación sin guardar", async ({
  page,
  context,
}) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
  await page.addInitScript(() =>
    localStorage.setItem("tori_tour_modal-detalle-envio_done", "true"),
  );
  const u = await createUser(),
    api = await appApi(u.token);
  const r = await api.post("/api/envios", {
    data: {
      user_id: u.id,
      nombre: "Guía del cliente",
      dni: "43218765",
      telefono: "999123456",
      metodo: "MOTORIZADO",
      destino: "Miraflores",
      direccion: "Calle de ejemplo 123",
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  await abrirDashboard(page, u, "envios");
  const card = page
    .locator('[data-tour="envio-card"]')
    .filter({ hasText: "Guía del cliente" });
  await card.locator('[data-tour="checkbox"]').check();
  await expect(
    page.getByRole("button", {
      name: "Ver guía completa de envíos",
      exact: true,
    }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Ver guía completa de envíos", exact: true })
    .click();
  const ayuda = page.getByRole("dialog", {
    name: "Envíos: guía completa paso a paso",
    exact: true,
  });
  await expect(ayuda.locator("video source")).toHaveAttribute(
    "src",
    "/recursos/envios/envios.mp4",
  );
  await expect
    .poll(() =>
      ayuda
        .locator("video")
        .evaluate((v) => (v as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThan(0);
  await ayuda
    .getByRole("button", { name: "Ver capítulo Shalom Pro", exact: true })
    .click();
  const datos = await (
    await page.request.get("/recursos/envios/pasos.json")
  ).json();
  const shalom = datos.marks.find((p: { title: string }) =>
    p.title.startsWith("SHALOM"),
  ).start;
  await expect
    .poll(() =>
      ayuda
        .locator("video")
        .evaluate((v) => (v as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThanOrEqual(shalom);
  await page.keyboard.press("Escape");
  await expect(card.locator('[data-tour="checkbox"]')).toBeChecked();
  await card.dblclick();
  const detalle = page.getByRole("dialog", {
    name: "Detalle del envío",
    exact: true,
  });
  const observacion = detalle.getByPlaceholder(
    "Registra cualquier incidente: dato faltante, dirección incompleta, paquete con inconvenientes, etc.",
  );
  await observacion.fill("Este cambio todavía no se guardó");
  await expect(
    detalle.getByRole("button", {
      name: "Ver guía completa de envíos",
      exact: true,
    }),
  ).toHaveCount(1);
  await detalle
    .getByRole("button", { name: "Ver guía completa de envíos", exact: true })
    .click();
  const inicioDetalle = datos.marks.find((p: { title: string }) =>
    p.title.startsWith("DETALLE"),
  ).start;
  await expect
    .poll(() =>
      ayuda
        .locator("video")
        .evaluate((v) => (v as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThanOrEqual(inicioDetalle);
  await page.setViewportSize({ width: 360, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await expect(observacion).toHaveValue("Este cambio todavía no se guardó");
  const doc = await page.request.get("/recursos/envios/index.html");
  expect(doc.ok()).toBe(true);
  const video = await page.request.get("/recursos/envios/envios.mp4", {
    headers: { Range: "bytes=0-1023" },
  });
  expect(video.status()).toBe(206);
  await api.dispose();
});

test("El selector de estado refleja un cambio masivo recibido del servidor", async ({
  page,
  context,
}) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
  const u = await createUser(),
    api = await appApi(u.token);
  const r = await api.post("/api/envios", {
    data: {
      user_id: u.id,
      nombre: "Estado sincronizado",
      dni: "76541238",
      telefono: "999234567",
      metodo: "MOTORIZADO",
      destino: "Miraflores",
      direccion: "Calle de ejemplo 456",
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  const id = (await r.json()).envio.id;
  await abrirDashboard(page, u, "envios");
  const card = page
    .locator('[data-tour="envio-card"]')
    .filter({ hasText: "Estado sincronizado" });
  await expect(
    card
      .locator('[data-tour="estado"]')
      .getByRole("button", { name: "No Emp.", exact: true }),
  ).toBeVisible();
  const actualizado = await api.patch("/api/envios/bulk", {
    data: { ids: [id], estado: "EMPACADO" },
  });
  expect(actualizado.status()).toBe(200);
  await expect(
    card
      .locator('[data-tour="estado"]')
      .getByRole("button", { name: "Empacado", exact: true }),
  ).toBeVisible({ timeout: 40000 }); // El refresco de Envíos usa 30 s para reducir egress.
  await api.dispose();
});
