import { createHmac } from "node:crypto";
import { test, expect } from "./support/test";
import {
  appApi,
  createUser,
  dbInsert,
  dbSelect,
  supabase,
  randomIp,
} from "./support/stack";
test.describe.configure({ mode: "serial" });
test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
});
async function fixtures(data: object) {
  const svc = await supabase("service");
  const r = await svc.post("/__dev/mp", { data });
  expect(r.status(), await r.text()).toBe(200);
  await svc.dispose();
}
async function webhook(type: string, id: string, bodyId = id) {
  const ts = String(Date.now()),
    reqId = `billing-${crypto.randomUUID()}`,
    signature = createHmac("sha256", "local-webhook-secret")
      .update(`id:${id};request-id:${reqId};ts:${ts};`)
      .digest("hex");
  const api = await appApi(null);
  const r = await api.post(`/api/webhooks/mercadopago?data.id=${id}`, {
    data: { type, data: { id: bodyId } },
    headers: {
      "x-signature": `ts=${ts},v1=${signature}`,
      "x-request-id": reqId,
    },
  });
  const status = r.status(),
    texto = await r.text();
  await api.dispose();
  return { status: () => status, text: async () => texto };
}
async function caso(estado = "approved", meses = 1) {
  const user = await createUser({ plan: "basic" });
  const id = crypto.randomUUID().replaceAll("-", "");
  const pago = String(Math.floor(Math.random() * 1e12));
  const factura = String(Math.floor(Math.random() * 1e12));
  const fecha = new Date(Date.now() - 60000).toISOString();
  const monto = meses === 3 ? 129.9 : 49.9;
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
    status: estado,
    date_approved: estado === "approved" ? fecha : undefined,
    date_last_updated: fecha,
    transaction_amount: monto,
    currency_id: "PEN",
    payer: { id: 1 },
    collector_id: 2,
  };
  const invoice = {
    id: factura,
    preapproval_id: id,
    debit_date: fecha,
    transaction_amount: monto,
    currency_id: "PEN",
    payment: { id: pago, status: estado },
  };
  await fixtures({
    subscriptions: [sub],
    payments: [payment],
    invoices: [invoice],
  });
  return { user, sub, payment, invoice };
}

