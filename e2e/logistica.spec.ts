import { test, expect } from "./support/test";
import {
  appApi,
  createUser,
  supabase,
  dbSelect,
  randomIp,
} from "./support/stack";
import { abrirDashboard } from "./support/ui";
const DIAS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
});
async function negocio(basic = false) {
  const u = await createUser({ plan: basic ? "basic" : "business_plus" }),
    db = await supabase("service");
  await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, {
    data: {
      logistica_moto_dias: DIAS,
      logistica_agencias_dias: DIAS,
      logistica_moto_limitar: true,
      logistica_moto_cupo: 1,
      logistica_agencias_limitar: true,
      logistica_agencias_cupo: 1,
      mostrar_escoger_fecha: true,
    },
  });
  await db.dispose();
  return u;
}
function pedido(id: string, fecha?: string, metodo = "MOTORIZADO") {
  const n = String(Math.floor(10000000 + Math.random() * 89999999));
  return {
    user_id: id,
    nombre: `Cliente ${n}`,
    dni: n,
    telefono: `9${n}`,
    metodo,
    destino: "Miraflores",
    direccion: "Dirección de prueba",
    detalle: "Datos de demostración",
    idempotency_key: crypto.randomUUID(),
    ...(fecha ? { fecha_programada: fecha } : {}),
  };
}
async function fechas(api: Awaited<ReturnType<typeof appApi>>, id: string) {
  const r = await api.get(`/api/logistica/moto?userId=${id}`);
  expect(r.status(), await r.text()).toBe(200);
  expect(r.headers()["cache-control"]).toContain("no-store");
  return (await r.json()).fechasDisponibles as string[];
}

test("último cupo: solo una de ocho solicitudes simultáneas puede reservar la fecha elegida", async () => {
  const u = await negocio(),
    api = await appApi(null),
    [dia] = await fechas(api, u.id);
  const rr = await Promise.all(
    Array.from({ length: 8 }, () =>
      api.post("/api/envios", { data: pedido(u.id, dia) }),
    ),
  );
  expect(rr.filter((r) => r.status() === 200)).toHaveLength(1);
  expect(rr.filter((r) => r.status() === 409)).toHaveLength(7);
  expect(await dbSelect("envios", `user_id=eq.${u.id}`)).toHaveLength(1);
  expect((await fechas(api, u.id))[0]).not.toBe(dia);
  await api.dispose();
});

test("asignación automática continúa al siguiente día y los cupos de moto y agencias son independientes", async () => {
  const u = await negocio(),
    api = await appApi(null),
    [dia] = await fechas(api, u.id);
  const moto = await api.post("/api/envios", { data: pedido(u.id, dia) });
  expect(moto.status(), await moto.text()).toBe(200);
  const shalom = await api.post("/api/envios", {
    data: pedido(u.id, dia, "SHALOM"),
  });
  expect(shalom.status(), await shalom.text()).toBe(200);
  const olva = await api.post("/api/envios", {
    data: pedido(u.id, dia, "OLVA"),
  });
  expect(olva.status()).toBe(409);
  const rr = await Promise.all(
    Array.from({ length: 5 }, () =>
      api.post("/api/envios", { data: pedido(u.id) }),
    ),
  );
  const dias = [];
  for (const r of rr) {
    expect(r.status(), await r.text()).toBe(200);
    dias.push((await r.json()).envio.fecha_programada);
  }
  expect(new Set(dias).size).toBe(5);
  expect(dias).not.toContain(dia);
  await api.dispose();
});

test("anticipación cambiada y día no laborable se rechazan al guardar, sin modificar pedidos anteriores", async () => {
  const u = await negocio(),
    api = await appApi(null),
    db = await supabase("service"),
    [dia] = await fechas(api, u.id);
  const primero = await api.post("/api/envios", { data: pedido(u.id, dia) });
  expect(primero.status()).toBe(200);
  await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, {
    data: { logistica_moto_anticipacion: 5 },
  });
  const nuevo = await api.post("/api/envios", { data: pedido(u.id, dia) });
  expect(nuevo.status()).toBe(409);
  expect((await nuevo.json()).error).toContain("anticipación");
  expect(
    (await dbSelect("envios", `user_id=eq.${u.id}`))[0].fecha_programada
      ?.toString()
      .slice(0, 10),
  ).toBe(dia);
  const [futuro] = await fechas(api, u.id);
  const iso = new Date(futuro + "T12:00:00-05:00").getUTCDay(),
    fuera = DIAS[(iso + 5) % 7];
  await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, {
    data: { logistica_moto_dias: [fuera] },
  });
  const noLaboral = await api.post("/api/envios", {
    data: pedido(
      u.id,
      new Date(Date.parse(futuro + "T12:00:00-05:00") + 14 * 86400000)
        .toISOString()
        .slice(0, 10),
    ),
  });
  expect(noLaboral.status()).toBe(409);
  expect((await noLaboral.json()).error).toContain("no atiende");
  await api.dispose();
  await db.dispose();
});

