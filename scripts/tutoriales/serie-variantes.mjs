// Graba las pantallas reales en el stack LOCAL; nunca usa cuentas ni datos reales.
// APP_PORT=3100 LOCAL_DB_PORT=54322 node scripts/tutoriales/serie-variantes.mjs
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
  process.env.TUTORIAL_OUTPUT || path.join(tmpdir(), "tori-serie-variantes");
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
    localStorage.setItem("tori_tour_modal-nuevo-producto_done", "true");
    for (const id of ["resumen", "envios", "productos"])
      localStorage.setItem(`tori_tour_tab-${id}_done`, "true");
  });
  const page = await ctx.newPage(),
    video = page.video(),
    started = Date.now();
  await page.goto("/dashboard?v=productos");
  await page.getByRole("button", { name: "Variantes", exact: true }).waitFor();
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
  const pause = (ms) => page.waitForTimeout(ms);
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
    await loc.pressSequentially(value, { delay: 65 });
    await pause(450);
  }
  async function select(loc, value) {
    await point(loc);
    await loc.selectOption(value);
    await pause(600);
  }

  step("Serie con variantes", "Un ejemplo completo: dos colores y dos tallas.");
  await cover(
    "Un producto.<br>Todas sus variantes.",
    "Crearemos un polo en Negro y Blanco, con tallas S y M.",
  );
  await pause(3500);
  await page.evaluate(() => document.querySelector("#tutorial-cover").remove());
  step(
    "1. Abre Serie con variantes",
    "Productos → Nuevo producto → Serie con variantes.",
  );
  await click(page.locator('[data-tour="productos-nuevo"]'));
  await click(page.getByRole("button", { name: /Serie con variantes/ }));
  await pause(1800);
  step(
    "2. Completa los datos generales",
    "Nombre, precio y unidad. Estos datos se comparten entre variantes.",
  );
  await type(
    page.getByRole("textbox", { name: "Nombre general", exact: true }),
    "Polo algodón",
  );
  await type(
    page.getByRole("textbox", { name: "Precio general", exact: true }),
    "25.50",
  );
  await select(
    page.getByRole("combobox", { name: "Unidad de medida", exact: true }),
    "unidad",
  );
  await pause(1800);
  step(
    "3. Define los colores",
    "Elige Color y escribe sus valores separados por comas.",
  );
  await select(
    page.getByRole("combobox", { name: "Nombre de opción 1", exact: true }),
    "Color",
  );
  await type(
    page.getByRole("textbox", { name: "Valores 1", exact: true }),
    "Negro, Blanco",
  );
  await pause(1800);
  step(
    "4. Añade las tallas",
    "Pulsa Añadir opción, elige Talla y escribe S, M.",
  );
  await click(page.getByRole("button", { name: "Añadir opción", exact: true }));
  await select(
    page.getByRole("combobox", { name: "Nombre de opción 2", exact: true }),
    "Talla",
  );
  await type(
    page.getByRole("textbox", { name: "Valores 2", exact: true }),
    "S, M",
  );
  await pause(1600);
  step(
    "5. Genera las combinaciones",
    "Dos colores × dos tallas = cuatro variantes.",
  );
  await click(
    page.getByRole("button", { name: "Generar combinaciones", exact: true }),
  );
  await point(page.getByRole("dialog").locator("thead"));
  await pause(3000);
  step(
    "6. Revisa el stock de cada variante",
    "Cada combinación tiene su propio stock. El precio general ya está aplicado.",
  );
  for (const [i, stock] of [10, 8, 6, 4].entries()) {
    await type(
      page.getByRole("spinbutton", {
        name: `Stock variante ${i + 1}`,
        exact: true,
      }),
      String(stock),
    );
  }
  await pause(1500);
  step(
    "7. Guarda el producto y sus variantes",
    "Revisa los datos y pulsa Guardar producto y variantes.",
  );
  await click(
    page.getByRole("button", {
      name: "Guardar producto y variantes",
      exact: true,
    }),
  );
  await page
    .getByRole("heading", { name: "Editar producto y variantes", exact: true })
    .waitFor();
  await pause(1400);
  await click(page.getByRole("button", { name: "Cerrar ficha", exact: true }));
  await page
    .getByRole("button", { name: "Seleccionar", exact: true })
    .waitFor();
  await pause(2000);
  step(
    "Para editar el conjunto: abre Variantes",
    "Entra en Variantes y selecciona la ficha Polo algodón.",
  );
  await click(page.getByRole("button", { name: "Variantes", exact: true }));
  await click(page.getByRole("button", { name: /Polo algodón.*4 variantes/ }));
  await pause(1200);
  step(
    "Cambia el precio general y guarda",
    "Se actualizan las variantes que tienen marcado Usar precio general.",
  );
  await type(
    page.getByRole("textbox", { name: "Precio general", exact: true }),
    "29.90",
  );
  await click(
    page.getByRole("button", {
      name: "Guardar producto y variantes",
      exact: true,
    }),
  );
  await pause(1600);
  await click(page.getByRole("button", { name: "Cerrar ficha", exact: true }));
  await click(
    page.getByRole("button", { name: "Cerrar variantes", exact: true }),
  );
  await pause(1200);
  const productos = await (await ctx.request.get("/api/productos")).json();
  if (
    productos.data.length !== 4 ||
    productos.data.some((p) => p.precio_venta !== 29.9) ||
    JSON.stringify(
      productos.data.map((p) => p.stock_actual).sort((a, b) => a - b),
    ) !== JSON.stringify([4, 6, 8, 10])
  )
    throw Error("No se verificó el guardado de las cuatro variantes");
  step(
    "Listo: cuatro variantes, una sola ficha",
    "En ventas y compras eliges cada variante por separado.",
  );
  await cover(
    "4 variantes.<br>Una sola ficha.",
    "Cada variante conserva su stock.<br>Desde Variantes editas la información general.",
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
      path.join(salida, "serie-con-variantes.mp4"),
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
      path.join(salida, "serie-con-variantes.mp4"),
      "-frames:v",
      "1",
      "-q:v",
      "3",
      path.join(salida, "portada.jpg"),
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  console.log(
    `Tutorial generado: ${duration.toFixed(1)} s. Cuatro variantes y actualización general verificadas.`,
  );
} finally {
  await browser.close();
}
