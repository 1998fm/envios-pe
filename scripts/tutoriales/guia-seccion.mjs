// Graba las pantallas reales en el stack LOCAL; nunca usa cuentas ni datos reales.
// APP_PORT=3100 LOCAL_DB_PORT=54322 node scripts/tutoriales/guia-seccion.mjs productos
// Requiere dev:local iniciado, Chromium y FFmpeg de Playwright + del sistema.
// TUTORIAL_OUTPUT permite elegir dónde se guarda el video.
import { guias } from "./flujos-secciones.mjs";
import { chromium, request } from "playwright";
import { localKeys } from "../local-db/keys.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";

const seccion = process.argv[2];
const guia = guias[seccion];
if (!guia) throw Error("Indica productos, compras, ventas o variantes");
const base = `http://localhost:${process.env.APP_PORT || 3100}`;
const salida =
  process.env.TUTORIAL_OUTPUT || path.join(tmpdir(), `tori-${seccion}`);
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
  const datos = await guia.preparar(auth.request);
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
    for (const id of [
      "nuevo-producto",
      "nueva-compra",
      "nueva-venta",
      "detalle-compra",
      "detalle-venta",
    ])
      localStorage.setItem(`tori_tour_modal-${id}_done`, "true");
    localStorage.setItem("tori_tour_modal-configuracion_done", "true");
    for (const id of ["resumen", "envios", "productos", "compras", "ventas"])
      localStorage.setItem(`tori_tour_tab-${id}_done`, "true");
  });
  const page = await ctx.newPage(),
    video = page.video(),
    started = Date.now();
  await page.goto(
    `/dashboard?v=${seccion === "variantes" ? "productos" : seccion}`,
  );
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
    const texto = (valor) =>
      valor
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
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
  await guia.run({
    page,
    ctx,
    datos,
    step,
    click,
    type,
    point,
    pause,
    explicar,
    cover,
  });
  await guia.verificar(ctx.request, datos);
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
        path.join(salida, `${seccion}.mp4`),
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
        path.join(salida, `${seccion}.mp4`),
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
    `${process.env.TUTORIAL_FAST ? "Ensayo verificado" : "Tutorial generado"}: ${duration.toFixed(1)} s. Operación guardada y verificada en la base local.`,
  );
} finally {
  await browser.close();
  for (const demoId of perfilesDemo)
    await fetch(`${k.url}/rest/v1/profiles?id=eq.${demoId}`, {
      method: "DELETE",
      headers: { apikey: k.anonKey, Authorization: `Bearer ${k.serviceKey}` },
    });
}
