import { test, expect } from "./support/test";
import {
  appApi,
  createUser,
  supabase,
  randomIp,
  keys,
  APP_URL,
} from "./support/stack";
import { crearProducto } from "./support/app";
import { abrirDashboard } from "./support/ui";
import { landingInicial } from "../src/lib/landing/model";

test.beforeEach(async ({ context }) =>
  context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() }),
);

test("landing pública reutiliza la lectura de Storage y publicar invalida la caché inmediatamente", async () => {
  const admin = await createUser();
  const svc = await supabase("service");
  await svc.patch(`/rest/v1/profiles?id=eq.${admin.id}`, {
    data: { role: "super_admin" },
  });
  const api = await appApi(null),
    publico = await appApi(null);
  await api.post("/api/auth/login", {
    data: { email: admin.email, password: admin.password },
  });
  const actual = await (await api.get("/api/admin/landing")).json();
  const doc = landingInicial();
  doc.seo.titulo = "EGRESS primera publicación";
  const result = await api.post("/api/admin/landing", {
    data: {
      accion: "publicar",
      documento: doc,
      revision: actual.publicado.revision,
    },
  });
  expect(result.status(), await result.text()).toBe(200);
  const revision = (await result.json()).version.revision;
  expect(await (await publico.get("/")).text()).toContain(
    "EGRESS primera publicación",
  );
  const antes = (await (await svc.get("/__dev/usage")).json()).storageCalls;
  for (let i = 0; i < 4; i++)
    expect(await (await publico.get("/")).text()).toContain(
      "EGRESS primera publicación",
    );
  const despues = (await (await svc.get("/__dev/usage")).json()).storageCalls;
  expect(despues).toBe(antes);
  doc.seo.titulo = "EGRESS segunda publicación inmediata";
  const segunda = await api.post("/api/admin/landing", {
    data: { accion: "publicar", documento: doc, revision },
  });
  expect(segunda.status()).toBe(200);
  expect(await (await publico.get("/")).text()).toContain(
    "EGRESS segunda publicación inmediata",
  );
  expect(
    (
      await api.post("/api/admin/landing", {
        data: {
          accion: "publicar",
          documento: landingInicial(),
          revision: (await segunda.json()).version.revision,
        },
      })
    ).status(),
  ).toBe(200);
  await api.dispose();
  await publico.dispose();
  await svc.dispose();
});

test("el selector de ventas conserva precio decimal y stock sin descargar columnas del catálogo completo", async () => {
  const u = await createUser(),
    api = await appApi(u.token);
  const p = await crearProducto(api, {
    nombre: "Prueba ligera",
    precio_venta: 25.5,
    precio_compra: 10.25,
    stock_actual: 7,
  });
  const full = (await (await api.get("/api/productos")).json()).data.find(
    (r: { id: string }) => r.id === p.id,
  );
  const light = (
    await (await api.get("/api/productos?selector=venta&limit=1000")).json()
  ).data.find((r: { id: string }) => r.id === p.id);
  expect(light).toMatchObject({
    id: p.id,
    nombre: p.nombre,
    precio_venta: 25.5,
    stock_actual: 7,
  });
  expect(light).not.toHaveProperty("precio_compra");
  expect(light).not.toHaveProperty("imagen_url");
  expect(Buffer.byteLength(JSON.stringify(light))).toBeLessThan(
    Buffer.byteLength(JSON.stringify(full)),
  );
  await api.dispose();
});

test("estar en Ventas no consulta Envíos en segundo plano y el refresco de ventas se espacia", async ({
  page,
}) => {
  const u = await createUser();
  await abrirDashboard(page, u, "ventas");
  await expect(
    page.getByRole("button", { name: "Nueva venta", exact: true }).first(),
  ).toBeVisible();
  await page.waitForTimeout(700);
  let envios = 0,
    ventas = 0;
  page.on("request", (r) => {
    const path = new URL(r.url()).pathname;
    if (path === "/api/envios") envios++;
    if (path === "/api/ventas") ventas++;
  });
  await page.clock.install();
  await page.clock.fastForward(12000);
  await page.waitForTimeout(200);
  expect(envios).toBe(0);
  expect(ventas).toBe(0);
  const refresco = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/ventas" && r.status() === 200,
  );
  await page.clock.fastForward(20000);
  await refresco;
  expect(envios).toBe(0);
  expect(ventas).toBe(1);
  await page.getByTitle("Abrir menú").hover();
  await page.getByRole("button", { name: "Envíos", exact: true }).waitFor({ state: "visible" });
  const alEntrar = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/envios" && r.status() === 200,
    { timeout: 5000 },
  );
  await page.getByRole("button", { name: "Envíos", exact: true }).click();
  await alEntrar;
  expect(envios).toBe(1);
});

