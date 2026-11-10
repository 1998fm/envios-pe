import { randomUUID } from "node:crypto";
import { expect, test } from "./support/test";
import {
  appApi,
  createUser,
  dbInsert,
  dbSelect,
  supabase,
} from "./support/stack";
import type { SupportData } from "../src/types/adminSupport";

async function fixture() {
  const admin = await createUser();
  const empresa = await createUser({
    empresa: `Soporte ${randomUUID().slice(0, 6)}`,
    plan: "basic",
  });
  const db = await supabase("service");
  expect(
    (
      await db.patch(`/rest/v1/profiles?id=eq.${admin.id}`, {
        data: { role: "super_admin" },
      })
    ).ok(),
  ).toBe(true);
  await db.dispose();
  const api = await appApi(null);
  expect(
    (
      await api.post("/api/auth/login", {
        data: { email: admin.email, password: admin.password },
      })
    ).status(),
  ).toBe(200);
  return {
    admin,
    empresa,
    api,
    url: `/api/admin/empresas/${empresa.id}/soporte`,
  };
}
const motivo =
  "Corrección autorizada para resolver una incidencia del negocio.";

test("sin sesión o sin rol de superadmin no se lee ni modifica soporte", async () => {
  const empresa = await createUser();
  const url = `/api/admin/empresas/${empresa.id}/soporte`;
  const anon = await appApi(null);
  expect((await anon.get(url)).status()).toBe(401);
  expect(
    (
      await anon.post(url, {
        data: { accion: "extender_plus", dias: 30, motivo },
      })
    ).status(),
  ).toBe(401);
  const normal = await appApi(null);
  await normal.post("/api/auth/login", {
    data: { email: empresa.email, password: empresa.password },
  });
  expect((await normal.get(url)).status()).toBe(403);
  expect(
    (
      await normal.post(url, {
        data: { accion: "extender_plus", dias: 30, motivo },
      })
    ).status(),
  ).toBe(403);
});

test("diagnostica, corrige formulario y registra antes, después y motivo", async () => {
  const { api, empresa, url } = await fixture();
  const db = await supabase("service");
  await db.patch(`/rest/v1/profiles?id=eq.${empresa.id}`, {
    data: { cerrar_formulario: true },
  });
  const r = await api.get(url);
  expect(r.status()).toBe(200);
  const info = (await r.json()) as SupportData;
  expect(info.diagnosticos.some((d) => d.codigo === "formulario")).toBe(true);
  expect(info.cuenta?.email).toBe(empresa.email);
  const saved = await api.post(url, {
    data: {
      accion: "configuracion",
      cambios: {
        cerrar_formulario: false,
        telefono: "987654321",
        logistica_moto_dias: ["MONDAY", "FRIDAY"],
      },
      esperado: {
        cerrar_formulario: true,
        telefono: info.profile.telefono,
        logistica_moto_dias: info.profile.logistica_moto_dias,
      },
      motivo,
    },
  });
  expect(saved.status(), await saved.text()).toBe(200);
  const [profile] = await dbSelect(
    "profiles",
    `id=eq.${empresa.id}&select=cerrar_formulario,telefono,logistica_moto_dias`,
  );
  expect(profile).toMatchObject({
    cerrar_formulario: false,
    telefono: "987654321",
    logistica_moto_dias: ["MONDAY", "FRIDAY"],
  });
  const logs = await dbSelect<{
    detalle: {
      motivo: string;
      estado: string;
      antes: { cerrar_formulario: boolean };
      cambios: { cerrar_formulario: boolean };
    };
  }>("admin_audit_log", `detalle->>empresaId=eq.${empresa.id}`);
  expect(logs).toHaveLength(1);
  expect(logs[0].detalle).toMatchObject({
    motivo,
    estado: "aplicado",
    antes: { cerrar_formulario: true },
    cambios: { cerrar_formulario: false },
  });
  await db.dispose();
});

