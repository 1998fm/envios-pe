import { expect, test } from "./support/test";
import {
  createUser,
  appApi,
  supabase,
  dbSelect,
  uniq,
  randomIp,
} from "./support/stack";
import { abrirDashboard } from "./support/ui";
import { initialConfigState } from "../src/types/config";

test.beforeEach(async ({ context }) =>
  context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() }),
);

test("Registro: nombre precargado, solo recojo omite horarios y tarifas, sin recorrido obligatorio", async ({
  page,
}) => {
  const tag = uniq("inicio"),
    empresa = `Tienda ${tag}`;
  await page.goto("/register");
  await page.getByPlaceholder("Ej. Mi Tienda").fill(empresa);
  await page.getByPlaceholder("correo@ejemplo.com").fill(`${tag}@e2e.test`);
  await page.getByPlaceholder("Mínimo 8 caracteres").fill("ClaveSegura123!");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await expect(page.getByPlaceholder("Ej: Boutique María")).toHaveValue(
    empresa,
  );
  await expect(
    page.getByText("Logo y dirección (opcional)", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Guardar y continuar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Guardar y continuar", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Selecciona al menos un método" }),
  ).toContainText("Selecciona al menos un método");
  await page.getByRole("checkbox", { name: /Recojo en tienda/ }).check();
  await page
    .getByRole("button", { name: "Guardar y finalizar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Tu formulario está preparado",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Probar mi formulario", exact: true }),
  ).toHaveAttribute("href", /^\/f\//);
  await page.getByRole("button", { name: "Ir a Envíos", exact: true }).click();
  await expect(page).toHaveURL(/dashboard\?v=envios/);
  const inicio = page.getByRole("region", {
    name: "Primeros pasos y guías",
    exact: true,
  });
  await expect(
    inicio.getByRole("button", { name: "Primeros pasos y guías", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  await inicio.getByRole("button", { name: "Primeros pasos y guías", exact: true }).click();
  await expect(inicio.getByRole("button", { name: "Primeros pasos y guías", exact: true })).toHaveAttribute("aria-expanded", "true");
  // Espera superior a los antiguos temporizadores de 400/600 ms.
  await page.waitForTimeout(1200);
  await expect(page).toHaveURL(/dashboard\?v=envios/);
  await expect(page.locator(".tour-highlight")).toHaveCount(0);
  await page.reload();
  await expect(
    inicio.getByRole("button", { name: "Primeros pasos y guías", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.setViewportSize({ width: 360, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Reabrir conserva datos guardados y retoma el último paso; ayuda antigua solo al pedirla", async ({
  page,
}) => {
  const u = await createUser(),
    db = await supabase("service");
  const datos = {
    telefono: "999 777 666",
    direccion: "Local 201",
    redirect_url: "https://ejemplo.com/gracias",
    instagram_url: "https://instagram.com/mitienda",
    redirect_message: "Mensaje existente",
    origen_shalom: "Agencia guardada",
    metodo_motorizado: false,
    metodo_shalom: false,
    metodo_recojo: true,
    mensaje_recojo: "Recojo en Local 201 de 10 a 18h",
  };
  expect(
    (await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, { data: datos })).ok(),
  ).toBe(true);
  expect(
    (
      await db.post("/rest/v1/tarifas_moto", {
        data: { profile_id: u.id, tarifas: { Miraflores: 10.5, Surco: -1 } },
      })
    ).ok(),
  ).toBe(true);
  await abrirDashboard(page, u, "envios");
  await page.goto("/onboarding");
  await expect(page.getByPlaceholder("Ej: Boutique María")).toHaveValue(
    u.empresa,
  );
  await page
    .getByRole("button", { name: "Guardar y continuar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Métodos de envío", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Métodos de envío", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /Recojo en tienda/ }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Continuar después", exact: true })
    .click();
  const [guardado] = await dbSelect("profiles", `id=eq.${u.id}`);
  expect(guardado).toMatchObject(datos);
  const [tarifas] = await dbSelect("tarifas_moto", `profile_id=eq.${u.id}`);
  expect(tarifas.tarifas).toEqual({ Miraflores: 10.5, Surco: -1 });
  await page.goto("/dashboard?v=gastos");
  await page
    .getByRole("button", { name: "Registrar gasto", exact: true })
    .first()
    .click();
  await page.waitForTimeout(1000);
  await expect(page.locator(".tour-highlight")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver guía", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saltar", exact: true }),
  ).toBeVisible();
  await db.dispose();
});

test("Motorizado: opciones avanzadas opcionales, videos por tema, tarifas decimales y guardado real", async ({
  page,
}) => {
  const u = await createUser(),
    db = await supabase("service");
  await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, {
    data: { metodo_shalom: false },
  });
  await abrirDashboard(page, u, "envios");
  await page.goto("/onboarding");
  await page
    .getByRole("button", { name: "Guardar y continuar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Guardar y continuar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Horarios y disponibilidad",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /Tengo hora de corte/ }),
  ).toBeHidden();
  const anticipacion = page.locator('input[inputmode="numeric"]').first();
  await anticipacion.fill("2");
  await page
    .getByRole("button", { name: "Ver tutorial de configuración", exact: true })
    .click();
  const ayuda = page.getByRole("dialog", {
    name: "Cómo configurar tu negocio",
    exact: true,
  });
  const guia = await (
    await page.request.get("/recursos/configuracion/pasos.json")
  ).json();
  await expect
    .poll(() =>
      ayuda
        .locator("video")
        .evaluate((v) => (v as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThanOrEqual(
      guia.marks.find((p: { title: string }) => p.title.startsWith("LOGÍSTICA"))
        .start,
    );
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await expect(anticipacion).toHaveValue("2");
  await page
    .getByRole("button", { name: "Guardar y continuar", exact: true })
    .click();
  await page.getByRole("button", { name: "Provincia", exact: true }).click();
  await page
    .getByPlaceholder("Nombre del distrito (ej: Cajamarca, El Porvenir)", {
      exact: true,
    })
    .fill("Cajamarca");
  await page.getByPlaceholder("Precio", { exact: true }).fill("6.50");
  await page
    .getByRole("button", { name: "Ver tutorial de configuración", exact: true })
    .click();
  await expect
    .poll(() =>
      ayuda
        .locator("video")
        .evaluate((v) => (v as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThanOrEqual(
      guia.marks.find((p: { title: string }) => p.title.startsWith("PROVINCIA"))
        .start,
    );
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await expect(page.getByPlaceholder("Precio", { exact: true })).toHaveValue(
    "6.50",
  );
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.setViewportSize({ width: 360, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/workspace/output/onboarding-tarifas-movil.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Guardar y finalizar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Tu formulario está preparado",
      exact: true,
    }),
  ).toBeVisible();
  const [perfil] = await dbSelect("profiles", `id=eq.${u.id}`);
  expect(perfil).toMatchObject({
    moto_region: "provincia",
    logistica_moto_anticipacion: 2,
  });
  const [tarifa] = await dbSelect("tarifas_moto", `profile_id=eq.${u.id}`);
  expect(tarifa.tarifas).toEqual({ Cajamarca: 6.5 });
  await db.dispose();
});

test("API del asistente valida requisitos y respeta las restricciones de Básico", async () => {
  const u = await createUser({ plan: "basic", trial: false }),
    api = await appApi(u.token);
  const enviar = (paso: number, config: unknown) =>
    api.post("/api/onboarding", {
      multipart: { paso: String(paso), config: JSON.stringify(config) },
    });
  expect((await enviar(1, null)).status()).toBe(400);
  expect(
    (
      await enviar(2, {
        ...initialConfigState,
        metodoMotorizado: false,
        metodoShalom: false,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await enviar(2, {
        ...initialConfigState,
        nuevoOrigen: "Origen",
        metodoOlva: true,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await enviar(3, {
        ...initialConfigState,
        metodoShalom: false,
        logisticaMotoDias: [],
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await enviar(4, {
        ...initialConfigState,
        metodoShalom: false,
        motoRegion: "provincia",
        tarifas: {},
      })
    ).status(),
  ).toBe(400);
  const r = await enviar(3, {
    ...initialConfigState,
    metodoShalom: false,
    logisticaMotoUsaHoraCorte: true,
    logisticaMotoHoraCorte: "10:00",
    logisticaMotoAnticipacion: 5,
    logisticaMotoLimitar: true,
    logisticaMotoCupo: 1,
  });
  expect(r.status(), await r.text()).toBe(200);
  const [p] = await dbSelect("profiles", `id=eq.${u.id}`);
  expect(p).toMatchObject({
    logistica_moto_usa_hora_corte: false,
    logistica_moto_anticipacion: 1,
    logistica_moto_limitar: false,
    logistica_moto_cupo: 0,
    moto_region: "lima",
  });
  await api.dispose();
});