test("autorización sin cobro no activa Plus; firma e ID deben coincidir", async () => {
  const u = await createUser({ plan: "basic" });
  const sub = {
    id: crypto.randomUUID().replaceAll("-", ""),
    status: "authorized",
    external_reference: `${u.id}__business_plus`,
  };
  await fixtures({ subscriptions: [sub] });
  expect((await webhook("subscription_preapproval", sub.id)).status()).toBe(
    200,
  );
  expect((await dbSelect("profiles", `id=eq.${u.id}`))[0].plan).toBe("basic");
  expect(
    (await webhook("subscription_preapproval", sub.id, "otro-id")).status(),
  ).toBe(400);
});
test("un cobro aprobado activa Plus una sola vez y la renovación crea otro recibo", async () => {
  const c = await caso();
  const rr = await Promise.all([
    webhook("subscription_authorized_payment", c.invoice.id),
    webhook("subscription_authorized_payment", c.invoice.id),
  ]);
  for (const r of rr) expect(r.status(), await r.text()).toBe(200);
  let p = (await dbSelect("profiles", `id=eq.${c.user.id}`))[0];
  expect(p.plan).toBe("business_plus");
  const fecha1 = p.pro_until;
  expect(await dbSelect("pagos", `user_id=eq.${c.user.id}`)).toHaveLength(1);
  const fecha2 = new Date(Date.now() + 29 * 864e5).toISOString(),
    pid = String(Number(c.payment.id) + 1),
    fid = String(Number(c.invoice.id) + 1);
  await fixtures({
    payments: [
      {
        ...c.payment,
        id: pid,
        date_approved: new Date().toISOString(),
        date_last_updated: new Date().toISOString(),
      },
    ],
    invoices: [
      {
        ...c.invoice,
        id: fid,
        debit_date: fecha2,
        payment: { id: pid, status: "approved" },
      },
    ],
  });
  const r = await webhook("subscription_authorized_payment", fid);
  expect(r.status(), await r.text()).toBe(200);
  p = (await dbSelect("profiles", `id=eq.${c.user.id}`))[0];
  expect(String(p.pro_until) > String(fecha1)).toBe(true);
  expect(await dbSelect("pagos", `user_id=eq.${c.user.id}`)).toHaveLength(2);
});
test("rechazado no activa, reembolso revoca el período y eventos repetidos no lo restauran", async () => {
  const c = await caso("rejected");
  expect(
    (await webhook("subscription_authorized_payment", c.invoice.id)).status(),
  ).toBe(200);
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "basic",
  );
  const fecha = new Date().toISOString();
  await fixtures({
    payments: [
      {
        ...c.payment,
        status: "approved",
        date_approved: fecha,
        date_last_updated: fecha,
      },
    ],
  });
  expect((await webhook("payment", c.payment.id)).status()).toBe(200);
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "business_plus",
  );
  await fixtures({
    payments: [
      {
        ...c.payment,
        status: "refunded",
        date_approved: fecha,
        date_last_updated: new Date(Date.now() + 1000).toISOString(),
      },
    ],
  });
  expect((await webhook("payment", c.payment.id)).status()).toBe(200);
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "basic",
  );
  expect((await webhook("subscription_preapproval", c.sub.id)).status()).toBe(
    200,
  );
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "basic",
  );
});
test("importe, moneda o pagador incorrectos no conceden acceso", async () => {
  const c = await caso();
  for (const patch of [
    { transaction_amount: 1 },
    { currency_id: "USD" },
    { payer: { id: 999 } },
  ]) {
    await fixtures({ payments: [{ ...c.payment, ...patch }] });
    expect(
      (await webhook("subscription_authorized_payment", c.invoice.id)).status(),
    ).toBe(503);
    expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
      "basic",
    );
  }
  await fixtures({ payments: [c.payment] });
});
test("contratación concurrente reutiliza el pendiente y bloquea otra suscripción activa", async () => {
  const u = await createUser({ plan: "basic" }),
    api = await appApi(u.token);
  const body = { plan: "business_plus", periodo: "trimestral" };
  const rs = await Promise.all([
    api.post("/api/mercadopago/create-subscription", { data: body }),
    api.post("/api/mercadopago/create-subscription", { data: body }),
  ]);
  expect(rs.map((r) => r.status())).toContain(200);
  const uno = rs.find((r) => r.status() === 200)!;
  const id = (await uno.json()).preapproval_id;
  const retry = await api.post("/api/mercadopago/create-subscription", {
    data: body,
  });
  expect(retry.status(), await retry.text()).toBe(200);
  expect((await retry.json()).preapproval_id).toBe(id);
  const svc = await supabase("service");
  const all = (await (await svc.get("/__dev/mp")).json()).subscriptions.filter(
    (s: { external_reference: string }) =>
      s.external_reference.startsWith(u.id),
  );
  expect(all).toHaveLength(1);
  expect(all[0].auto_recurring.frequency).toBe(3);
  expect(all[0].back_url).toBe("https://hey-tori.vercel.app/dashboard");
  await fixtures({ subscriptions: [{ ...all[0], status: "authorized" }] });
  expect(
    (
      await api.post("/api/mercadopago/create-subscription", { data: body })
    ).status(),
  ).toBe(409);
  await svc.dispose();
  await api.dispose();
});
test("cancelación verifica dueño, detiene MP y conserva el período pagado", async () => {
  const c = await caso();
  expect(
    (await webhook("subscription_authorized_payment", c.invoice.id)).status(),
  ).toBe(200);
  const antes = (await dbSelect("profiles", `id=eq.${c.user.id}`))[0].pro_until;
  const api = await appApi(c.user.token),
    otro = await appApi((await createUser()).token),
    anon = await appApi(null);
  expect(
    (
      await anon.delete("/api/mercadopago/subscription", {
        data: { id: c.sub.id },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await otro.delete("/api/mercadopago/subscription", {
        data: { id: c.sub.id },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await api.delete("/api/mercadopago/subscription", {
        data: { id: c.sub.id },
      })
    ).status(),
  ).toBe(200);
  const d = await (await api.get("/api/mercadopago/subscription")).json();
  expect(
    d.suscripciones.find((s: { id: string }) => s.id === c.sub.id).estado,
  ).toBe("cancelled");
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].pro_until).toBe(
    antes,
  );
  expect(
    (
      await api.delete("/api/mercadopago/subscription", {
        data: { id: c.sub.id },
      })
    ).status(),
  ).toBe(200);
  await api.dispose();
  await otro.dispose();
  await anon.dispose();
});
test("un miembro no puede contratar ni cancelar para su dueño", async () => {
  const owner = await createUser(),
    miembro = await createUser();
  const rol = await dbInsert<{ id: string }>("business_roles", {
    owner_id: owner.id,
    nombre: "Facturación no autorizada",
    vista_default: "envios",
    permisos: { ver_envios: true },
  });
  await dbInsert("business_members", {
    owner_id: owner.id,
    user_id: miembro.id,
    role_id: rol.id,
  });
  const api = await appApi(miembro.token);
  expect((await api.get("/api/mercadopago/subscription")).status()).toBe(403);
  expect(
    (
      await api.post("/api/mercadopago/create-subscription", {
        data: { plan: "business_plus", periodo: "mensual" },
      })
    ).status(),
  ).toBe(403);
  await api.dispose();
});

test("la conciliación procesa suscripciones después de las primeras 100", async () => {
  const relleno = Array.from({ length: 150 }, (_, i) => ({
    id: `externa-${i}`,
    status: "authorized",
    external_reference: `otro-sistema-${i}`,
  }));
  await fixtures({ subscriptions: relleno });
  const c = await caso();
  const api = await appApi(null);
  const r = await api.get("/api/cron/downgrade-plans", {
    headers: { Authorization: "Bearer local-cron-secret" },
  });
  expect(r.status(), await r.text()).toBe(200);
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "business_plus",
  );
  await api.dispose();
});
test("cancelar desde el panel conserva acceso y habilita nueva contratación sin solapar cobros", async ({
  page,
}) => {
  const c = await caso();
  expect(
    (await webhook("subscription_authorized_payment", c.invoice.id)).status(),
  ).toBe(200);
  const { abrirDashboard } = await import("./support/ui");
  await abrirDashboard(page, c.user, "envios");
  await page
    .locator('[data-tour="topbar"]')
    .getByRole("button", { name: "Ver planes", exact: true })
    .click();
  await expect(
    page.getByText("Renovación automática activa", { exact: true }),
  ).toBeVisible();
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Cancelar renovación", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Renovación cancelada en Mercado Pago" }),
  ).toBeVisible();
  const api = await appApi(c.user.token);
  const r = await api.post("/api/mercadopago/create-subscription", {
    data: { plan: "business_plus", periodo: "trimestral" },
  });
  expect(r.status(), await r.text()).toBe(200);
  const svc = await supabase("service");
  const values = (await (await svc.get("/__dev/mp")).json()).subscriptions;
  const resultado = await r.json();
  const elegido = values.find(
    (s: { id: string }) => s.id === resultado.preapproval_id,
  );
  expect(new Date(elegido.auto_recurring.start_date).getTime()).toBeGreaterThan(
    Date.now(),
  );
  await api.dispose();
  await svc.dispose();
});

