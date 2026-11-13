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
  const auth = await browser.newContext({ baseURL: base });
  r = await auth.request.post("/api/auth/login", { data: { email, password } });
  if (!r.ok()) throw Error(`Sesión local: ${r.status()}`);
  const state = await auth.storageState();
  await auth.close();
  const ctx = await browser.newContext({
    baseURL: base,
    viewport: { width: 1280, height: 800 },
    storageState: state,
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
  step(
    "Configuración, paso a paso",
    "Empresa · Métodos · Logística · Tarifas.",
  );
  await cover(
    "Configura tu negocio.<br>Recibe pedidos a tu manera.",
    "Un ejemplo con motorizado en Lima y Shalom.<br>Algunas opciones requieren el plan Plus.",
  );
  await pause(4000);
  await page.evaluate(() => document.querySelector("#tutorial-cover").remove());
  step("1. Abre Configuración", "Abre el menú lateral y elige Configuración.");
  await click(page.getByTitle("Abrir menú", { exact: true }));
  await click(page.locator('[data-tour="configuracion"]'));
  await pause(1300);
  step(
    "2. Completa los datos de Empresa",
    "Escribe el nombre del negocio y su teléfono. La dirección es opcional.",
  );
  await type(
    page.getByPlaceholder("Nombre del negocio", { exact: true }),
    "Mi tienda de ropa",
  );
  await type(page.getByPlaceholder("Teléfono", { exact: true }), "999888777");
  await pause(1500);
  step(
    "Si usas Shalom, elige una agencia de origen",
    "Busca tu agencia y selecciónala de la lista de resultados.",
  );
  await type(
    page.getByPlaceholder("Buscar agencia Shalom", { exact: true }),
    "LIMA / LIMA / LA VICTORIA",
  );
  await click(
    page.getByRole("button", { name: /LIMA \/ LIMA \/ LA VICTORIA/ }).first(),
  );
  await pause(1500);
  step(
    "3. Activa tus métodos de envío",
    "En Métodos, marca solamente los servicios que ofreces a tus clientes.",
  );
  await click(page.getByRole("button", { name: "Métodos", exact: true }));
  await point(page.getByRole("checkbox", { name: /Motorizado Reparto local/ }));
  await pause(1300);
  await click(page.getByRole("checkbox", { name: /Shalom Envíos nacionales/ }));
  await pause(1700);
  step(
    "4. Define tus días de atención",
    "En Logística, elige los días para Motorizado. Ejemplo: lunes, miércoles y viernes.",
  );
  await click(page.getByRole("button", { name: "Logística", exact: true }));
  const moto = page
    .getByRole("heading", { name: "Motorizado", exact: true })
    .locator("../..");
  await click(moto.getByRole("button", { name: "X", exact: true }));
  await click(moto.getByRole("button", { name: "V", exact: true }));
  await pause(1500);
  step(
    "Indica la anticipación de los pedidos",
    "Ejemplo: 2 días de anticipación mínima. Ajusta esta regla a tu operación.",
  );
  await type(moto.locator('input[inputmode="numeric"]').first(), "2");
  await pause(2200);
  step(
    "5. Configura las tarifas por distrito",
    "En Tarifas, elige tu región. Este ejemplo corresponde a Lima.",
  );
  await click(page.getByRole("button", { name: "Tarifas", exact: true }));
  await point(page.getByRole("button", { name: "Lima", exact: true }));
  await pause(1700);
  await type(
    page.getByPlaceholder("Buscar distrito...", { exact: true }),
    "Miraflores",
  );
  const fila = page.getByText("MIRAFLORES", { exact: true }).locator("..");
  step(
    "Asigna el precio de entrega",
    "Busca el distrito y escribe la tarifa. Ejemplo: Miraflores, S/ 8.50.",
  );
  await type(fila.getByRole("spinbutton"), "8.50");
  await pause(2300);
  step(
    "Retira los distritos donde no entregas",
    "Usa el ícono de papelera para quitar un distrito de tu cobertura.",
  );
  await type(
    page.getByPlaceholder("Buscar distrito...", { exact: true }),
    "Lince",
  );
  await click(
    page.getByRole("button", { name: "Eliminar LINCE", exact: true }),
  );
  await pause(1800);
  await type(
    page.getByPlaceholder("Buscar distrito...", { exact: true }),
    "Miraflores",
  );
  step(
    "6. Guarda tu configuración",
    "Pulsa Guardar para aplicar los cambios de todos los apartados.",
  );
  const solicitud = page.waitForResponse(
    (r) =>
      r.url().includes("/api/configuracion") && r.request().method() === "POST",
  );
  await click(page.getByRole("button", { name: "Guardar", exact: true }));
  const respuesta = await solicitud;
  if (!respuesta.ok()) throw Error(await respuesta.text());
  await page.getByText("Configuración guardada", { exact: true }).waitFor();
  await pause(2200);
  const sesion = await (await ctx.request.get("/api/session")).json();
  if (
    sesion.profile.empresa !== "Mi tienda de ropa" ||
    sesion.profile.telefono !== "999888777" ||
    !sesion.profile.metodo_shalom ||
    sesion.profile.logistica_moto_anticipacion !== 2 ||
    Number(sesion.tarifas.MIRAFLORES) !== 8.5 ||
    String(sesion.tarifas.LINCE) !== "-1"
  )
    throw Error("No se verificó el guardado de la configuración");
  step(
    "Listo: tu negocio está configurado",
    "Después, comparte el formulario con tus clientes. Las opciones disponibles dependen de tu plan.",
  );
  await cover(
    "Datos, métodos y tarifas.<br>Todo listo para tus pedidos.",
    "Guarda siempre tus cambios.<br>Después, comparte tu formulario con tus clientes.",
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
  console.log(
    `Tutorial generado: ${duration.toFixed(1)} s. Configuración guardada y verificada en la base local.`,
  );
} finally {
  await browser.close();
  if (process.env.TUTORIAL_FAST)
    await fetch(`${k.url}/rest/v1/profiles?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: k.anonKey, Authorization: `Bearer ${k.serviceKey}` },
    });
}