// Fabricar una sesión vencida SOLO con la clave fija del stack local. No
// reduce controles del servidor ni usa secretos de producción.
async function contextoConSesionVencida(user: {
  email: string;
  password: string;
}) {
  const { request } = await import("@playwright/test");
  const { createHmac } = await import("node:crypto");
  const { jwtSecret: LOCAL_JWT_SECRET } = await keys();
  const api = await appApi(null);
  expect(
    (
      await api.post("/api/auth/login", {
        data: { email: user.email, password: user.password },
      })
    ).status(),
  ).toBe(200);
  const state = await api.storageState();
  const authCookies = state.cookies.filter((c) =>
    c.name.includes("auth-token"),
  );
  expect(authCookies.length).toBe(1);
  const cookie = authCookies[0];
  const session = JSON.parse(
    Buffer.from(cookie.value.replace(/^base64-/, ""), "base64url").toString(
      "utf8",
    ),
  );
  const [header, payload] = session.access_token.split(".");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  claims.exp = Math.floor(Date.now() / 1000) - 60;
  claims.iat = claims.exp - 3600;
  const unsigned = `${header}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`;
  session.access_token = `${unsigned}.${createHmac("sha256", LOCAL_JWT_SECRET).update(unsigned).digest("base64url")}`;
  session.expires_at = claims.exp;
  cookie.value = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  await api.dispose();
  return request.newContext({ baseURL: APP_URL, storageState: state });
}

test("una API guarda la sesión renovada: cuatro peticiones posteriores no vuelven a renovar", async () => {
  const user = await createUser(),
    svc = await supabase("service");
  const api = await contextoConSesionVencida(user);
  const antes = (await (await svc.get("/__dev/usage")).json()).authRefreshes;
  const primera = await api.get("/api/session");
  expect(primera.status(), await primera.text()).toBe(200);
  expect(
    primera.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie")
      .length,
  ).toBeGreaterThan(0);
  const cookies = (await api.storageState()).cookies.filter((c) =>
    c.name.includes("auth-token"),
  );
  expect(cookies.every((c) => c.httpOnly)).toBe(true);
  expect(
    (await (await svc.get("/__dev/usage")).json()).authRefreshes - antes,
  ).toBe(1);
  for (let i = 0; i < 4; i++)
    expect((await api.get("/api/session")).status()).toBe(200);
  expect(
    (await (await svc.get("/__dev/usage")).json()).authRefreshes - antes,
  ).toBe(1);
  await api.dispose();
  await svc.dispose();
});

test("el proxy mantiene HttpOnly después de renovar una sesión vencida", async () => {
  const user = await createUser(),
    api = await contextoConSesionVencida(user);
  expect((await api.get("/dashboard")).status()).toBe(200);
  const cookies = (await api.storageState()).cookies.filter((c) =>
    c.name.includes("auth-token"),
  );
  expect(cookies.length).toBeGreaterThan(0);
  expect(cookies.every((c) => c.httpOnly)).toBe(true);
  expect((await api.get("/api/session")).status()).toBe(200);
  await api.dispose();
});

test("las agencias públicas reutilizan el catálogo sin volver a consultar la base por cada visitante", async () => {
  const svc = await supabase("service"),
    publico = await appApi(null);
  for (const provider of ["shalom", "olva"]) {
    const url = `/api/${provider}/agencias`;
    expect((await publico.get(url)).status()).toBe(200);
    const antes = (await (await svc.get("/__dev/usage")).json()).restCalls;
    for (let i = 0; i < 4; i++)
      expect((await publico.get(url)).status()).toBe(200);
    expect((await (await svc.get("/__dev/usage")).json()).restCalls).toBe(
      antes,
    );
  }
  await svc.dispose();
  await publico.dispose();
});
