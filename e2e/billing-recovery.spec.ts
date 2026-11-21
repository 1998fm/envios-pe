import { createHmac } from "node:crypto";
import { test, expect } from "./support/test";
import {
  appApi,
  createUser,
  supabase,
  dbSelect,
  randomIp,
} from "./support/stack";
test.describe.configure({ mode: "serial" });
test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
});
async function fixtures(data: object) {
  const db = await supabase("service");
  const r = await db.post("/__dev/mp", { data });
  expect(r.status()).toBe(200);
  await db.dispose();
}
async function caso(meses = 1) {
  const user = await createUser({ plan: "basic" }),
    id = crypto.randomUUID().replaceAll("-", ""),
    pago = String(Math.floor(Math.random() * 1e12)),
    factura = String(Math.floor(Math.random() * 1e12)),
    fecha = new Date(Date.now() - 60000).toISOString(),
    monto = meses === 3 ? 129.9 : 49.9;
  const sub = {
    id,
    status: "authorized",
    external_reference: `${user.id}__business_plus`,
    payer_id: 1,
    collector_id: 2,
    auto_recurring: {
      frequency: meses,
      frequency_type: "months",
      transaction_amount: monto,
      currency_id: "PEN",
    },
  };
  const payment = {
    id: pago,
    status: "approved",
    date_approved: fecha,
    date_last_updated: fecha,
    transaction_amount: monto,
    currency_id: "PEN",
    payer: { id: 1 },
    collector_id: 2,
    external_reference: sub.external_reference,
  };
  const invoice = {
    id: factura,
    preapproval_id: id,
    debit_date: fecha,
    transaction_amount: monto,
    currency_id: "PEN",
    payment: { id: pago, status: "approved" },
  };
  return { user, sub, payment, invoice };
}
function entrega(
  id: string,
  unidad: "s" | "ms" = "s",
  edad = 0,
  secret = "local-webhook-secret",
) {
  const ts = String(
      unidad === "s"
        ? Math.floor((Date.now() - edad) / 1000)
        : Date.now() - edad,
    ),
    rid = crypto.randomUUID(),
    signature = createHmac("sha256", secret)
      .update(`id:${id};request-id:${rid};ts:${ts};`)
      .digest("hex");
  return {
    headers: { "x-signature": `ts=${ts},v1=${signature}`, "x-request-id": rid },
    data: { type: "payment", data: { id } },
  };
}
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
  return { api, db };
}

test("notificaciones en segundos y milisegundos activan el período; duplicados no suman y firmas viejas no escriben", async () => {
  for (const unidad of ["s", "ms"] as const) {
    const c = await caso(unidad === "s" ? 3 : 1);
    await fixtures({
      subscriptions: [c.sub],
      payments: [c.payment],
      invoices: [c.invoice],
    });
    const api = await appApi(null),
      body = entrega(c.payment.id, unidad);
    expect(
      (
        await api.post(
          `/api/webhooks/mercadopago?data.id=${c.payment.id}`,
          body,
        )
      ).status(),
    ).toBe(200);
    const p = (await dbSelect("profiles", `id=eq.${c.user.id}`))[0];
    expect(p.plan).toBe("business_plus");
    const fin = new Date(c.invoice.debit_date);
    fin.setUTCMonth(fin.getUTCMonth() + (unidad === "s" ? 3 : 1));
    expect(Date.parse(p.pro_until)).toBe(fin.getTime());
    expect(
      (
        await api.post(
          `/api/webhooks/mercadopago?data.id=${c.payment.id}`,
          body,
        )
      ).status(),
    ).toBe(200);
    expect((await dbSelect("pagos", `user_id=eq.${c.user.id}`)).length).toBe(1);
    expect(
      (await dbSelect("profiles", `id=eq.${c.user.id}`))[0].pro_until,
    ).toBe(p.pro_until);
    const before = (await dbSelect("mp_eventos", `recurso=eq.${c.payment.id}`))
      .length;
    for (const mal of [
      entrega(c.payment.id, unidad, 700000),
      entrega(c.payment.id, unidad, 0, "incorrecta"),
    ])
      expect(
        (
          await api.post(
            `/api/webhooks/mercadopago?data.id=${c.payment.id}`,
            mal,
          )
        ).status(),
      ).toBe(401);
    expect(
      (await dbSelect("mp_eventos", `recurso=eq.${c.payment.id}`)).length,
    ).toBe(before);
    await api.dispose();
  }
});

