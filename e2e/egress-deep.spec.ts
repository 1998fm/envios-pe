import { test, expect } from "./support/test";
import { appApi, createUser, supabase, dbInsert } from "./support/stack";
import { buscar } from "../src/lib/buscar";
import { calcularResumenVentas } from "../src/lib/ventasUI";
import { abrirDashboard } from "./support/ui";

test('el refresco de la pantalla refleja un nombre editado desde otra sesión', async ({page}) => {
  const u=await createUser(), db=await supabase('service')
  const e=await dbInsert<{id:string}>('envios',{user_id:u.id,nombre:'Nombre anterior',metodo:'SHALOM'})
  await page.clock.install()
  await abrirDashboard(page,u,'envios')
  await expect(page.getByText('Nombre anterior',{exact:true}).first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect((await db.patch(`/rest/v1/envios?id=eq.${e.id}`,{data:{nombre:'Nombre corregido'}})).ok()).toBe(true)
  await page.clock.fastForward(31000)
  await expect(page.getByText('Nombre corregido',{exact:true}).first()).toBeVisible()
  await db.dispose()
})

test("el refresco sin cambios es pequeño y detecta ediciones, borrados, filtros y bloqueo sin confiar en updated_at", async () => {
  const u = await createUser(),
    api = await appApi(u.token),
    db = await supabase("service");
  const e = await dbInsert<{ id: string }>("envios", {
    user_id: u.id,
    nombre: "María",
    metodo: "SHALOM",
    observaciones: "Original",
  });
  const url = "/api/envios?busqueda=maria&control_cambios=1";
  const primero = await (await api.get(url)).json();
  expect(primero.data).toHaveLength(1);
  const inicio = (await (await db.get("/__dev/usage")).json()).restBytes;
  for (let i = 0; i < 3; i++) {
    const sinCambios = await (
      await api.get(`${url}&revision=${primero.revision}`)
    ).json();
    expect(sinCambios).toEqual({
      sinCambios: true,
      revision: primero.revision,
    });
    expect(sinCambios).not.toHaveProperty("data");
  }
  const bytes =
    (await (await db.get("/__dev/usage")).json()).restBytes - inicio;
  expect(bytes).toBeLessThan(1000);
  console.log(
    `Envíos sin cambios: ${Math.round(bytes / 3)} bytes de Supabase por refresco, incluyendo autorización.`,
  );
  const otroFiltro = await (
    await api.get(`${url}&estados=ENVIADO&revision=${primero.revision}`)
  ).json();
  expect(otroFiltro.sinCambios).toBeUndefined();
  expect(otroFiltro.data).toHaveLength(0);
  expect(
    (
      await db.patch(`/rest/v1/envios?id=eq.${e.id}`, {
        data: { observaciones: "Editado" },
      })
    ).ok(),
  ).toBe(true);
  const editado = await (
    await api.get(`${url}&revision=${primero.revision}`)
  ).json();
  expect(editado.data[0].observaciones).toBe("Editado");
  expect((await db.delete(`/rest/v1/envios?id=eq.${e.id}`)).ok()).toBe(true);
  const borrado = await (
    await api.get(`${url}&revision=${editado.revision}`)
  ).json();
  expect(borrado.data).toHaveLength(0);
  await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, {
    data: { disabled: true },
  });
  expect((await api.get(`${url}&revision=${borrado.revision}`)).status()).toBe(
    403,
  );
  await db.dispose();
  await api.dispose();
});