test("una respuesta ambigua no crea otro contrato; un rechazo definitivo permite reintentar", async () => {
  const a = await createUser({ plan: "basic" }),
    api = await appApi(a.token);
  const data = { plan: "business_plus", periodo: "mensual" };
  await fixtures({ failCreate: 503 });
  expect(
    (await api.post("/api/mercadopago/create-subscription", { data })).status(),
  ).toBe(503);
  expect(
    (await api.post("/api/mercadopago/create-subscription", { data })).status(),
  ).toBe(409);
  const b = await createUser({ plan: "basic" }),
    apiB = await appApi(b.token);
  await fixtures({ failCreate: 400 });
  expect(
    (
      await apiB.post("/api/mercadopago/create-subscription", { data })
    ).status(),
  ).toBe(502);
  expect(
    (
      await apiB.post("/api/mercadopago/create-subscription", { data })
    ).status(),
  ).toBe(200);
  await api.dispose();
  await apiB.dispose();
});
test("no activa si falla el comprobante y recupera el cobro sin duplicarlo al reintentar", async () => {
  const c = await caso();
  await fixtures({ failReceipt: 1 });
  expect(
    (await webhook("subscription_authorized_payment", c.invoice.id)).status(),
  ).toBe(503);
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "basic",
  );
  expect(
    (await webhook("subscription_authorized_payment", c.invoice.id)).status(),
  ).toBe(200);
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "business_plus",
  );
  expect(await dbSelect("pagos", `user_id=eq.${c.user.id}`)).toHaveLength(1);
});
test("superadmin cancela desde soporte con motivo y auditoría; bajar acceso no se revierte por un evento repetido", async () => {
  const c = await caso();
  expect(
    (await webhook("subscription_authorized_payment", c.invoice.id)).status(),
  ).toBe(200);
  const admin = await createUser();
  const db = await supabase("service");
  await db.patch(`/rest/v1/profiles?id=eq.${admin.id}`, {
    data: { role: "super_admin" },
  });
  await db.dispose();
  const api = await appApi(null);
  await api.post("/api/auth/login", {
    data: { email: admin.email, password: admin.password },
  });
  const url = `/api/admin/empresas/${c.user.id}/suscripcion`;
  const normal = await appApi(null);
  await normal.post("/api/auth/login", {
    data: { email: c.user.email, password: c.user.password },
  });
  expect((await normal.get(url)).status()).toBe(403);
  expect(
    (
      await api.delete(url, { data: { id: c.sub.id, motivo: "corto" } })
    ).status(),
  ).toBe(400);
  const bajar = await api.patch(`/api/admin/empresas/${c.user.id}`, {
    data: { plan: "basic" },
  });
  expect(bajar.status(), await bajar.text()).toBe(200);
  expect((await webhook("subscription_preapproval", c.sub.id)).status()).toBe(
    200,
  );
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "basic",
  );
  const cancelar = await api.delete(url, {
    data: {
      id: c.sub.id,
      motivo: "Cancelación solicitada por el titular del negocio.",
    },
  });
  expect(cancelar.status(), await cancelar.text()).toBe(200);
  const logs = await dbSelect(
    "admin_audit_log",
    `admin_id=eq.${admin.id}&accion=eq.cancelar_suscripcion_mp`,
  );
  expect(logs).toHaveLength(1);
  expect((logs[0].detalle as { estado: string }).estado).toBe("aplicado");
  await api.dispose();
  await normal.dispose();
});