test("factura demorada devuelve 503, persiste el pendiente y recupera sin duplicar el acceso manual", async () => {
  const c = await caso();
  await fixtures({ subscriptions: [c.sub], payments: [c.payment] });
  const api = await appApi(null),
    body = entrega(c.payment.id);
  expect(
    (
      await api.post(`/api/webhooks/mercadopago?data.id=${c.payment.id}`, body)
    ).status(),
  ).toBe(503);
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "basic",
  );
  let e = (await dbSelect("mp_eventos", `recurso=eq.${c.payment.id}`))[0];
  expect(e.estado).toBe("error");
  expect(e.detalle).toContain("factura");
  const db = await supabase("service"),
    hasta = new Date(Date.now() + 35 * 86400000).toISOString();
  await db.patch(`/rest/v1/profiles?id=eq.${c.user.id}`, {
    data: { plan: "business_plus", pro_until: hasta },
  });
  await fixtures({ invoices: [c.invoice] });
  expect(
    (
      await api.post(`/api/webhooks/mercadopago?data.id=${c.payment.id}`, body)
    ).status(),
  ).toBe(200);
  expect(
    Date.parse((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].pro_until),
  ).toBe(Date.parse(hasta));
  expect((await dbSelect("pagos", `user_id=eq.${c.user.id}`)).length).toBe(1);
  e = (await dbSelect("mp_eventos", `recurso=eq.${c.payment.id}`))[0];
  expect(e.estado).toBe("completado");
  expect(e.intentos).toBe(2);
  await db.dispose();
  await api.dispose();
});

test("fallo de comprobante reintentable y un reembolso posterior no se pierde por deduplicar", async () => {
  const c = await caso();
  await fixtures({
    subscriptions: [c.sub],
    payments: [c.payment],
    invoices: [c.invoice],
    failReceipt: 1,
  });
  const api = await appApi(null),
    body = entrega(c.payment.id);
  expect(
    (
      await api.post(`/api/webhooks/mercadopago?data.id=${c.payment.id}`, body)
    ).status(),
  ).toBe(503);
  expect(
    (
      await api.post(`/api/webhooks/mercadopago?data.id=${c.payment.id}`, body)
    ).status(),
  ).toBe(200);
  await fixtures({
    payments: [
      {
        ...c.payment,
        status: "refunded",
        transaction_amount_refunded: 49.9,
        date_last_updated: new Date().toISOString(),
      },
    ],
  });
  expect(
    (
      await api.post(
        `/api/webhooks/mercadopago?data.id=${c.payment.id}`,
        entrega(c.payment.id),
      )
    ).status(),
  ).toBe(200);
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "basic",
  );
  expect((await dbSelect("pagos", `user_id=eq.${c.user.id}`)).length).toBe(1);
  await api.dispose();
});

test("cron recupera un pago sin webhook, registra su ejecución y conserva pruebas de configuración", async () => {
  const c = await caso();
  await fixtures({
    subscriptions: [c.sub],
    payments: [c.payment],
    invoices: [c.invoice],
  });
  const api = await appApi(null);
  const res = await api.get("/api/cron/downgrade-plans", {
    headers: { Authorization: "Bearer local-cron-secret" },
    timeout: 120000,
  });
  expect(res.status(), await res.text()).toBe(200);
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "business_plus",
  );
  expect((await dbSelect("pagos", `user_id=eq.${c.user.id}`)).length).toBe(1);
  const a = await admin(),
    diagnostico = await a.api.get("/api/admin/facturacion/eventos");
  expect(diagnostico.status()).toBe(200);
  const j = await diagnostico.json();
  expect(j.configuracion).toEqual({
    credencial: true,
    firma: true,
    cron: true,
  });
  expect(j.ejecuciones[0].origen).toBe("cron");
  expect(j.ejecuciones[0].ok).toBe(true);
  await a.db.dispose();
  await a.api.dispose();
  await api.dispose();
});

