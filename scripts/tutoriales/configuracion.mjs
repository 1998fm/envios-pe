// Graba las pantallas reales en el stack LOCAL; nunca usa cuentas ni datos reales.
// APP_PORT=3100 LOCAL_DB_PORT=54322 node scripts/tutoriales/configuracion.mjs
// Requiere dev:local iniciado, Chromium y FFmpeg de Playwright + del sistema.
// TUTORIAL_OUTPUT permite elegir dónde se guarda el video.
import { chromium, request } from "playwright";
import { localKeys } from "../local-db/keys.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";

const base = `http://localhost:${process.env.APP_PORT || 3100}`;
const salida =
  process.env.TUTORIAL_OUTPUT || path.join(tmpdir(), "tori-configuracion");
const k = await localKeys();
if (!["localhost", "127.0.0.1"].includes(new URL(k.url).hostname))
  throw Error("Solo se permite el stack local");
await mkdir(salida, { recursive: true });
const admin = await request.newContext({
  baseURL: k.url,
  extraHTTPHeaders: {
    apikey: k.anonKey,
    Authorization: `Bearer ${k.serviceKey}`,
    Prefer: "return=representation",
  },
});
const email = `tutorial-${Date.now()}@tori.local`,
  password = "TutorialLocal123!";
let r = await admin.post("/auth/v1/admin/users", {
  data: { email, password, email_confirm: true },
});
if (!r.ok()) throw Error(`Usuario local: ${r.status()}`);
const id = (await r.json()).id;
const perfilesDemo = [id];
r = await admin.post("/rest/v1/profiles", {
  data: {
    id,
    empresa: "Mi tienda",
    slug: `tutorial-${Date.now()}`,
    plan: "business_plus",
    metodo_motorizado: true,
    metodo_shalom: false,
    logistica_moto_dias: ["MONDAY"],
    trial_end: new Date(Date.now() + 86400000).toISOString(),
  },
});
if (!r.ok()) throw Error(`Perfil local: ${r.status()}`);
await admin.dispose();
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
});
try {
  const ipDemo = `10.77.${Math.floor(Math.random() * 240)}.${Math.floor(Math.random() * 240)}`;
  const auth = await browser.newContext({
    baseURL: base,
    extraHTTPHeaders: { "x-forwarded-for": ipDemo },
  });
  r = await auth.request.post("/api/auth/login", { data: { email, password } });
  if (!r.ok()) throw Error(`Sesión local: ${r.status()}`);
  const state = await auth.storageState();
  await auth.close();
  const ctx = await browser.newContext({
    baseURL: base,
    viewport: { width: 1280, height: 800 },
    storageState: state,
    extraHTTPHeaders: { "x-forwarded-for": ipDemo },
    recordVideo: { dir: salida, size: { width: 1280, height: 800 } },
  });
  await ctx.addInitScript(() => {
    localStorage.setItem("tori_trayecto_done", "true");
    localStorage.setItem("tori_tour_modal-configuracion_done", "true");
    for (const id of ["resumen", "envios", "productos"])
      localStorage.setItem(`tori_tour_tab-${id}_done`, "true");
  });
  const page = await ctx.newPage(),
    video = page.video(),
    started = Date.now();
  await page.goto("/dashboard?v=envios");
  await page.getByTitle("Abrir menú", { exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  async function decorar() {
    await page.addStyleTag({
      content: `nextjs-portal{display:none!important}#tutorial-cursor{position:fixed;z-index:2147483647;width:30px;height:38px;pointer-events:none;left:1160px;top:700px;transition:left .5s ease,top .5s ease;filter:drop-shadow(0 2px 3px #001b3d60)}#tutorial-highlight{position:fixed;z-index:2147483646;border:3px solid #f6b800;border-radius:10px;pointer-events:none;box-shadow:0 0 0 4px #f6b80025;transition:opacity .2s;display:none}#tutorial-cover{position:fixed;inset:0;z-index:2147483647;background:linear-gradient(135deg,#075b8d,#1397df);display:flex;align-items:center;justify-content:center;color:white;font-family:Arial,sans-serif;text-align:center;padding:60px}#tutorial-cover h1{font-size:54px;line-height:1.15;max-width:1000px;margin:18px auto}#tutorial-cover p{font-size:27px;line-height:1.5;color:#e2f5ff}#tutorial-cover small{font-size:19px;font-weight:800;letter-spacing:3px}`,
    });
    await page.evaluate(() => {
      const cursor = document.createElement("div");
      cursor.id = "tutorial-cursor";
      cursor.innerHTML =
        '<svg viewBox="0 0 30 38"><path d="M3 2 L3 30 L10 23 L16 35 L23 31 L17 20 L28 20 Z" fill="#087bb8" stroke="white" stroke-width="2.5" stroke-linejoin="round"/></svg>';
      document.body.append(cursor);
      const h = document.createElement("div");
      h.id = "tutorial-highlight";
      document.body.append(h);
    });
  }
  await decorar();
  const lead = (Date.now() - started) / 1000,
    epoch = Date.now(),
    marks = [];
  const pause = (ms) =>
    page.waitForTimeout(process.env.TUTORIAL_FAST ? Math.min(ms, 80) : ms);
  function step(title, detail) {
    marks.push({ start: (Date.now() - epoch) / 1000, title, detail });
    console.log(title);
  }
  async function cover(title, detail) {
    await page.evaluate(
      ({ title, detail }) => {
        document.querySelector("#tutorial-cover")?.remove();
        const c = document.createElement("div");
        c.id = "tutorial-cover";
        c.innerHTML = `<div><small>TORI · GUÍA VISUAL</small><h1>${title}</h1><p>${detail}</p></div>`;
        document.body.append(c);
      },
      { title, detail },
    );
  }
  async function point(loc) {
    await loc.scrollIntoViewIfNeeded();
    await pause(280);
    const b = await loc.boundingBox();
    if (!b) throw Error("Control no visible");
    await page.evaluate((b) => {
      const c = document.querySelector("#tutorial-cursor");
      c.style.left = `${b.x + b.width * 0.65}px`;
      c.style.top = `${b.y + b.height * 0.55}px`;
      const h = document.querySelector("#tutorial-highlight");
      h.style.display = "block";
      Object.assign(h.style, {
        left: `${b.x - 4}px`,
        top: `${b.y - 4}px`,
        width: `${b.width + 8}px`,
        height: `${b.height + 8}px`,
      });
    }, b);
    await pause(650);
  }
  async function click(loc) {
    await point(loc);
    await pause(350);
    await loc.click();
    await page.evaluate(
      () =>
        (document.querySelector("#tutorial-highlight").style.display = "none"),
    );
    await pause(500);
  }
  async function type(loc, value) {
    await point(loc);
    await loc.fill("");
    if (
      (await loc.getAttribute("type")) === "number" ||
      (await loc.getAttribute("inputmode")) === "numeric"
    )
      await loc.fill(value);
    else
      await loc.pressSequentially(value, {
        delay: process.env.TUTORIAL_FAST ? 0 : 65,
      });
    await pause(450);
  }
  async function explicar(titulo, filas, nota = "", tiempo = 6500) {
    const texto = valor => valor.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    marks.at(-1).explicacion = { titulo, filas: filas.map(texto), nota };
    await page.evaluate(
      ({ titulo, filas, nota }) => {
        document.querySelector("#tutorial-cover")?.remove();
        const c = document.createElement("div");
        c.id = "tutorial-cover";
        c.innerHTML = `<div style="width:100%;max-width:1120px"><small>TORI · EXPLICACIÓN PASO A PASO</small><h1 style="font-size:44px">${titulo}</h1><div style="display:grid;grid-template-columns:${filas.length === 2 ? "1fr 1fr" : "1fr"};gap:16px">${filas.map((f) => `<div style="background:white;color:#183b56;border-radius:22px;padding:24px;font-size:27px;line-height:1.45;text-align:left">${f}</div>`).join("")}</div><p style="font-size:21px;margin-bottom:0">${nota}</p></div>`;
        document.body.append(c);
      },
      { titulo, filas, nota },
    );
    const palabras = (titulo + " " + filas.join(" ") + " " + nota)
      .replace(/<[^>]*>/g, " ")
      .split(/\s+/).length;
    await pause(Math.max(tiempo, palabras * 320));
    await page.evaluate(() =>
      document.querySelector("#tutorial-cover").remove(),
    );
  }
  async function abrirConfig() {
    await point(page.getByTitle("Abrir menú", { exact: true }));
    await page.getByTitle("Abrir menú", { exact: true }).hover();
    await pause(400);
    await click(page.locator('[data-tour="configuracion"]'));
  }
  async function guardar() {
    const solicitud = page.waitForResponse(
      (r) =>
        r.url().includes("/api/configuracion") &&
        r.request().method() === "POST",
    );
    await click(page.getByRole("button", { name: "Guardar", exact: true }));
    const r = await solicitud;
    if (!r.ok()) throw Error(await r.text());
    await page.getByText("Configuración guardada", { exact: true }).waitFor();
    await pause(900);
    return (await ctx.request.get("/api/session")).json();
  }
  step(
    "INICIO · Configuración con ejemplos",
    "Primero los datos básicos. Después, Logística y Tarifas, opción por opción.",
  );
  await cover(
    "Logística y Tarifas.<br>Entiende cada opción.",
    "Demostración con Plan Plus y datos de ejemplo.<br>Puedes pausar o ir directamente a un capítulo.",
  );
  await pause(4500);
  await page.evaluate(() => document.querySelector("#tutorial-cover").remove());
  await abrirConfig();
  step(
    "Empresa y métodos de envío",
    "Completa tus datos. Si usas Shalom, selecciona una agencia de origen válida.",
  );
  await type(
    page.getByPlaceholder("Nombre del negocio", { exact: true }),
    "Mi tienda didáctica",
  );
  await type(page.getByPlaceholder("Teléfono", { exact: true }), "999888777");
  await type(
    page.getByPlaceholder("Buscar agencia Shalom", { exact: true }),
    "LIMA / LIMA / LA VICTORIA",
  );
  await click(
    page.getByRole("button", { name: /LIMA \/ LIMA \/ LA VICTORIA/ }).first(),
  );
  await click(page.getByRole("button", { name: "Métodos", exact: true }));
  await click(page.getByRole("checkbox", { name: /Shalom Envíos nacionales/ }));
  await pause(1500);

  step(
    "LOGÍSTICA · Para qué sirve",
    "Estas reglas ayudan a calcular las fechas disponibles para tus pedidos.",
  );
  await click(page.getByRole("button", { name: "Logística", exact: true }));
  await explicar(
    "Logística = cuándo atiendes",
    [
      "<b>Motorizado</b><br>Organiza tus fechas de reparto local.",
      "<b>Agencias</b><br>Organiza tus días de despacho por Shalom, Olva y otros métodos de agencia.",
    ],
    "Los días de una agencia no indican cuánto demora el transporte hasta el destino.",
    7500,
  );
  const moto = page
    .getByRole("heading", { name: "Motorizado", exact: true })
    .locator("../..");
  step(
    "Días de atención",
    "Marca únicamente los días en que realmente repartes. Ejemplo: lunes a viernes.",
  );
  for (const dia of ["M", "X", "J", "V"])
    await click(moto.getByRole("button", { name: dia, exact: true }));
  await explicar(
    "Tus días de atención",
    [
      "<b>L · M · X · J · V · S · D</b><br>Lunes, martes, miércoles, jueves, viernes, sábado y domingo.",
      "<b>Ejemplo: lunes a viernes</b><br>Si una fecha cae en sábado o domingo, se busca el próximo día que atiendes.",
    ],
    "No marques un día si no puedes hacer entregas ese día.",
    7500,
  );
  step(
    "Anticipación mínima",
    "Es el tiempo de preparación que necesitas antes de atender un pedido.",
  );
  await type(moto.locator('input[inputmode="numeric"]').first(), "2");
  await explicar(
    "Anticipación de 2 días",
    [
      "<b>Ejemplo: recibes el lunes</b><br>Con 2 días de anticipación, la fecha base es el miércoles.",
      "<b>Si la fecha cae en un día que no atiendes</b><br>Se mueve al siguiente día de atención.",
    ],
    "Este ejemplo supone atención de lunes a viernes, antes del corte y con cupo disponible.",
    7500,
  );
  step(
    "Aplicar solo a días hábiles",
    "Aquí, hábiles significa los días de atención que tú marcaste.",
  );
  await click(
    moto.getByRole("checkbox", { name: /Aplicar solo a días hábiles/ }),
  );
  await explicar(
    "Viernes + 2 días: ¿lunes o martes?",
    [
      "<b>Sin marcar la casilla</b><br>Suma 2 días de calendario: llega al domingo y se ajusta al lunes.",
      "<b>Con la casilla marcada</b><br>Cuenta solo atención de lunes a viernes: lunes = día 1; martes = día 2.",
    ],
    "Resultado: lunes sin la casilla; martes con la casilla. Supone pedido antes del corte y cupo libre.",
    10000,
  );
  // Volvemos al conteo de calendario para explicar la hora de corte sin mezclar reglas.
  await click(
    moto.getByRole("checkbox", { name: /Aplicar solo a días hábiles/ }),
  );
  step(
    "Hora de corte",
    "Actívala si necesitas cerrar la recepción operativa a una hora determinada.",
  );
  await click(moto.getByRole("checkbox", { name: /Tengo hora de corte/ }));
  await point(moto.locator('input[type="time"]'));
  await moto.locator('input[type="time"]').fill("18:00");
  await pause(1400);
  await explicar(
    "Corte a las 18:00: se suma un día",
    [
      "<b>Lunes a las 17:00</b><br>Anticipación 2 días → miércoles.",
      "<b>Lunes desde las 18:00</b><br>Anticipación 2 + 1 día por el corte → jueves.",
    ],
    "Hora de Perú. Atención de lunes a viernes, conteo de calendario y cupo libre. No significa cerrar el formulario.",
    10000,
  );
  step(
    "Limitar envíos por día",
    "Activa esta opción solo si tienes un máximo de pedidos que puedes atender por fecha.",
  );
  await click(moto.getByRole("checkbox", { name: /Limitar envíos por día/ }));
  await type(moto.locator('input[inputmode="numeric"]').nth(1), "5");
  await explicar(
    "Ejemplo: cupo máximo de 5",
    [
      "<b>Miércoles con 5 pedidos programados</b><br>La fecha ya alcanzó el cupo de este ejemplo.",
      "<b>El siguiente pedido</b><br>Se busca el próximo día de atención con disponibilidad: jueves, si está libre.",
    ],
    "Usa un cupo mayor que cero. Si no quieres limitar, deja la casilla desactivada.",
    8500,
  );
  step(
    "Mostrar Escoger día de entrega",
    "Decide si el cliente puede elegir su fecha o si se asigna automáticamente.",
  );
  await point(
    moto.getByRole("checkbox", { name: /Mostrar.*Escoger día de entrega/ }),
  );
  await explicar(
    "¿Quién elige la fecha?",
    [
      "<b>Activado</b><br>El cliente puede elegir entre las fechas que ofrece el formulario.",
      "<b>Desactivado</b><br>El sistema asigna la fecha más cercana según las reglas configuradas.",
    ],
    "Revisa siempre el resultado en tu formulario público.",
    7500,
  );
  step(
    "Agencias: configura tus días de despacho",
    "Configura este bloque por separado si trabajas con Shalom, Olva u otra agencia.",
  );
  const agencias = page
    .getByRole("heading", { name: "Agencias", exact: true })
    .locator("../..");
  await point(agencias.getByText("¿Qué días atiendes?", { exact: true }));
  await pause(2500);
  await explicar(
    "Agencias no es tiempo de transporte",
    [
      "<b>Ejemplo: despachas martes y jueves</b><br>Marca esos días en Agencias y ajusta su anticipación y corte.",
      "<b>La llegada al destino</b><br>Depende de la empresa de transporte. Estos controles no configuran su tiempo de traslado.",
    ],
    "Los bloques de Motorizado y Agencias permiten configurar calendarios diferentes.",
    8500,
  );
  await guardar();

  step(
    "TARIFAS · Para qué sirven",
    "Las tarifas de esta pantalla son para el reparto motorizado por distrito.",
  );
  await abrirConfig();
  await click(page.getByRole("button", { name: "Tarifas", exact: true }));
  await explicar(
    "Tarifas = cobertura y precio de motorizado",
    [
      "<b>Cobertura</b><br>Define en qué distritos haces entregas.",
      "<b>Precio</b><br>Es el importe que se mostrará al cliente para el distrito. No configura el flete de Shalom u otras agencias.",
    ],
    "Escoge Lima o Provincia según la zona donde haces tu reparto local.",
    8500,
  );
  step(
    "Lima: precio único para todos",
    "Úsalo solo si cobras el mismo importe en todos los distritos activos.",
  );
  await point(page.getByRole("button", { name: "Lima", exact: true }));
  await type(page.getByPlaceholder("S/ 10.00", { exact: true }), "8.00");
  await click(
    page.getByRole("button", { name: "Aplicar a todos", exact: true }),
  );
  await pause(2300);
  await explicar(
    "Aplicar a todos reemplaza los precios",
    [
      "<b>Ejemplo: S/ 8.00</b><br>Coloca S/ 8.00 en todos los distritos que siguen activos.",
      "<b>Si cobras distinto por zona</b><br>Edita cada distrito después. No vuelvas a aplicar un precio único si quieres conservar esas diferencias.",
    ],
    "El precio único no restaura los distritos que ya eliminaste.",
    8500,
  );
  step(
    "Lima: editar una tarifa individual",
    "Busca el distrito y cambia solo su precio. Ejemplo: Miraflores, S/ 8.50.",
  );
  await type(
    page.getByPlaceholder("Buscar distrito...", { exact: true }),
    "Miraflores",
  );
  await type(
    page
      .getByText("MIRAFLORES", { exact: true })
      .locator("..")
      .getByRole("spinbutton"),
    "8.50",
  );
  await pause(2800);
  step(
    "Quitar un distrito sin cobertura",
    "No basta con borrar el precio: usa la papelera del distrito donde no entregas.",
  );
  await type(
    page.getByPlaceholder("Buscar distrito...", { exact: true }),
    "Lince",
  );
  await click(
    page.getByRole("button", { name: "Eliminar LINCE", exact: true }),
  );
  await explicar(
    "Eliminar no es dejar el precio vacío",
    [
      "<b>Si no atiendes Lince</b><br>La papelera lo retira de tu cobertura. Guarda para aplicar el cambio.",
      "<b>Si solo borras el precio</b><br>No estás eliminando el distrito. Todavía puede seguir apareciendo como una zona atendida.",
    ],
    "Después de guardar, el cliente no debe poder elegir un distrito eliminado.",
    9000,
  );
  let s = await guardar();
  if (Number(s.tarifas.MIRAFLORES) !== 8.5 || String(s.tarifas.LINCE) !== "-1")
    throw Error("No se verificó la exclusión de Lima");
  step(
    "Restaurar un distrito de Lima",
    "Si vuelves a atenderlo, selecciónalo en Restaurar distrito eliminado.",
  );
  await abrirConfig();
  await click(page.getByRole("button", { name: "Tarifas", exact: true }));
  await point(page.getByLabel("Restaurar distrito eliminado", { exact: true }));
  await page
    .getByLabel("Restaurar distrito eliminado", { exact: true })
    .selectOption("LINCE");
  await page.evaluate(
    () =>
      (document.querySelector("#tutorial-highlight").style.display = "none"),
  );
  await pause(1200);
  await type(
    page.getByPlaceholder("Buscar distrito...", { exact: true }),
    "Lince",
  );
  await type(
    page
      .getByText("LINCE", { exact: true })
      .locator("..")
      .getByRole("spinbutton"),
    "8.00",
  );
  await explicar(
    "Restaurar también requiere revisar el precio",
    [
      "<b>1. Restaura el distrito</b><br>Vuelve a quedar dentro de tu cobertura.",
      "<b>2. Asigna su tarifa y guarda</b><br>Ejemplo: Lince, S/ 8.00. No des por hecho que conserva el precio anterior.",
    ],
    "Guarda los cambios y vuelve a comprobar tu formulario.",
    8500,
  );
  s = await guardar();
  if (
    Number(s.tarifas.LINCE) !== 8 ||
    s.profile.logistica_moto_anticipacion !== 2 ||
    s.profile.logistica_moto_cupo !== 5 ||
    String(s.profile.logistica_moto_hora_corte).slice(0, 5) !== "18:00"
  )
    throw Error("No se verificó la restauración o la logística");

  step(
    "PROVINCIA · Ejemplo independiente",
    "Ahora veremos otra tienda, que empieza con sus tarifas vacías en Provincia.",
  );
  await explicar(
    "Provincia: agrega tus propios distritos",
    [
      "<b>Este es otro ejemplo, desde cero</b><br>Una tienda distinta configurará Cajamarca y Baños del Inca.",
      "<b>Si cambias de Lima a Provincia en tu tienda</b><br>Revisa la lista existente. Cambiar la región no elimina automáticamente tus tarifas guardadas.",
    ],
    "En Provincia no se carga una lista oficial para tu reparto: tú defines las zonas.",
    10000,
  );
  const emailProvincia = `tutorial-provincia-${Date.now()}@tori.local`;
  const headers = {
    apikey: k.anonKey,
    Authorization: `Bearer ${k.serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  let req = await fetch(`${k.url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: emailProvincia,
      password,
      email_confirm: true,
    }),
  });
  if (!req.ok) throw Error("No se creó el ejemplo local de Provincia");
  const provinciaId = (await req.json()).id;
  perfilesDemo.push(provinciaId);
  req = await fetch(`${k.url}/rest/v1/profiles`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: provinciaId,
      empresa: "Mi tienda de provincia",
      slug: `provincia-${Date.now()}`,
      plan: "business_plus",
      trial_end: new Date(Date.now() + 86400000).toISOString(),
      metodo_motorizado: true,
      logistica_moto_dias: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
      ],
    }),
  });
  if (!req.ok) throw Error("No se creó la configuración de Provincia");
  req = await ctx.request.post("/api/auth/login", {
    data: { email: emailProvincia, password },
  });
  if (!req.ok()) throw Error("No se inició la sesión local de Provincia");
  await page.goto("/dashboard?v=envios");
  await page.getByTitle("Abrir menú", { exact: true }).waitFor();
  await decorar();
  await abrirConfig();
  await click(page.getByRole("button", { name: "Tarifas", exact: true }));
  await click(page.getByRole("button", { name: "Provincia", exact: true }));
  step(
    "Provincia: agregar el primer distrito",
    "Escribe el nombre y su precio. Después pulsa Agregar para incluirlo en la lista.",
  );
  await type(
    page.getByPlaceholder("Nombre del distrito (ej: Cajamarca, El Porvenir)", {
      exact: true,
    }),
    "Cajamarca",
  );
  await type(page.getByPlaceholder("Precio", { exact: true }), "6.00");
  await click(page.getByRole("button", { name: "Agregar", exact: true }));
  await pause(2200);
  step(
    "Provincia: agrega todas las zonas donde entregas",
    "Repite el proceso para cada distrito. Ejemplo: Baños del Inca, S/ 7.50.",
  );
  await type(
    page.getByPlaceholder("Nombre del distrito (ej: Cajamarca, El Porvenir)", {
      exact: true,
    }),
    "Baños del Inca",
  );
  await type(page.getByPlaceholder("Precio", { exact: true }), "7.50");
  await click(page.getByRole("button", { name: "Agregar", exact: true }));
  await pause(2200);
  await explicar(
    "En Provincia, solo se ofrecen tus distritos",
    [
      "<b>Agregar</b><br>Incluye un distrito y una tarifa. Revisa que ambos aparezcan en la lista.",
      "<b>Editar o eliminar</b><br>Cambia el importe en su fila o usa la papelera si dejas de atenderlo.",
    ],
    "Agregar una fila no guarda toda la configuración: al terminar debes pulsar Guardar.",
    9500,
  );
  step(
    "Provincia: editar y retirar una zona",
    "Puedes corregir el precio o quitar un distrito que ya no atiendes.",
  );
  await type(
    page
      .getByText("Cajamarca", { exact: true })
      .locator("..")
      .getByRole("spinbutton"),
    "6.50",
  );
  await click(
    page
      .getByText("Baños del Inca", { exact: true })
      .locator("..")
      .getByTitle("Eliminar distrito", { exact: true }),
  );
  await pause(2000);
  step(
    "Guardar y revisar el formulario",
    "Guarda al terminar. Luego revisa el resultado que verá tu cliente.",
  );
  s = await guardar();
  if (
    s.profile.moto_region !== "provincia" ||
    Number(s.tarifas.Cajamarca) !== 6.5 ||
    Object.keys(s.tarifas).length !== 1
  )
    throw Error("No se verificó el ejemplo de Provincia");
  step(
    "Lista final de comprobación",
    "Días, anticipación, corte, cupo, región, cobertura, precios y Guardar.",
  );
  await explicar(
    "Antes de compartir tu formulario",
    [
      "<b>Logística</b><br>¿Los días y las reglas coinciden con tu operación real?",
      "<b>Tarifas</b><br>¿Solo atiendes los distritos de la lista y sus precios están completos?",
    ],
    "Guarda y abre tu formulario público para comprobarlo. Las opciones disponibles dependen de tu plan.",
    10000,
  );
  await cover(
    "Ahora sí:<br>fechas y tarifas claras.",
    "Puedes repetir un capítulo cuando lo necesites.",
  );
  await pause(4500);
  const duration = (Date.now() - epoch) / 1000;
  await ctx.close();
  await browser.close();
  const source = await video.path();
  await writeFile(
    path.join(salida, "timeline.json"),
    JSON.stringify({ lead, duration, marks }, null, 2),
  );
  function time(t) {
    const cent = Math.round(t * 100),
      h = Math.floor(cent / 360000),
      m = Math.floor(cent / 6000) % 60,
      s = Math.floor(cent / 100) % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cent % 100).padStart(2, "0")}`;
  }
  function clean(t) {
    return t.replace(/[{}]/g, "").replace(/\n/g, "\\N");
  }
  let ass = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 960\nWrapStyle: 0\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Title,DejaVu Sans,29,&H0037200F,&H0037200F,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,1,0,0,7,36,36,15,1\nStyle: Detail,DejaVu Sans,23,&H0065472D,&H0065472D,&H00FFFFFF,&H00FFFFFF,0,0,0,0,100,100,0,0,1,0,0,2,32,32,18,1\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n`;
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i],
      end = marks[i + 1]?.start ?? duration;
    ass += `Dialogue: 0,${time(m.start)},${time(end)},Title,,0,0,0,,{\\pos(36,25)\\fad(120,80)}${clean(m.title)}\nDialogue: 0,${time(m.start)},${time(end)},Detail,,0,0,0,,{\\pos(640,938)\\fad(120,80)}${clean(m.detail)}\n`;
  }
  await writeFile(path.join(salida, "instrucciones.ass"), ass);
  if (!process.env.TUTORIAL_FAST) {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-ss",
        String(lead),
        "-i",
        source,
        "-t",
        String(duration),
        "-vf",
        `pad=1280:960:0:88:color=0xf5f9ff,ass=${path.join(salida, "instrucciones.ass")}`,
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "21",
        "-pix_fmt",
        "yuv420p",
        "-an",
        "-movflags",
        "+faststart",
        path.join(salida, "configuracion.mp4"),
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-ss",
        "1",
        "-i",
        path.join(salida, "configuracion.mp4"),
        "-frames:v",
        "1",
        "-q:v",
        "3",
        path.join(salida, "portada.jpg"),
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
  }
  console.log(
    `${process.env.TUTORIAL_FAST ? "Ensayo verificado" : "Tutorial generado"}: ${duration.toFixed(1)} s. Configuración guardada y verificada en la base local.`,
  );
} finally {
  await browser.close();
  for (const demoId of perfilesDemo)
    await fetch(`${k.url}/rest/v1/profiles?id=eq.${demoId}`, {
      method: "DELETE",
      headers: { apikey: k.anonKey, Authorization: `Bearer ${k.serviceKey}` },
    });
}
