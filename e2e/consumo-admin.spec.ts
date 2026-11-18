import { readFile } from "node:fs/promises";
import { test, expect } from "./support/test";
import {
  appApi,
  createUser,
  supabase,
  dbInsert,
  randomIp,
  keys,
} from "./support/stack";
import {
  METRICAS_CONSUMO,
  compararOficiales,
  validarLecturaOficial,
  type SnapshotOficial,
} from "../src/lib/consumoModel";

test.beforeEach(async ({ context }) =>
  context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() }),
);

async function admin() {
  const u = await createUser(),
    db = await supabase("service"),
    api = await appApi(null);
  await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, {
    data: { role: "super_admin" },
  });
  expect(
    (
      await api.post("/api/auth/login", {
        data: { email: u.email, password: u.password },
      })
    ).status(),
  ).toBe(200);
  return { u, db, api };
}
function lectura(
  uso = 6.28,
  ciclo = "Ciclo de prueba",
  tomado_en = new Date(Date.now() - 3600000).toISOString(),
) {
  return {
    accion: "oficial",
    ciclo,
    tomado_en,
    medidas: Object.fromEntries(
      METRICAS_CONSUMO.map((m) => [
        m.key,
        {
          uso: m.key === "egress" ? uso : m.key === "mau" ? 18 : 0.02,
          limite: m.limite,
        },
      ]),
    ),
    nota: "Lectura copiada de Usage",
  };
}

test("el monitor exige superadmin y sus tablas y funciones no son públicas", async () => {
  const normal = await createUser(),
    api = await appApi(null),
    anon = await appApi(null);
  expect((await anon.get("/api/admin/consumo")).status()).toBe(401);
  await api.post("/api/auth/login", {
    data: { email: normal.email, password: normal.password },
  });
  expect((await api.get("/api/admin/consumo")).status()).toBe(403);
  expect(
    (
      await api.post("/api/admin/consumo", { data: { accion: "medir" } })
    ).status(),
  ).toBe(403);
  for (const role of ["anon", { token: normal.token }] as const) {
    const db = await supabase(role);
    expect(
      (await db.get("/rest/v1/supabase_usage_snapshots")).status(),
    ).toBeGreaterThanOrEqual(400);
    expect(
      (await db.post("/rest/v1/rpc/tori_medir_consumo", { data: {} })).status(),
    ).toBeGreaterThanOrEqual(400);
    expect(
      (
        await db.post("/rest/v1/rpc/tori_ver_consumo", { data: { p_dias: 7 } })
      ).status(),
    ).toBeGreaterThanOrEqual(400);
    await db.dispose();
  }
  await api.dispose();
  await anon.dispose();
});

test("varios administradores concurrentes generan una sola captura y GET no escribe", async () => {
  const { api, db } = await admin();
  await db.delete("/rest/v1/supabase_usage_snapshots?tipo=eq.tecnico");
  const antes = await api.get("/api/admin/consumo?dias=7");
  expect(antes.status(), await antes.text()).toBe(200);
  expect((await antes.json()).actual).toBeNull();
  const rs = await Promise.all(
    Array.from({ length: 8 }, () =>
      api.post("/api/admin/consumo", { data: { accion: "medir" } }),
    ),
  );
  const resultados = [];
  for (const r of rs) {
    expect(r.status(), await r.text()).toBe(200);
    resultados.push(await r.json());
  }
  expect(new Set(resultados.map((r) => r.snapshot.id)).size).toBe(1);
  expect(resultados.filter((r) => !r.reutilizado)).toHaveLength(1);
  const snap = resultados[0].snapshot;
  expect(snap.datos.databaseBytes).toBeGreaterThan(0);
  expect(
    snap.datos.tablas.find((t: { nombre: string }) => t.nombre === "envios"),
  ).toHaveProperty("filas");
  expect(Array.isArray(snap.datos.storage)).toBe(true);
  const historial = await (await api.get("/api/admin/consumo?dias=1")).json();
  expect(historial.tecnicos).toHaveLength(1);
  expect(historial.tecnicos[0]).toHaveProperty("databaseBytes");
  expect(historial.tecnicos[0]).not.toHaveProperty("datos");
  expect((await api.get("/api/admin/consumo?dias=100000")).status()).toBe(400);
  await db.dispose();
  await api.dispose();
});