test("Pro histórico sigue procesando cobros verificados con su importe anterior", async () => {
  const c = await caso();
  await fixtures({
    subscriptions: [
      {
        ...c.sub,
        external_reference: `${c.user.id}__pro`,
        auto_recurring: { ...c.sub.auto_recurring, transaction_amount: 29.9 },
      },
    ],
    payments: [{ ...c.payment, transaction_amount: 29.9 }],
    invoices: [{ ...c.invoice, transaction_amount: 29.9 }],
  });
  expect(
    (await webhook("subscription_authorized_payment", c.invoice.id)).status(),
  ).toBe(200);
  expect((await dbSelect("profiles", `id=eq.${c.user.id}`))[0].plan).toBe(
    "business_plus",
  );
  expect((await dbSelect("pagos", `user_id=eq.${c.user.id}`))[0].monto).toBe(
    29.9,
  );
});

test("repara trimestre histórico, cancela renovación real y conserva solo el pago no devuelto; reintento idempotente", async ({
  page,
}) => {
  const c = await caso("approved", 3);
  const sub = {
    ...c.sub,
    date_created: "2026-10-15T12:00:00Z",
    next_payment_date: "2026-12-15T12:00:00Z",
    auto_recurring: { ...c.sub.auto_recurring, frequency: 1 },
  };
  const fecha = "2026-10-15T12:00:00Z",
    fecha2 = "2026-11-15T12:00:00Z";
  const pago2 = String(Number(c.payment.id) + 1),
    factura2 = String(Number(c.invoice.id) + 1);
  await fixtures({
    subscriptions: [sub],
    payments: [
      { ...c.payment, date_approved: fecha, date_last_updated: fecha },
      {
        ...c.payment,
        id: pago2,
        date_approved: fecha2,
        date_last_updated: fecha2,
        status: "refunded",
        transaction_amount_refunded: 129.9,
      },
    ],
    invoices: [
      { ...c.invoice, debit_date: fecha },
      {
        ...c.invoice,
        id: factura2,
        debit_date: fecha2,
        payment: { id: pago2 },
      },
    ],
  });
  const admin = await createUser();
  const svc = await supabase("service");
  await svc.patch(`/rest/v1/profiles?id=eq.${admin.id}`, {
    data: { role: "super_admin" },
  });
  const api = await appApi(null);
  await api.post("/api/auth/login", {
    data: { email: admin.email, password: admin.password },
  });
  const url = `/api/admin/empresas/${c.user.id}/suscripcion`;
  const normal = await appApi(null);
  await normal.post("/api/auth/login", {
    data: { email: c.user.email, password: c.user.password },
  });
  expect((await normal.post(url)).status()).toBe(403);
  for (let i = 0; i < 2; i++) {
    const result = await api.post(url);
    expect(result.status(), await result.text()).toBe(200);
    const data = await (await api.get(url)).json();
    expect(
      data.suscripciones.find((s: { id: string }) => s.id === sub.id).estado,
    ).toBe("cancelled");
    expect(data.recibos).toHaveLength(2);
    expect(new Date(data.hasta).toISOString()).toBe("2027-01-15T12:00:00.000Z");
    expect(
      data.recibos.find((r: { id: string }) => r.id === pago2).estado,
    ).toBe("refunded");
    expect(
      data.recibos.find((r: { id: string }) => r.id === pago2).reembolsado,
    ).toBe(129.9);
  }
  const pagos = await dbSelect("pagos", `user_id=eq.${c.user.id}`);
  expect(pagos).toHaveLength(2);
  expect(
    pagos.every((p: { periodo_meses: number }) => p.periodo_meses === 3),
  ).toBe(true);
  const global = await (await api.get("/api/admin/facturacion")).json();
  expect(
    global.recibos.find((r: { payment_id: string }) => r.payment_id === pago2)
      .reembolsado,
  ).toBe(129.9);
  await page
    .context()
    .addCookies(await api.storageState().then((s) => s.cookies));
  await page.goto("/admin");
  await page.getByPlaceholder("Nombre, correo o enlace").fill(c.user.email);
  await page.getByRole("button").filter({ hasText: c.user.email }).click();
  await page.getByRole("button", { name: "Acceso Plus", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Sincronizar pagos y corregir contratos históricos",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Renovación cancelada", { exact: true }),
  ).toBeVisible();
  await page.getByText("Historial de cobros", { exact: true }).click();
  await expect(page.getByText("Reembolsado", { exact: true })).toBeVisible();
  await page.getByText("Ver detalle del pago", { exact: true }).first().click();
  await expect(
    page.getByText(new RegExp(`Pago MP: (${c.payment.id}|${pago2})`)).first(),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: "Sincronizar pagos y corregir contratos históricos",
    })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Sincronización completa",
  );
  await page.screenshot({
    path: "/workspace/output/suscripcion-historica-reparada.png",
    fullPage: true,
  });
  // La consulta devuelve contrato, próxima fecha y cada transacción con estado.
  const detalle = await (await api.get(url)).json();
  expect(detalle.suscripciones[0].proximoCobro).toBeNull();
  await normal.dispose();
  await api.dispose();
  await svc.dispose();
});