test("las revisiones de ventas y productos detectan costos de ítems y stock modificado", async () => {
  const u = await createUser(),
    api = await appApi(u.token),
    db = await supabase("service");
  const p = await dbInsert<{ id: string }>("productos", {
    profile_id: u.id,
    nombre: "Producto",
    stock_actual: 4,
    precio_compra: 10.25,
    precio_venta: 25.5,
  });
  const persona = await dbInsert<{ id: string }>("personas", {
    nombre: "Cliente",
    dni: null,
    telefono: "999123456",
  });
  const v = await dbInsert<{ id: string }>("ventas", {
    profile_id: u.id,
    persona_id: persona.id,
    persona_nombre: "Cliente",
    persona_dni: null,
    total: 25.5,
    estado: "COMPLETADA",
    monto_pagado: 25.5,
  });
  const it = await dbInsert<{ id: string }>("venta_items", {
    venta_id: v.id,
    producto_id: p.id,
    producto_nombre: "Producto",
    cantidad: 1,
    precio_unitario: 25.5,
    subtotal: 25.5,
    costo_unitario: 10.25,
  });
  for (const tabla of ["ventas", "productos"]) {
    const url = `/api/${tabla}?control_cambios=1&resumen=1`;
    const antes = await (await api.get(url)).json();
    expect(
      (await (await api.get(`${url}&revision=${antes.revision}`)).json())
        .sinCambios,
    ).toBe(true);
    const update =
      tabla === "ventas"
        ? await db.patch(`/rest/v1/venta_items?id=eq.${it.id}`, {
            data: { costo_unitario: 12.75 },
          })
        : await db.patch(`/rest/v1/productos?id=eq.${p.id}`, {
            data: { stock_actual: 8 },
          });
    expect(update.ok(), await update.text()).toBe(true);
    const despues = await (
      await api.get(`${url}&revision=${antes.revision}`)
    ).json();
    expect(despues.sinCambios).toBeUndefined();
    if (tabla === "ventas") expect(despues.resumen.costo).toBe(12.75);
    else expect(despues.data[0].stock_actual).toBe(8);
  }
  await db.dispose();
  await api.dispose();
});