test("cola y diagnóstico privados; dos trabajadores no toman el mismo evento y se recupera una reserva vencida", async () => {
  const normal = await createUser(),
    api = await appApi(null);
  expect((await api.get("/api/admin/facturacion/eventos")).status()).toBe(401);
  await api.post("/api/auth/login", {
    data: { email: normal.email, password: normal.password },
  });
  expect((await api.get("/api/admin/facturacion/eventos")).status()).toBe(403);
  expect(
    (
      await api.post("/api/admin/facturacion/eventos", {
        data: { accion: "operacion", operacion: "123" },
      })
    ).status(),
  ).toBe(403);
  for (const rol of ["anon", { token: normal.token }] as const) {
    const db = await supabase(rol);
    expect(
      (await db.get("/rest/v1/mp_eventos")).status(),
    ).toBeGreaterThanOrEqual(400);
    expect(
      (
        await db.post("/rest/v1/rpc/tori_tomar_evento_mp", {
          data: { p_id: null },
        })
      ).status(),
    ).toBeGreaterThanOrEqual(400);
    await db.dispose();
  }
  const db = await supabase("service"),
    id = crypto.randomUUID();
  await db.post("/rest/v1/mp_eventos", {
    data: { id, tipo: "payment", recurso: "123", estado: "pendiente" },
  });
  const rr = await Promise.all(
    Array.from({ length: 5 }, () =>
      db.post("/rest/v1/rpc/tori_tomar_evento_mp", { data: { p_id: id } }),
    ),
  );
  const jj = await Promise.all(rr.map((r) => r.json()));
  expect(jj.filter(Boolean).length).toBe(1);
  await db.patch(`/rest/v1/mp_eventos?id=eq.${id}`, {
    data: { actualizado_en: new Date(Date.now() - 7 * 60000).toISOString() },
  });
  const retomado = await (
    await db.post("/rest/v1/rpc/tori_tomar_evento_mp", { data: { p_id: id } })
  ).json();
  expect(retomado.intentos).toBe(2);
  expect(retomado.lease).not.toBe(jj.find(Boolean).lease);
  // Este evento sintético no representa un pago: finalizarlo para no contaminar otros tests.
  await db.patch(`/rest/v1/mp_eventos?id=eq.${id}`, {
    data: { estado: "ignorado" },
  });
  await db.dispose();
  await api.dispose();
});

test("superadmin recupera por operación desde la interfaz y ve el motivo del pendiente", async ({
  page,
}) => {
  const c = await caso();
  await fixtures({ subscriptions: [c.sub], payments: [c.payment] });
  const a = await admin();
  await page.context().addCookies((await a.api.storageState()).cookies);
  await page.goto("/admin");
  await page.getByRole("button", { name: "Facturación", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Activación de pagos y recuperación" }),
  ).toBeVisible();
  await page
    .getByLabel("Número de operación de Mercado Pago")
    .fill(c.payment.id);
  await page
    .getByRole("button", { name: "Verificar y recuperar pago", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "factura del pago" }),
  ).toBeVisible();
  const fila = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "Activación de pagos y recuperación",
      }),
    })
    .locator("div.rounded-xl.border")
    .filter({ hasText: c.payment.id });
  await expect(fila).toContainText("error");
  await fixtures({ invoices: [c.invoice] });
  await fila.getByRole("button", { name: "Reintentar operación" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Procesamiento completado" }),
  ).toBeVisible();
  expect((await dbSelect("pagos", `user_id=eq.${c.user.id}`)).length).toBe(1);
  await a.api.dispose();
  await a.db.dispose();
});