test("una referencia nueva o fecha posterior no se reinterpreta como trimestre histórico", async () => {
  for (const patch of [
    { external_reference: `nuevo` },
    { date_created: "2026-11-12T12:00:00Z" },
    { date_created: undefined },
  ]) {
    const c = await caso("approved", 3);
    const sub = {
      ...c.sub,
      date_created: "2026-10-15T12:00:00Z",
      ...patch,
      external_reference: patch.external_reference
        ? `${c.user.id}__business_plus__nuevo`
        : c.sub.external_reference,
      auto_recurring: { ...c.sub.auto_recurring, frequency: 1 },
    };
    await fixtures({ subscriptions: [sub] });
    expect(
      (await webhook("subscription_authorized_payment", c.invoice.id)).status(),
    ).toBe(503);
    const svc = await supabase("service");
    const real = (await (await svc.get("/__dev/mp")).json()).subscriptions.find(
      (s: { id: string }) => s.id === sub.id,
    );
    expect(real.status).toBe("authorized");
    expect(await dbSelect("pagos", `user_id=eq.${c.user.id}`)).toHaveLength(0);
    await fixtures({ subscriptions: [c.sub] });
    await svc.dispose();
  }
});

test("si Mercado Pago falla al cancelar no declara corregido; el reintento recupera el trimestre Pro histórico", async () => {
  const c = await caso("approved", 3);
  const monto = 79.9;
  const sub = {
    ...c.sub,
    external_reference: `${c.user.id}__pro`,
    date_created: "2026-10-15T12:00:00Z",
    auto_recurring: {
      ...c.sub.auto_recurring,
      transaction_amount: monto,
      frequency: 1,
    },
  };
  await fixtures({
    subscriptions: [sub],
    payments: [{ ...c.payment, transaction_amount: monto }],
    invoices: [{ ...c.invoice, transaction_amount: monto }],
    failUpdate: 503,
  });
  expect((await webhook("subscription_preapproval", sub.id)).status()).toBe(
    503,
  );
  expect(await dbSelect("pagos", `user_id=eq.${c.user.id}`)).toHaveLength(0);
  const svc = await supabase("service");
  expect(
    (await (await svc.get("/__dev/mp")).json()).subscriptions.find(
      (s: { id: string }) => s.id === sub.id,
    ).status,
  ).toBe("authorized");
  expect((await webhook("subscription_preapproval", sub.id)).status()).toBe(
    200,
  );
  expect(
    (await dbSelect("pagos", `user_id=eq.${c.user.id}`))[0].periodo_meses,
  ).toBe(3);
  expect(
    (await (await svc.get("/__dev/mp")).json()).subscriptions.find(
      (s: { id: string }) => s.id === sub.id,
    ).status,
  ).toBe("cancelled");
  await svc.dispose();
});