test("buscar Envíos conserva tildes, palabras, relevancia, fallback, filtros y aislamiento", async () => {
  const u = await createUser(),
    otro = await createUser(),
    api = await appApi(u.token);
  const db = await supabase("service");
  const nombres = [
    "María López",
    "Maria López Azul",
    "Ana María López",
    "Mariano Lopéz",
    "Rosa Pérez",
    "Carmen",
    "Ana Marina",
    "Ñandú",
    "Nandu",
    "MARIA LOPEZ",
    "Jose  María",
    "Jose María",
  ];
  const seed = await db.post("/rest/v1/envios", {
    data: nombres.map((nombre, i) => ({
      user_id: u.id,
      nombre,
      dni: `123456${String(i).padStart(2, "0")}`,
      telefono: "999123456",
      estado: i % 2 ? "EMPACADO" : "NO_EMPACADO",
      metodo: i % 3 ? "SHALOM" : "MOTORIZADO",
      fecha_registro: new Date(Date.UTC(2026, 10, 18, 4, i)).toISOString(),
    })),
  });
  expect(seed.status(), await seed.text()).toBe(201);
  const filas = (await seed.json()).sort(
    (a: { fecha_registro: string }, b: { fecha_registro: string }) =>
      b.fecha_registro.localeCompare(a.fecha_registro),
  );
  await dbInsert("envios", {
    user_id: otro.id,
    nombre: "María López",
    telefono: "999123456",
  });
  for (const termino of [
    "maria lopez",
    "LOPEZ MARÍA",
    "ari",
    "123456",
    "carmen",
    "sin coincidencia",
    "ñandu",
    "jose maria",
    "999123456",
  ]) {
    const esperados = buscar(
      filas,
      termino,
      (e: Record<string, string>) => [e.nombre, e.dni, e.telefono],
      (e: Record<string, string>) => e.nombre,
    );
    for (const offset of [0, 2]) {
      const r = await api.get(
        `/api/envios?${new URLSearchParams({ busqueda: termino, limit: "2", offset: String(offset), user_id: otro.id })}`,
      );
      expect(r.status(), await r.text()).toBe(200);
      const j = await r.json();
      expect(j.total).toBe(esperados.length);
      expect(j.data.map((e: { id: string }) => e.id)).toEqual(
        esperados.slice(offset, offset + 2).map((e: { id: string }) => e.id),
      );
    }
  }
  const r = await api.get(
    "/api/envios?busqueda=maria&estados=EMPACADO&metodos=SHALOM&fecha_desde=2026-11-17",
  );
  const filtradas = filas.filter(
    (e: { estado: string; metodo: string }) =>
      e.estado === "EMPACADO" && e.metodo === "SHALOM",
  );
  expect((await r.json()).data.map((e: { id: string }) => e.id)).toEqual(
    buscar(
      filtradas,
      "maria",
      (e: Record<string, string>) => [e.nombre, e.dni, e.telefono],
      (e: Record<string, string>) => e.nombre,
    ).map((e: { id: string }) => e.id),
  );
  expect(
    (
      await (
        await api.get("/api/envios?busqueda=maria&fecha_desde=2026-11-18")
      ).json()
    ).total,
  ).toBe(0);
  for (const role of ["anon", { token: u.token }] as const) {
    const externo = await supabase(role);
    const res = await externo.post("/rest/v1/rpc/tori_resumen_ventas", {
      data: { p_owner: otro.id },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await externo.dispose();
  }
  await db.dispose();
  await api.dispose();
});

test("una búsqueda repetida con 900 pedidos transfiere solo la página y reduce más de 95% los bytes", async () => {
  const u = await createUser(),
    api = await appApi(u.token),
    db = await supabase("service");
  const seed = await db.post("/rest/v1/envios", {
    data: Array.from({ length: 900 }, (_, i) => ({
      user_id: u.id,
      nombre: `María López ${i}`,
      dni: String(10000000 + i),
      telefono: "999123456",
      metodo: "SHALOM",
      direccion: "Dirección de entrega ".repeat(20),
      observaciones: "Observación ".repeat(20),
    })),
    headers: { Prefer: "return=minimal" },
  });
  expect(seed.ok(), await seed.text()).toBe(true);
  const anterior = await db.get(
    `/rest/v1/envios?select=*&user_id=eq.${u.id}&limit=10000`,
  );
  const bytesAntes = Buffer.byteLength(await anterior.body());
  const inicio = (await (await db.get("/__dev/usage")).json()).restBytes;
  for (let i = 0; i < 3; i++) {
    const r = await api.get("/api/envios?busqueda=maria&limit=5");
    expect(r.status(), await r.text()).toBe(200);
    const j = await r.json();
    expect(j.total).toBe(900);
    expect(j.data).toHaveLength(5);
  }
  const bytesDespues =
    (await (await db.get("/__dev/usage")).json()).restBytes - inicio;
  expect(bytesDespues).toBeLessThan(bytesAntes * 3 * 0.05);
  console.log(
    `Envíos: ${bytesAntes} bytes antes por búsqueda; ${Math.round(bytesDespues / 3)} bytes después (incluye autorización).`,
  );
  await db.dispose();
  await api.dispose();
});

test("el resumen agregado conserva decimales, anulaciones, abonos y costos sin descargar el historial", async () => {
  const u = await createUser(),
    otro = await createUser(),
    api = await appApi(u.token),
    db = await supabase("service");
  const persona = await dbInsert<{ id: string }>("personas", {
    nombre: "Cliente resumen",
    dni: null,
    telefono: "999123456",
  });
  const seed = await db.post("/rest/v1/ventas", {
    data: Array.from({ length: 300 }, (_, i) => ({
      profile_id: u.id,
      persona_id: persona.id,
      persona_nombre: "Cliente resumen",
      persona_dni: null,
      total: 25.5,
      monto_pagado: i % 3 === 0 ? 30 : i % 3 === 1 ? 10.25 : 0,
      estado:
        i % 4 === 0 ? "ANULADA" : i % 3 === 0 ? "COMPLETADA" : "PENDIENTE",
    })),
  });
  expect(seed.status(), await seed.text()).toBe(201);
  const ventas = await seed.json();
  const items = await db.post("/rest/v1/venta_items", {
    data: ventas
      .filter((_: unknown, i: number) => i % 5 !== 0)
      .map((v: { id: string }) => ({
        venta_id: v.id,
        producto_nombre: "Producto",
        cantidad: 2,
        precio_unitario: 12.75,
        subtotal: 25.5,
        costo_unitario: 7.15,
      })),
    headers: { Prefer: "return=minimal" },
  });
  expect(items.ok(), await items.text()).toBe(true);
  await dbInsert("ventas", {
    profile_id: otro.id,
    persona_id: persona.id,
    persona_nombre: "Otro",
    persona_dni: null,
    total: 99999,
    estado: "COMPLETADA",
  });
  const previo = await db.get(
    `/rest/v1/ventas?select=total,monto_pagado,estado,items:venta_items(cantidad,costo_unitario)&profile_id=eq.${u.id}`,
  );
  const esperado = calcularResumenVentas(await previo.json());
  const bytesAntes = (await previo.body()).byteLength;
  const inicio = (await (await db.get("/__dev/usage")).json()).restBytes;
  const r = await api.get(`/api/ventas?resumen=1&limit=1&user_id=${otro.id}`);
  expect(r.status(), await r.text()).toBe(200);
  expect((await r.json()).resumen).toEqual(esperado);
  const bytesDespues =
    (await (await db.get("/__dev/usage")).json()).restBytes - inicio;
  expect(bytesDespues).toBeLessThan(bytesAntes * 0.1);
  console.log(
    `Ventas: resumen anterior ${bytesAntes} bytes; página + agregado + autorización ${bytesDespues} bytes.`,
  );
  await db.dispose();
  await api.dispose();
});

test("Gastos devuelve el total completo con una página, incluso con más de 200 registros", async () => {
  const u = await createUser(),
    api = await appApi(u.token),
    db = await supabase("service");
  const r = await db.post("/rest/v1/gastos", {
    data: Array.from({ length: 300 }, (_, i) => ({
      profile_id: u.id,
      concepto: `Gasto ${i}`,
      monto: 1.25,
      categoria: i % 2 ? "OTROS" : "PASAJES",
      fecha: "2026-11-18",
    })),
    headers: { Prefer: "return=minimal" },
  });
  expect(r.ok(), await r.text()).toBe(true);
  const j = await (await api.get("/api/gastos?resumen=1&limit=20")).json();
  expect(j.data).toHaveLength(20);
  expect(j.montoTotal).toBe(375);
  expect(
    (await (await api.get("/api/gastos?resumen=1&categoria=PASAJES")).json())
      .montoTotal,
  ).toBe(187.5);
  await db.dispose();
  await api.dispose();
});

test("Productos busca en la base y mantiene precios, SKU y campos de compra", async () => {
  const u = await createUser(),
    api = await appApi(u.token),
    db = await supabase("service");
  const seed = await db.post("/rest/v1/productos", {
    data: Array.from({ length: 100 }, (_, i) => ({
      profile_id: u.id,
      nombre: `Poló Verde ${i}`,
      sku: `VERDE-${i}`,
      descripcion: "Algodón",
      precio_venta: 25.5,
      precio_compra: 10.25,
      stock_actual: 3,
      unidad: "par",
      imagen_url: `https://example.test/${"foto".repeat(100)}/${i}.webp`,
    })),
  });
  expect(seed.status(), await seed.text()).toBe(201);
  const filas = await seed.json();
  const esperados = buscar(
    filas,
    "polo verde",
    (p: Record<string, string>) => [p.nombre, p.sku, p.descripcion],
    (p: Record<string, string>) => p.nombre,
  );
  const r = await api.get(
    "/api/productos?busqueda=polo%20verde&limit=3&offset=2",
  );
  expect(r.status(), await r.text()).toBe(200);
  const j = await r.json();
  expect(j.total).toBe(100);
  expect(j.data.map((p: { id: string }) => p.id)).toEqual(
    esperados.slice(2, 5).map((p: { id: string }) => p.id),
  );
  expect(j.data[0]).toMatchObject({
    precio_venta: 25.5,
    precio_compra: 10.25,
    stock_actual: 3,
  });
  const compra = await (
    await api.get("/api/productos?selector=compra&limit=1")
  ).json();
  expect(compra.data[0]).toMatchObject({ precio_compra: 10.25, unidad: "par" });
  expect(compra.data[0]).not.toHaveProperty("imagen_url");
  await db.dispose();
  await api.dispose();
});

test("una actualización lenta de Envíos no acumula consultas periódicas simultáneas", async ({
  page,
}) => {
  const u = await createUser();
  await page.clock.install();
  await abrirDashboard(page, u, "envios");
  await expect(
    page.getByPlaceholder("Buscar por nombre, DNI o teléfono..."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No hay envíos todavía" }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  let consultas = 0;
  let liberar!: () => void;
  const pendiente = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  await page.route("**/api/envios?**", async (route) => {
    consultas++;
    await pendiente;
    await route.continue();
  });
  await page.clock.fastForward(31000);
  await expect.poll(() => consultas).toBe(1);
  await page.clock.fastForward(90000);
  expect(consultas).toBe(1);
  const respuesta = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/envios",
  );
  liberar();
  await respuesta;
});
