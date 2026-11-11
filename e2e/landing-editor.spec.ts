import { test, expect } from "./support/test";
import { appApi, createUser, supabase, keys, randomIp } from "./support/stack";
import { landingInicial, claveTexto } from "../src/lib/landing/model";
import catalogo from "../src/lib/landing/catalogo.json";

test.describe.configure({ mode: "serial" });
test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
});
async function fixture() {
  const u = await createUser();
  const db = await supabase("service");
  await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, {
    data: { role: "super_admin" },
  });
  await db.dispose();
  const api = await appApi(null);
  await api.post("/api/auth/login", {
    data: { email: u.email, password: u.password },
  });
  return { u, api };
}

test("solo superadmin puede leer, guardar, publicar, recuperar o subir imágenes", async () => {
  const anon = await appApi(null);
  const normal = await createUser();
  const api = await appApi(null);
  await api.post("/api/auth/login", {
    data: { email: normal.email, password: normal.password },
  });
  for (const ctx of [anon, api]) {
    const codigo = ctx === anon ? 401 : 403;
    expect((await ctx.get("/api/admin/landing")).status()).toBe(codigo);
    expect((await ctx.get("/api/admin/landing?revision=1")).status()).toBe(
      codigo,
    );
    expect(
      (
        await ctx.post("/api/admin/landing", {
          data: {
            accion: "publicar",
            revision: 0,
            documento: landingInicial(),
          },
        })
      ).status(),
    ).toBe(codigo);
    expect((await ctx.post("/api/admin/landing/imagen")).status()).toBe(codigo);
  }
  await api.dispose();
  await anon.dispose();
});

test("borradores privados, versiones inmutables y protección ante guardados concurrentes", async () => {
  const { api } = await fixture();
  const inicial = await (await api.get("/api/admin/landing")).json();
  const doc = landingInicial();
  doc.textos[
    `inicio:${claveTexto(catalogo.inicio.find((t) => t.startsWith("Vender por WhatsApp"))!)}`
  ] = { texto: "BORRADOR PRIVADO DE PRUEBA" };
  const body = {
    accion: "borrador",
    revision: inicial.borrador.revision,
    documento: doc,
  };
  const concurrentes = await Promise.all([
    api.post("/api/admin/landing", { data: body }),
    api.post("/api/admin/landing", { data: body }),
  ]);
  expect(concurrentes.map((r) => r.status()).sort()).toEqual([200, 409]);
  const estado = await (await api.get("/api/admin/landing")).json();
  expect(JSON.stringify(estado.borrador.documento)).toContain(
    "BORRADOR PRIVADO DE PRUEBA",
  );
  const publico = await appApi(null);
  expect(await (await publico.get("/")).text()).not.toContain(
    "BORRADOR PRIVADO DE PRUEBA",
  );
  const k = await keys();
  const noAutorizado = await publico.get(
    `${k.url}/storage/v1/object/public/tori-landing/borrador/${String(estado.borrador.revision).padStart(12, "0")}.json`,
  );
  expect([401, 403]).toContain(noAutorizado.status());
  await api.dispose();
  await publico.dispose();
});

test("publica contenido y SEO, oculta secciones, preserva historial y rechaza enlaces peligrosos", async ({
  page,
}) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  const { api } = await fixture();
  const estado = await (await api.get("/api/admin/landing")).json();
  const doc = landingInicial();
  const original = catalogo.inicio.find((t) =>
    t.startsWith("Vender por WhatsApp"),
  )!;
  doc.textos[`inicio:${claveTexto(original)}`] = {
    texto: "Tu negocio en un solo lugar ",
    color: "#123456",
  };
  doc.secciones.find((s) => s.id === "historias")!.visible = false;
  doc.secciones.find((s) => s.id === "diagnostico")!.eliminada = true;
  doc.seo.titulo = "Título publicado de prueba";
  doc.secciones.push({
    id: "custom-prueba",
    nombre: "Nueva sección",
    visible: true,
    eliminada: false,
    titulo: "Contenido nuevo",
    descripcion: "<script>window.__landingXss=1</script>",
  });
  const publicar = await api.post("/api/admin/landing", {
    data: {
      accion: "publicar",
      revision: estado.publicado.revision,
      documento: doc,
    },
  });
  expect(publicar.status(), await publicar.text()).toBe(200);
  const publicada = (await publicar.json()).version;
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tu negocio en un solo lugar",
  );
  await expect(page).toHaveTitle("Título publicado de prueba");
  await expect(page.locator("#historias")).toHaveCount(0);
  await expect(page.locator("#diagnostico")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Contenido nuevo", exact: true }),
  ).toHaveCount(1);
  expect(await page.evaluate(() => "__landingXss" in window)).toBe(false);
  const recuperada = await (
    await api.get(`/api/admin/landing?revision=${publicada.revision}`)
  ).json();
  expect(recuperada.documento.seo.titulo).toBe(doc.seo.titulo);
  const maliciosos = [
    "javascript:alert(1)",
    "//evil.example",
    "data:text/html,mal",
    "/\\evil.example",
  ];
  for (const url of maliciosos) {
    const invalido = { ...doc, enlaces: { "inicio:cta": url } };
    expect(
      (
        await api.post("/api/admin/landing", {
          data: {
            accion: "publicar",
            revision: publicada.revision,
            documento: invalido,
          },
        })
      ).status(),
    ).toBe(400);
  }
  const r = await api.post("/api/admin/landing", {
    data: {
      accion: "publicar",
      revision: publicada.revision,
      documento: landingInicial(),
    },
  });
  expect(r.status()).toBe(200);
  expect(errores).toEqual([]);
  await api.dispose();
});