test("dos cargos trimestrales históricos retenidos cubren seis meses; una devolución recalcula sin duplicar", async () => {
  const c = await caso("approved", 3);
  const sub = {
    ...c.sub,
    date_created: "2026-10-15T12:00:00Z",
    auto_recurring: { ...c.sub.auto_recurring, frequency: 1 },
  };
  const fecha1 = "2026-10-15T12:00:00Z",
    fecha2 = "2026-11-15T12:00:00Z";
  const p2 = String(Number(c.payment.id) + 1),
    f2 = String(Number(c.invoice.id) + 1);
  await fixtures({
    subscriptions: [sub],
    payments: [
      { ...c.payment, date_approved: fecha1, date_last_updated: fecha1 },
      {
        ...c.payment,
        id: p2,
        date_approved: fecha2,
        date_last_updated: fecha2,
      },
    ],
    invoices: [
      { ...c.invoice, debit_date: fecha1 },
      { ...c.invoice, id: f2, debit_date: fecha2, payment: { id: p2 } },
    ],
  });
  for (let i = 0; i < 2; i++) {
    expect((await webhook("subscription_preapproval", sub.id)).status()).toBe(
      200,
    );
    expect(
      new Date(
        (await dbSelect("profiles", `id=eq.${c.user.id}`))[0].pro_until,
      ).toISOString(),
    ).toBe("2027-04-15T12:00:00.000Z");
  }
  await fixtures({
    payments: [
      {
        ...c.payment,
        id: p2,
        date_approved: fecha2,
        date_last_updated: new Date().toISOString(),
        status: "refunded",
        transaction_amount_refunded: 129.9,
      },
    ],
  });
  expect((await webhook("subscription_preapproval", sub.id)).status()).toBe(
    200,
  );
  expect(
    new Date(
      (await dbSelect("profiles", `id=eq.${c.user.id}`))[0].pro_until,
    ).toISOString(),
  ).toBe("2027-01-15T12:00:00.000Z");
  expect(await dbSelect("pagos", `user_id=eq.${c.user.id}`)).toHaveLength(2);
});