test("rechaza campos ajenos, motivos vacíos y ediciones concurrentes", async () => {
  const { api, empresa, url } = await fixture();
  const info = (await (await api.get(url)).json()) as SupportData;
  expect(
    (
      await api.post(url, {
        data: {
          accion: "configuracion",
          cambios: { empresa: "x" },
          esperado: { empresa: info.profile.empresa },
          motivo: "",
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await api.post(url, {
        data: {
          accion: "configuracion",
          cambios: { role: "super_admin" },
          esperado: { role: "user" },
          motivo,
        },
      })
    ).status(),
  ).toBe(400);
  const db = await supabase("service");
  await db.patch(`/rest/v1/profiles?id=eq.${empresa.id}`, {
    data: { empresa: "Actualizada por el negocio" },
  });
  expect(
    (
      await api.post(url, {
        data: {
          accion: "configuracion",
          cambios: { empresa: "Edición antigua" },
          esperado: { empresa: info.profile.empresa },
          motivo,
        },
      })
    ).status(),
  ).toBe(409);
  expect(
    (await dbSelect("profiles", `id=eq.${empresa.id}&select=empresa`))[0]
      .empresa,
  ).toBe("Actualizada por el negocio");
  await db.dispose();
});

test("extender Plus conserva vigencia y pasar a Básico no elimina datos", async () => {
  const { api, empresa, url } = await fixture();
  const info = (await (await api.get(url)).json()) as SupportData;
  const esperado = {
    plan: info.profile.plan,
    trial_end: info.profile.trial_end,
    pro_until: info.profile.pro_until,
  };
  expect(
    (
      await api.post(url, {
        data: { accion: "extender_plus", dias: 30, esperado, motivo },
      })
    ).status(),
  ).toBe(200);
  const extended = (await (await api.get(url)).json()) as SupportData;
  expect(extended.planEfectivo.plan).toBe("business_plus");
  expect(new Date(extended.profile.pro_until!).getTime()).toBeGreaterThan(
    Date.now() + 29 * 864e5,
  );
  expect(
    (
      await api.post(url, {
        data: {
          accion: "pasar_basico",
          esperado: {
            plan: extended.profile.plan,
            trial_end: extended.profile.trial_end,
            pro_until: extended.profile.pro_until,
          },
          motivo,
        },
      })
    ).status(),
  ).toBe(200);
  const [profile] = await dbSelect(
    "profiles",
    `id=eq.${empresa.id}&select=plan,pro_until`,
  );
  expect(profile.plan).toBe("basic");
  expect(profile.pro_until).toBe(extended.profile.pro_until);
});

test("solo corrige pedidos de la empresa seleccionada", async () => {
  const { api, empresa, url } = await fixture();
  const otra = await createUser();
  const pedido = await dbInsert<{ id: string }>("envios", {
    user_id: empresa.id,
    nombre: "Cliente",
    metodo: "MOTORIZADO",
    estado: "NO_EMPACADO",
  });
  const ajeno = await dbInsert<{ id: string }>("envios", {
    user_id: otra.id,
    nombre: "Ajeno",
    metodo: "MOTORIZADO",
    estado: "NO_EMPACADO",
  });
  const body = {
    accion: "pedido",
    pedidoId: pedido.id,
    cambios: { estado: "EMPACADO" },
    esperado: { estado: "NO_EMPACADO" },
    motivo,
  };
  expect(
    (await api.post(url, { data: { ...body, pedidoId: ajeno.id } })).status(),
  ).toBe(404);
  expect((await api.post(url, { data: body })).status()).toBe(200);
  expect(
    (await dbSelect("envios", `id=eq.${pedido.id}&select=estado`))[0].estado,
  ).toBe("EMPACADO");
  expect(
    (await dbSelect("envios", `id=eq.${ajeno.id}&select=estado`))[0].estado,
  ).toBe("NO_EMPACADO");
});

test("restablece contraseña sin guardarla en auditoría y protege al propio admin", async () => {
  const { admin, api, empresa, url } = await fixture();
  const info = (await (await api.get(url)).json()) as SupportData;
  const r = await api.post(url, {
    data: {
      accion: "reset_password",
      esperado: { disabled: info.profile.disabled, role: info.profile.role },
      motivo,
    },
  });
  expect(r.status()).toBe(200);
  const result = await r.json();
  expect(result.password.length).toBeGreaterThanOrEqual(16);
  const logs = await dbSelect(
    "admin_audit_log",
    `detalle->>empresaId=eq.${empresa.id}`,
  );
  expect(JSON.stringify(logs)).not.toContain(result.password);
  const login = await appApi(null);
  expect(
    (
      await login.post("/api/auth/login", {
        data: { email: empresa.email, password: result.password },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await api.post(`/api/admin/empresas/${admin.id}/soporte`, {
        data: {
          accion: "bloquear_cuenta",
          bloqueada: true,
          esperado: { disabled: false },
          motivo,
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await api.patch(`/api/admin/empresas/${admin.id}`, {
        data: { role: "user" },
      })
    ).status(),
  ).toBe(400);
});

for (const width of [390, 1440]) {
  test(`centro de control a ${width}px: buscar, revisar cambios y guardar`, async ({
    browser,
  }) => {
    const { admin, empresa } = await fixture();
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/login");
    await page.getByPlaceholder("correo@ejemplo.com").fill(admin.email);
    await page.getByPlaceholder("••••••").fill(admin.password);
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await page.waitForURL(/dashboard/, { timeout: 30000 });
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "El control de tu plataforma." }),
    ).toBeVisible();
    await page.getByLabel("Buscar un negocio").fill(empresa.empresa);
    await page
      .getByRole("button", { name: new RegExp(empresa.empresa) })
      .click();
    await page
      .getByRole("button", { name: "Negocio y formulario", exact: true })
      .click();
    await page
      .getByLabel("Nombre del negocio", { exact: true })
      .fill("Nombre corregido desde soporte");
    await page
      .getByRole("button", { name: "Revisar cambios", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText(empresa.empresa, { exact: true }).first(),
    ).toBeVisible();
    await expect(
      dialog.getByText("Nombre corregido desde soporte", { exact: true }),
    ).toBeVisible();
    await dialog.getByLabel("Motivo de la corrección").fill(motivo);
    await dialog
      .getByRole("button", { name: "Confirmar y guardar", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "registrada en auditoría",
    );
    const sizes = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
    await ctx.close();
  });
}

test("el acceso de soporte genera un enlace propio y no registra el token", async () => {
  const { api, empresa, url } = await fixture();
  const info = (await (await api.get(url)).json()) as SupportData;
  const response = await api.post(url, {
    data: {
      accion: "impersonar",
      esperado: { disabled: info.profile.disabled, role: info.profile.role },
      motivo,
    },
  });
  expect(response.status()).toBe(200);
  const { link } = await response.json();
  const parsed = new URL(link);
  expect(parsed.origin).toBe("http://localhost:3000");
  expect(parsed.pathname).toBe("/auth/impersonar");
  const token = parsed.searchParams.get("token_hash");
  expect(token).toBeTruthy();
  const logs = await dbSelect(
    "admin_audit_log",
    `detalle->>empresaId=eq.${empresa.id}`,
  );
  expect(JSON.stringify(logs)).not.toContain(token);
});