test("se conservan cuotas, decimales, ciclos y auditoría; se rechazan lecturas inválidas y repetidas", async () => {
  const { api, db, u } = await admin();
  const primera = lectura(
    6.12,
    `Ciclo ${u.id}`,
    new Date(Date.now() - 7200000).toISOString(),
  );
  expect(
    (await api.post("/api/admin/consumo", { data: primera })).status(),
  ).toBe(201);
  expect(
    (await api.post("/api/admin/consumo", { data: primera })).status(),
  ).toBe(409);
  const segunda = {
    ...lectura(6.28, primera.ciclo),
    tomado_en: new Date(Date.now() - 1000).toISOString(),
  };
  expect(
    (await api.post("/api/admin/consumo", { data: segunda })).status(),
  ).toBe(201);
  const j = await (await api.get("/api/admin/consumo?dias=1")).json();
  expect(j.oficial.datos.medidas.egress).toEqual({ uso: 6.28, limite: 5 });
  expect(j.oficialAnterior.ciclo).toBe(primera.ciclo);
  const delta = compararOficiales(j.oficial, j.oficialAnterior, "egress")!;
  expect(delta.delta).toBeCloseTo(0.16, 8);
  expect(delta.reinicio).toBe(false);
  expect(
    (
      await db.get(
        `/rest/v1/admin_audit_log?accion=eq.consumo.lectura_oficial&admin_id=eq.${u.id}`,
      )
    ).ok(),
  ).toBe(true);
  expect(
    (
      await api.post("/api/admin/consumo", {
        data: { ...segunda, tomado_en: "2099-01-01" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await api.post("/api/admin/consumo", {
        data: { ...segunda, medidas: { egress: { uso: 2, limite: 5 } } },
      })
    ).status(),
  ).toBe(400);
  expect(
    validarLecturaOficial({
      ...segunda,
      medidas: { ...segunda.medidas, egress: { uso: -1, limite: 5 } },
    }),
  ).toBeNull();
  const reinicio = {
    ...j.oficial,
    ciclo: "Otro ciclo",
    datos: {
      medidas: { ...j.oficial.datos.medidas, egress: { uso: 0.1, limite: 5 } },
      nota: "",
    },
  } as SnapshotOficial;
  expect(compararOficiales(reinicio, j.oficialAnterior, "egress")).toBeNull();
  const bajada = { ...reinicio, ciclo: primera.ciclo };
  expect(compararOficiales(bajada, j.oficialAnterior, "egress")!.reinicio).toBe(
    true,
  );
  await db.dispose();
  await api.dispose();
});

test("la ventana técnica acota la vista y conserva capturas antiguas y lecturas oficiales", async () => {
  const { api, db } = await admin();
  await db.delete("/rest/v1/supabase_usage_snapshots?tipo=eq.tecnico");
  const antigua = new Date(Date.now() - 100 * 86400000).toISOString();
  const tecnico = await dbInsert<{ id: string }>("supabase_usage_snapshots", {
    tipo: "tecnico",
    tomado_en: antigua,
    datos: {
      databaseBytes: 100,
      tablas: [],
      storage: [],
      postgres: { transacciones: 0, filasProcesadas: 0, reinicio: null },
    },
  });
  const oficial = await dbInsert<{ id: string }>("supabase_usage_snapshots", {
    tipo: "oficial",
    ciclo: "Anterior",
    tomado_en: antigua,
    datos: { medidas: lectura().medidas, nota: "" },
  });
  expect(
    (
      await api.post("/api/admin/consumo", { data: { accion: "medir" } })
    ).status(),
  ).toBe(200);
  expect(
    await (
      await db.get(`/rest/v1/supabase_usage_snapshots?id=eq.${tecnico.id}`)
    ).json(),
  ).toHaveLength(1);
  const vista = await (await api.get("/api/admin/consumo?dias=90")).json();
  expect(
    vista.tecnicos.every(
      (s: { tomado_en: string }) =>
        Date.parse(s.tomado_en) > Date.now() - 90 * 86400000,
    ),
  ).toBe(true);
  expect(
    await (
      await db.get(`/rest/v1/supabase_usage_snapshots?id=eq.${oficial.id}`)
    ).json(),
  ).toHaveLength(1);
  await db.dispose();
  await api.dispose();
});

test("la pestaña registra lecturas, exporta y no consulta continuamente; funciona en móvil", async ({
  page,
}) => {
  const { api, db, u } = await admin();
  // Solo se limpia el historial del monitor de la base efímera de esta prueba.
  await db.delete("/rest/v1/supabase_usage_snapshots?tipo=eq.oficial");
  expect(
    (await api.post("/api/admin/consumo", { data: lectura(6.12) })).status(),
  ).toBe(201);
  await page.request.post("/api/auth/login", {
    data: { email: u.email, password: u.password },
  });
  const k = await keys();
  const cuerpos: string[] = [];
  const conexiones: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes(new URL(k.url).host)) conexiones.push(r.url());
  });
  page.on("response", async (r) => {
    if (
      ["script", "document", "fetch", "xhr"].includes(
        r.request().resourceType(),
      )
    ) {
      try {
        cuerpos.push(await r.text());
      } catch {
        /* descargas/redirecciones sin cuerpo */
      }
    }
  });
  await page.clock.install();
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Consumo Supabase", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Consumo Supabase", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("article")
      .filter({ hasText: "Salida de datos (Egress)" })
      .getByText("6.12 GB", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Registrar lectura oficial", exact: true })
    .click();
  await page
    .getByLabel("Salida de datos (Egress): consumo", { exact: true })
    .fill("6,28");
  await page.getByLabel("Nota opcional", { exact: true }).fill("=1+1");
  await page
    .getByRole("button", { name: "Guardar lectura", exact: true })
    .click();
  await expect(
    page.getByRole("form", { name: "Registrar lectura oficial" }),
  ).toHaveCount(0);
  await expect(
    page
      .locator("article")
      .filter({ hasText: "Salida de datos (Egress)" })
      .getByText("6.28 GB", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Ritmo observado:", { exact: false }),
  ).toBeVisible();
  const descarga = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar lecturas mostradas" })
    .click();
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toBe("consumo-supabase.csv");
  const ruta = await archivo.path();
  expect(ruta).toBeTruthy();
  expect(await readFile(ruta!, "utf8")).toContain('"\'=1+1"');
  await expect(
    page.getByRole("button", { name: "Actualizar medición", exact: true }),
  ).toBeEnabled();
  let consultas = 0;
  page.on("request", (r) => {
    if (new URL(r.url()).pathname === "/api/admin/consumo") consultas++;
  });
  await page.clock.fastForward(300000);
  await page.waitForTimeout(200);
  expect(consultas).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  expect(cuerpos.length).toBeGreaterThan(5);
  for (const cuerpo of cuerpos)
    for (const secreto of [
      k.anonKey,
      k.serviceKey,
      k.jwtSecret,
      new URL(k.url).host,
    ])
      expect(cuerpo.includes(secreto)).toBe(false);
  expect(conexiones).toHaveLength(0);
  await api.dispose();
  await db.dispose();
});

test("Resumen y Clientes conservan datos de más de 90 días y más de mil registros", async () => {
  const u = await createUser(),
    otro = await createUser(),
    api = await appApi(u.token),
    db = await supabase("service");
  const persona = await dbInsert<{ id: string }>("personas", {
    nombre: "Cliente antiguo",
    dni: "12345678",
    telefono: "999123456",
  });
  await dbInsert("cliente_de", { profile_id: u.id, persona_id: persona.id });
  const viejo = "2024-05-01T12:00:00Z";
  const ventas = await db.post("/rest/v1/ventas", {
    data: Array.from({ length: 1001 }, () => ({
      profile_id: u.id,
      persona_id: persona.id,
      persona_nombre: "Cliente antiguo",
      persona_dni: "12345678",
      total: 10,
      monto_pagado: 5,
      estado: "PENDIENTE",
      created_at: viejo,
    })),
    headers: { Prefer: "return=minimal" },
  });
  expect(ventas.ok(), await ventas.text()).toBe(true);
  for (const [total, pago, estado] of [
    [25.5, 25.5, "COMPLETADA"],
    [30, 40, "PENDIENTE"],
    [999, 999, "ANULADA"],
  ] as const) {
    const v = await dbInsert<{ id: string }>("ventas", {
      profile_id: u.id,
      persona_id: persona.id,
      persona_nombre: "Cliente antiguo",
      persona_dni: "12345678",
      total,
      monto_pagado: pago,
      estado,
    });
    await dbInsert("venta_items", {
      venta_id: v.id,
      producto_nombre: "Producto",
      cantidad: 1,
      precio_unitario: total,
      subtotal: total,
      costo_unitario: 10,
    });
  }
  expect(
    (
      await db.post("/rest/v1/envios", {
        data: Array.from({ length: 1005 }, () => ({
          user_id: u.id,
          nombre: "Cliente antiguo",
          dni: "12345678",
          telefono: "999123456",
          estado: "NO_EMPACADO",
          fecha_registro: viejo,
        })),
        headers: { Prefer: "return=minimal" },
      })
    ).ok(),
  ).toBe(true);
  await dbInsert("compras", {
    profile_id: u.id,
    proveedor: "Anterior",
    total: 100,
    estado: "COMPLETADA",
    created_at: viejo,
  });
  await dbInsert("gastos", {
    profile_id: u.id,
    concepto: "Anterior",
    monto: 30,
    fecha: "2024-05-01",
    categoria: "OTROS",
  });
  await dbInsert("gastos", {
    profile_id: u.id,
    concepto: "Hoy",
    monto: 20,
    fecha: new Date().toISOString().slice(0, 10),
    categoria: "OTROS",
  });
  await dbInsert("productos", {
    profile_id: u.id,
    nombre: "Stock bajo",
    stock_actual: 1,
    stock_minimo: 2,
    archivado: false,
  });
  const previa = await db.get(
    `/rest/v1/ventas?select=*,items:venta_items(*)&profile_id=eq.${u.id}&limit=1000`,
  );
  const bytesAntes = (await previa.body()).byteLength,
    inicio = (await (await db.get("/__dev/usage")).json()).restBytes;
  const r = await api.get("/api/dashboard");
  expect(r.status(), await r.text()).toBe(200);
  const j = await r.json();
  expect(j.kpis.totalVentas).toBe(5070.5);
  expect(j.kpis.saldoDisponible).toBe(4920.5);
  expect(j.kpis.cobrosPendientes).toBe(1001);
  expect(j.kpis.cobrosPendientesTotal).toBe(5005);
  expect(j.kpis.ventasMes).toBe(55.5);
  expect(j.kpis.gananciaMes).toBe(35.5);
  expect(j.kpis.stockBajo).toBe(1);
  expect(j.pendientes.pedidosSinVenta).toBe(1005);
  expect(j.historico.ventas).toHaveLength(90);
  const bytesDespues =
    (await (await db.get("/__dev/usage")).json()).restBytes - inicio;
  expect(bytesDespues).toBeLessThan(bytesAntes * 0.1);
  console.log(
    `Resumen agregado: ${bytesAntes} bytes antes (solo primeras 1000 ventas), ${bytesDespues} bytes después, con histórico completo.`,
  );
  const clientes = await api.get("/api/clientes?busqueda=antiguo");
  expect(clientes.status(), await clientes.text()).toBe(200);
  expect((await clientes.json()).data[0]).toMatchObject({
    ventas: 1003,
    totalVentas: 10065.5,
    envios: 1005,
  });
  const externa = await appApi(otro.token);
  expect(
    (await (await externa.get(`/api/clientes?user_id=${u.id}`)).json()).data,
  ).toHaveLength(0);
  await externa.dispose();
  await db.dispose();
  await api.dispose();
});