test("sincronización diagnostica operación y HTTP sin revelar el cuerpo privado; reintenta solo lecturas transitorias", async ({
  page,
}) => {
  const c = await caso();
  const route = "/authorized_payments/search";
  await fixtures({
    failures: [{ route, remaining: 1, status: 429, code: "too_many_requests" }],
  });
  expect((await webhook("subscription_preapproval", c.sub.id)).status()).toBe(
    200,
  );
  expect(await dbSelect("pagos", `user_id=eq.${c.user.id}`)).toHaveLength(1);
  const admin = await createUser();
  const svc = await supabase("service");
  await svc.patch(`/rest/v1/profiles?id=eq.${admin.id}`, {
    data: { role: "super_admin" },
  });
  const api = await appApi(null);
  await api.post("/api/auth/login", {
    data: { email: admin.email, password: admin.password },
  });
  await fixtures({
    failures: [
      {
        route,
        remaining: 2,
        status: 403,
        code: "forbidden",
        message: "PRIVATE_PROVIDER_BODY_with_email_and_token",
      },
    ],
  });
  const result = await api.post(`/api/admin/empresas/${c.user.id}/suscripcion`);
  expect(result.status()).toBe(503);
  const body = await result.json();
  expect(body.detalleErrores[0].http).toBe(403);
  expect(body.detalleErrores[0].operacion).toBe("Buscar facturas");
  expect(body.detalleErrores[0].error).toContain("HTTP 403");
  expect(JSON.stringify(body)).not.toContain("PRIVATE_PROVIDER_BODY");
  const requests = (await (await svc.get("/__dev/mp")).json()).requests;
  expect(
    requests
      .filter((r: { route: string }) => r.route === route)
      .every((r: { limit: string }) => Number(r.limit) <= 20),
  ).toBe(true);
  await page.context().addCookies((await api.storageState()).cookies);
  await page.goto("/admin");
  await page.getByPlaceholder("Nombre, correo o enlace").fill(c.user.email);
  await page.getByRole("button").filter({ hasText: c.user.email }).click();
  await page.getByRole("button", { name: "Acceso Plus", exact: true }).click();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: "Sincronizar pagos y corregir contratos históricos",
    })
    .click();
  await expect(
    page.getByText("Contratos pendientes de resolver", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Buscar facturas:.*HTTP 403/)).toBeVisible();
  await expect(
    page.getByText("PRIVATE_PROVIDER_BODY_with_email_and_token", {
      exact: true,
    }),
  ).toHaveCount(0);
  await fixtures({ failures: [] });
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: "Sincronizar pagos y corregir contratos históricos",
    })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Sincronización completa",
  );
  await expect(
    page.getByText("Contratos pendientes de resolver", { exact: true }),
  ).toHaveCount(0);
  await fixtures({
    failures: [
      {
        route: "/preapproval/search",
        remaining: 1,
        status: 400,
        code: "invalid_limit",
      },
    ],
  });
  const global = await api.post("/api/admin/facturacion/sync");
  expect(global.status()).toBe(503);
  expect((await global.json()).error).toContain("Buscar contratos:");
  await fixtures({ failures: [] });
  await page.getByRole("button", { name: "Facturación", exact: true }).click();
  await page.route("**/api/admin/facturacion/sync", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        revisadas: 1,
        sincronizadas: 0,
        renovacionesDetenidas: 0,
        error:
          "Sincronización parcial: revisa el detalle de contratos con error.",
        detalleErrores: [
          {
            suscripcion: c.sub.id,
            error: "Buscar facturas: parámetros rechazados (HTTP 400).",
          },
        ],
      }),
    }),
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Sincronizar pagos MP" }).click();
  await expect(
    page.getByRole("heading", { name: /Contratos pendientes de resolver/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "HTTP 400" }),
  ).toBeVisible();
  const diagnostico = await page
    .getByRole("heading", { name: /Contratos pendientes de resolver/ })
    .boundingBox();
  const historial = await page
    .getByText("Comprobantes de MercadoPago", { exact: false })
    .boundingBox();
  expect(diagnostico!.y).toBeLessThan(historial!.y);
  await page.screenshot({
    path: "/workspace/output/mp-diagnostico-visible.png",
    fullPage: false,
  });
  await page.unroute("**/api/admin/facturacion/sync");
  await api.dispose();
  await svc.dispose();
});