test("reprogramación no pisa otro cupo ni afecta ediciones históricas; aislamiento entre negocios", async () => {
  const u = await negocio(),
    otro = await negocio(),
    api = await appApi(u.token),
    pub = await appApi(null),
    db = await supabase("service"),
    dias = await fechas(pub, u.id);
  const a = await (
      await pub.post("/api/envios", { data: pedido(u.id, dias[0]) })
    ).json(),
    b = await (
      await pub.post("/api/envios", { data: pedido(u.id, dias[1]) })
    ).json();
  expect(
    (
      await api.patch(`/api/envios/${a.envio.id}`, {
        data: { fecha_programada: dias[1] },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await api.patch(`/api/envios/${a.envio.id}`, {
        data: { fecha_programada: dias[2] },
      })
    ).status(),
  ).toBe(200);
  const ajeno = await appApi(otro.token);
  expect(
    (
      await ajeno.patch(`/api/envios/${b.envio.id}`, {
        data: { fecha_programada: dias[2] },
      })
    ).status(),
  ).toBe(404);
  await db.patch(`/rest/v1/envios?id=eq.${b.envio.id}`, {
    data: { fecha_programada: "2020-01-01" },
  });
  expect(
    (
      await api.patch(`/api/envios/${b.envio.id}`, {
        data: { estado: "EMPACADO" },
      })
    ).status(),
  ).toBe(200);
  expect(
    String(
      (await dbSelect("envios", `id=eq.${b.envio.id}`))[0].fecha_programada,
    ).slice(0, 10),
  ).toBe("2020-01-01");
  await Promise.all([
    api.dispose(),
    pub.dispose(),
    ajeno.dispose(),
    db.dispose(),
  ]);
});

test("funciones SQL no accesibles a clientes; fechas públicas sin datos personales y fallos visibles", async () => {
  const u = await negocio(),
    pub = await appApi(null),
    db = await supabase("service");
  for (const rol of ["anon", { token: u.token }] as const) {
    const c = await supabase(rol);
    for (const [name, data] of [
      ["tori_crear_envio_logistico", { p_envio: pedido(u.id) }],
      ["tori_fechas_logistica", { p_owner: u.id, p_metodo: "MOTORIZADO" }],
      [
        "tori_actualizar_envio_logistico",
        { p_owner: u.id, p_id: crypto.randomUUID(), p_cambios: {} },
      ],
    ] as const)
      expect(
        (await c.post(`/rest/v1/rpc/${name}`, { data })).status(),
      ).toBeGreaterThanOrEqual(400);
    await c.dispose();
  }
  const r = await pub.get(`/api/logistica/moto?userId=${u.id}`);
  expect(Object.keys(await r.json()).sort()).toEqual([
    "fechasDisponibles",
    "minima",
  ]);
  await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, {
    data: { logistica_moto_cupo: 0 },
  });
  const sinCupo = await pub.get(`/api/logistica/moto?userId=${u.id}`);
  expect(sinCupo.status()).toBe(409);
  expect((await sinCupo.json()).error).toContain("mayor que cero");
  await db.dispose();
  await pub.dispose();
});

test("Básico no muestra controles que el servidor descarta y mantiene recepción sin cupo", async ({
  page,
}) => {
  const u = await negocio(true),
    api = await appApi(null),
    [dia] = await fechas(api, u.id);
  for (let i = 0; i < 3; i++)
    expect(
      (await api.post("/api/envios", { data: pedido(u.id, dia) })).status(),
    ).toBe(200);
  await abrirDashboard(page, u, "envios");
  await page.getByTitle("Abrir menú", { exact: true }).hover();
  await page.locator('[data-tour="configuracion"]').click();
  await page.getByRole("button", { name: "Logística", exact: true }).click();
  await expect(
    page
      .getByText(
        "Tu plan programa con 1 día de anticipación, sin hora de corte ni cupo diario.",
        { exact: false },
      )
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /Limitar envíos por día/ }),
  ).toHaveCount(0);
  await api.dispose();
});

test("formulario abierto: cupo se agota, conserva los datos y actualiza fechas; cliente en otra zona horaria", async ({
  browser,
}) => {
  const u = await negocio(),
    api = await appApi(null),
    ctx = await browser.newContext({ timezoneId: "Pacific/Kiritimati" }),
    page = await ctx.newPage();
  await page.goto(
    `http://localhost:${process.env.APP_PORT || 3000}/f/${u.slug}`,
  );
  await page
    .getByPlaceholder("Nombre completo", { exact: true })
    .fill("Cliente que eligió fecha");
  await page.getByPlaceholder("DNI", { exact: true }).fill("45678912");
  await page.getByPlaceholder("Teléfono", { exact: true }).fill("987654321");
  await page.getByPlaceholder("Distrito", { exact: true }).fill("Miraflores");
  await page.getByRole("button", { name: /^miraflores$/i }).click();
  await page
    .getByPlaceholder("Dirección exacta", { exact: true })
    .fill("Dirección de prueba");
  const carga = page.waitForResponse((r) =>
    r.url().includes("/api/logistica/moto?"),
  );
  await page.getByRole("checkbox", { name: "Escoger día de entrega" }).check();
  const opciones = (await (await carga).json()).fechasDisponibles;
  const buttons = page.locator(".ml-6 button");
  await expect(buttons).toHaveCount(3);
  await buttons.first().click();
  expect(
    (
      await api.post("/api/envios", { data: pedido(u.id, opciones[0]) })
    ).status(),
  ).toBe(200);
  const post = page.waitForResponse(
    (r) => r.url().endsWith("/api/envios") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Solicitar Envío", exact: true })
    .click();
  expect((await post).status()).toBe(409);
  await expect(
    page.getByText(
      "Se completó el cupo de esa fecha. Elige otra fecha disponible.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByPlaceholder("Nombre completo", { exact: true }),
  ).toHaveValue("Cliente que eligió fecha");
  await expect(buttons).toHaveCount(3);
  await buttons.first().click();
  const envio = page.waitForResponse(
    (r) => r.url().endsWith("/api/envios") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Solicitar Envío", exact: true })
    .click();
  const resultado = await envio;
  expect(resultado.status(), await resultado.text()).toBe(200);
  expect((await resultado.json()).envio.fecha_programada).toBe(opciones[1]);
  await ctx.close();
  await api.dispose();
});
