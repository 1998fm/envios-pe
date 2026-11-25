import { test, expect } from "@playwright/test";
import { appApi, createUser, supabase, dbSelect } from "./support/stack";
import type { ConfigPlan } from "../src/lib/planCatalogo";

test("superadmin publica permisos de ambos planes, con revisión, auditoría y aplicación real", async ({
  page,
}) => {
  test.setTimeout(240000);
  const admin = await createUser(),
    basic = await createUser({ plan: "basic" }),
    plus = await createUser();
  const db = await supabase("service");
  await db.patch(`/rest/v1/profiles?id=eq.${admin.id}`, {
    data: { role: "super_admin" },
  });
  const adminApi = await appApi(null),
    cliente = await appApi(basic.token),
    plusApi = await appApi(plus.token);
  const anon = await appApi(null);
  expect((await anon.get("/api/admin/planes")).status()).toBe(401);
  expect((await cliente.put("/api/admin/planes", { data: {} })).status()).toBe(
    401,
  );
  expect(
    (
      await adminApi.post("/api/auth/login", {
        data: { email: admin.email, password: admin.password },
      })
    ).ok(),
  ).toBeTruthy();
  const original: ConfigPlan[] = (
    await (await adminApi.get("/api/admin/planes")).json()
  ).planes;
  const originalPerfil = await dbSelect(
    "profiles",
    `id=eq.${basic.id}&select=id,plan,trial_end,pro_until`,
  );
  const payload = (ps: ConfigPlan[]) =>
    Object.fromEntries(ps.map((p) => [p.plan, p]));
  let actual = structuredClone(original);
  try {
    const malo = payload(structuredClone(actual));
    malo.basic.max_productos = -1;
    expect(
      (await adminApi.put("/api/admin/planes", { data: malo })).status(),
    ).toBe(400);
    const borrador = structuredClone(actual);
    const b = borrador.find((p) => p.plan === "basic")!,
      p = borrador.find((p) => p.plan === "business_plus")!;
    b.permisos.productos = true;
    b.permisos.productos_editar = false;
    b.permisos.logistica_anticipacion = true;
    b.max_productos = 1;
    p.permisos.ventas = false;
    p.permisos.envios_estado = false;
    p.permisos.formulario = false;
    const publicada = await adminApi.put("/api/admin/planes", {
      data: payload(borrador),
    });
    expect(publicada.status(), await publicada.text()).toBe(200);
    actual = (await publicada.json()).planes;
    expect(
      (
        await adminApi.put("/api/admin/planes", { data: payload(borrador) })
      ).status(),
    ).toBe(409);
    await expect
      .poll(async () => (await cliente.get("/api/productos")).status(), {
        timeout: 40000,
      })
      .toBe(200);
    const prod = await cliente.post("/api/productos", {
      data: {
        nombre: "Producto permitido",
        precio_venta: 25.5,
        precio_compra: 10,
        stock_actual: 2,
      },
    });
    expect(prod.status(), await prod.text()).toBe(200);
    const id = (await prod.json()).data.id;
    expect(
      (
        await cliente.put(`/api/productos/${id}`, {
          data: { nombre: "Cambio bloqueado", precio_venta: 99 },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await cliente.post("/api/productos", {
          data: { nombre: "Excede límite", stock_actual: 2 },
        })
      ).status(),
    ).toBe(403);
    await expect
      .poll(async () => (await plusApi.get("/api/ventas")).status(), {
        timeout: 40000,
      })
      .toBe(403);
    expect(
      (
        await plusApi.patch(
          "/api/envios/00000000-0000-4000-8000-000000000001",
          { data: { estado: "EMPACADO" } },
        )
      ).status(),
    ).toBe(403);
    // La página pública puede estar en otra instancia con caché de hasta 30 s.
    await expect
      .poll(
        async () =>
          (await (await anon.get(`/f/${plus.slug}`)).text()).includes(
            "Este formulario no está disponible",
          ),
        { timeout: 40000 },
      )
      .toBe(true);
    // La interfaz utiliza el catálogo publicado, sin cambiar el precio ni vigencia de la cuenta.
    await page.request.post("/api/auth/login", {
      data: { email: basic.email, password: basic.password },
    });
    await page.goto("/dashboard?v=productos");
    await expect(
      page.getByRole("heading", { name: "Productos", exact: true }),
    ).toBeVisible();
    expect(
      await dbSelect(
        "profiles",
        `id=eq.${basic.id}&select=id,plan,trial_end,pro_until`,
      ),
    ).toEqual(originalPerfil);
    const audit = await dbSelect<{ detalle: { antes: unknown[] } }>(
      "admin_audit_log",
      `admin_id=eq.${admin.id}&accion=eq.editar_planes`,
    );
    expect(audit).toHaveLength(1);
    expect(audit[0].detalle.antes).toHaveLength(2);
    // El panel muestra todos los controles, y un borrador no cambia el plan hasta publicarlo.
    await page.request.post("/api/auth/logout");
    await page.request.post("/api/auth/login", {
      data: { email: admin.email, password: admin.password },
    });
    await page.goto("/admin");
    await page.getByRole("button", { name: "Planes", exact: true }).click();
    const editor = page.getByTestId("admin-planes-editor");
    await expect(
      editor.getByRole("checkbox", { name: "Básico: Productos", exact: true }),
    ).toBeChecked();
    await editor
      .getByRole("checkbox", { name: "Básico: Productos", exact: true })
      .uncheck();
    await editor
      .getByRole("button", { name: "Revisar cambios", exact: true })
      .click();
    await expect(editor.getByLabel("Revisar publicación")).toContainText(
      "Básico · Productos: desactivar",
    );
    expect(
      (await (await adminApi.get("/api/admin/planes")).json()).planes,
    ).toEqual(actual);
    const guardado = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/admin/planes") && r.request().method() === "PUT",
    );
    await editor
      .getByRole("button", { name: "Publicar cambios para todos", exact: true })
      .click();
    expect((await guardado).status()).toBe(200);
    await expect(editor.getByRole("status")).toContainText("Planes publicados");
    await expect
      .poll(async () => (await cliente.get("/api/productos")).status(), {
        timeout: 40000,
      })
      .toBe(403);
    expect(
      await dbSelect("productos", `id=eq.${id}&select=nombre,precio_venta`),
    ).toEqual([{ nombre: "Producto permitido", precio_venta: 25.5 }]);
    await page.screenshot({
      path: "/workspace/work/planes-admin-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      editor.getByRole("button", { name: "Revisar cambios", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: "/workspace/work/planes-admin-mobile.png",
      fullPage: true,
    });
  } finally {
    const actuales: ConfigPlan[] = (
      await (await adminApi.get("/api/admin/planes")).json()
    ).planes;
    const restaurado = original.map((p) => ({
      ...p,
      revision: actuales.find((a) => a.plan === p.plan)!.revision,
    }));
    const res = await adminApi.put("/api/admin/planes", {
      data: payload(restaurado),
    });
    expect(res.status(), await res.text()).toBe(200);
    await Promise.all([
      db.dispose(),
      cliente.dispose(),
      plusApi.dispose(),
      adminApi.dispose(),
      anon.dispose(),
    ]);
  }
});