test("la paginación respeta páginas reducidas por Mercado Pago aunque no informe total", async () => {
  const c = await caso();
  const facturas = Array.from({ length: 13 }, (_, i) => ({
    ...c.invoice,
    id: `${c.invoice.id}-${i}`,
    payment: undefined,
  }));
  await fixtures({ invoices: facturas, clampLimit: 5, omitTotal: true });
  expect((await webhook("subscription_preapproval", c.sub.id)).status()).toBe(
    200,
  );
  const svc = await supabase("service");
  const requests = (await (await svc.get("/__dev/mp")).json()).requests.filter(
    (r: { route: string }) => r.route === "/authorized_payments/search",
  );
  expect(
    requests.some((r: { offset: string }) => Number(r.offset) === 10),
  ).toBe(true);
  await fixtures({ clampLimit: 0, omitTotal: false });
  await svc.dispose();
});

test("MP rechaza buscar facturas por contrato: recupera pagos por transacción, sin perder devolución ni trimestre", async () => {
  const c = await caso("approved", 3);
  const ref = c.sub.external_reference;
  const sub = {
    ...c.sub,
    date_created: "2026-10-15T12:00:00Z",
    auto_recurring: { ...c.sub.auto_recurring, frequency: 1 },
  };
  const fecha = "2026-10-15T12:00:00Z",
    fecha2 = "2026-11-15T12:00:00Z";
  const p2 = String(Number(c.payment.id) + 1),
    f2 = String(Number(c.invoice.id) + 1);
  await fixtures({
    subscriptions: [sub],
    payments: [
      {
        ...c.payment,
        external_reference: ref,
        date_approved: fecha,
        date_last_updated: fecha,
      },
      {
        ...c.payment,
        id: p2,
        external_reference: ref,
        status: "refunded",
        transaction_amount_refunded: 129.9,
        date_approved: fecha2,
        date_last_updated: fecha2,
      },
    ],
    invoices: [
      { ...c.invoice, debit_date: fecha },
      { ...c.invoice, id: f2, debit_date: fecha2, payment: { id: p2 } },
    ],
    failures: [
      {
        route: "/authorized_payments/search",
        preapprovalOnly: true,
        remaining: 100,
        status: 400,
      },
    ],
  });
  for (let i = 0; i < 2; i++) {
    expect((await webhook("subscription_preapproval", sub.id)).status()).toBe(
      200,
    );
    const p = (await dbSelect("profiles", `id=eq.${c.user.id}`))[0];
    expect(new Date(p.pro_until).toISOString()).toBe(
      "2027-01-15T12:00:00.000Z",
    );
    expect(await dbSelect("pagos", `user_id=eq.${c.user.id}`)).toHaveLength(2);
  }
  const svc = await supabase("service");
  const mp = await (await svc.get("/__dev/mp")).json();
  expect(
    mp.subscriptions.find((s: { id: string }) => s.id === sub.id).status,
  ).toBe("cancelled");
  expect(
    mp.requests.some(
      (r: { route: string }) => r.route === "/v1/payments/search",
    ),
  ).toBe(true);
  await fixtures({ failures: [] });
  await svc.dispose();
});

test("la ruta alternativa no convierte un historial desconocido en vacío ni asigna pagos de otro contrato", async () => {
  const c = await caso();
  await fixtures({
    payments: [{ ...c.payment, external_reference: c.sub.external_reference }],
    invoices: [{ ...c.invoice, preapproval_id: "otro-contrato" }],
    failures: [
      {
        route: "/authorized_payments/search",
        preapprovalOnly: true,
        remaining: 100,
        status: 400,
      },
    ],
  });
  expect((await webhook("subscription_preapproval", c.sub.id)).status()).toBe(
    503,
  );
  expect(await dbSelect("pagos", `user_id=eq.${c.user.id}`)).toHaveLength(0);
  await fixtures({ invoices: [c.invoice], failures: [] });
});