test("editor visual: seleccionar, modificar, guardar, previsualizar en celular y publicar", async ({
  page,
}) => {
  test.setTimeout(150000);
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  const { u, api } = await fixture();
  const estado = await (await api.get("/api/admin/landing")).json();
  await api.post("/api/admin/landing", {
    data: {
      accion: "borrador",
      revision: estado.borrador.revision,
      documento: landingInicial(),
    },
  });
  await page.request.post("/api/auth/login", {
    data: { email: u.email, password: u.password },
  });
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Editor de landing", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Editor visual de la landing" }),
  ).toBeVisible();
  const preview = page.frameLocator(
    'iframe[title="Vista previa editable de la landing"]',
  );
  const texto = preview
    .locator("[data-landing-text]")
    .filter({ hasText: /^Vender por WhatsApp debería darte/ })
    .first();
  await texto.click();
  await page
    .getByRole("textbox", { name: "Texto seleccionado", exact: true })
    .fill("Texto editado desde la vista previa ");
  await expect(preview.getByRole("heading", { level: 1 })).toContainText(
    "Texto editado desde la vista previa",
  );
  await page
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Borrador guardado" }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Seleccionar textos", exact: true })
    .uncheck();
  await preview
    .getByRole("button", { name: "trimestral", exact: true })
    .click();
  await expect(preview.getByText("S/ 129.90", { exact: true })).toBeVisible();
  const pregunta = preview.getByRole("button", {
    name: "¿Tengo que cambiar la forma en que vendo?",
    exact: true,
  });
  await pregunta.click();
  await expect(pregunta).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("checkbox", { name: "Seleccionar textos", exact: true })
    .check();
  await page.getByTitle("Vista de celular", { exact: true }).click();
  await expect(page.locator("iframe")).toHaveCSS("width", "390px");
  await page.getByRole("button", { name: "Secciones", exact: true }).click();
  await page.getByTitle("Ocultar Testimonios", { exact: true }).click();
  // Las eliminaciones y publicaciones requieren confirmación explícita.
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByTitle("Eliminar Mensaje de Tori", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Papelera" })).toBeVisible();
  await page
    .getByRole("button", { name: "Publicar cambios", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Landing publicada" }),
  ).toBeVisible();
  expect(errores).toEqual([]);
  const actual = await (await api.get("/api/admin/landing")).json();
  expect(
    actual.publicado.documento.textos[
      `inicio:${claveTexto(catalogo.inicio.find((t) => t.startsWith("Vender por WhatsApp"))!)}`
    ].texto,
  ).toContain("Texto editado");
  await api.post("/api/admin/landing", {
    data: {
      accion: "publicar",
      revision: actual.publicado.revision,
      documento: landingInicial(),
    },
  });
  const final = await (await api.get("/api/admin/landing")).json();
  await api.post("/api/admin/landing", {
    data: {
      accion: "borrador",
      revision: final.borrador.revision,
      documento: landingInicial(),
    },
  });
  await api.dispose();
});

test("sube imágenes mediante el servidor y rechaza SVG", async () => {
  const { api } = await fixture();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
    "base64",
  );
  const upload = await api.post("/api/admin/landing/imagen", {
    multipart: {
      file: { name: "portada.png", mimeType: "image/png", buffer: png },
    },
  });
  expect(upload.status(), await upload.text()).toBe(200);
  expect((await upload.json()).url).toMatch(/^\/media\/logos\/landing\//);
  const svg = await api.post("/api/admin/landing/imagen", {
    multipart: {
      file: {
        name: "script.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg onload="alert(1)"/>'),
      },
    },
  });
  expect(svg.status()).toBe(400);
  await api.dispose();
});

test("ocultar la portada conserva la página y sus animaciones sin errores", async ({
  page,
}) => {
  const { api } = await fixture();
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  const estado = await (await api.get("/api/admin/landing")).json();
  const doc = landingInicial();
  doc.secciones.find((s) => s.id === "inicio")!.visible = false;
  const respuesta = await api.post("/api/admin/landing", {
    data: {
      accion: "publicar",
      revision: estado.publicado.revision,
      documento: doc,
    },
  });
  expect(respuesta.status(), await respuesta.text()).toBe(200);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#inicio")).toHaveCount(0);
  await expect(page.locator("#precios")).toHaveCount(1);
  expect(errores).toEqual([]);
  const publicado = (await respuesta.json()).version;
  await api.post("/api/admin/landing", {
    data: {
      accion: "publicar",
      revision: publicado.revision,
      documento: landingInicial(),
    },
  });
  await api.dispose();
});
