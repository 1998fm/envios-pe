const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Loading envia.shalom.pe...');
  await page.goto('https://envia.shalom.pe', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  console.log('Extracting agencies from Pinia store...');
  const raw = await page.evaluate(() => {
    const app = document.getElementById('app');
    const pinia = app.__vue_app__.config.globalProperties.$pinia;
    return pinia.state.value.store_agencias.agencias_all;
  });

  console.log(`Extracted ${raw.length} agencies`);

  const transformed = raw.map(a => ({
    codigo: a.abrebiatura || '',
    nombre: a.lugar || `${a.departamento} / ${a.provincia} / ${a.zona} / ${a.nombre}`,
    direccion: a.direccion || '',
    telefono: a.telefono || '',
    horario: a.hora_atencion || (a.hora_atencion_web_lines && a.hora_atencion_web_lines[0]) || '',
    horario_domingo: a.hora_domingo || (a.hora_atencion_web_lines && a.hora_atencion_web_lines[1]) || '',
    lat: parseFloat(a.latitud) || 0,
    lng: parseFloat(a.longitud) || 0,
    reparto: a.reparto === 1,
    aereo: a.aereo === 1,
    origen: a.origen === 1,
    destino: a.destino === 1,
    estado: a.estado || '',
    ter_id: a.ter_id || 0,
    zona: a.zona || '',
    provincia: a.provincia || '',
    departamento: a.departamento || '',
    categoria: a.categoria || '',
    horario_lunes_inicio: a.horario_atencion_lunes_inicio || '',
    horario_lunes_fin: a.horario_atencion_lunes_fin || '',
    horario_sabado_inicio: a.horario_atencion_sabado_inicio || '',
    horario_sabado_fin: a.horario_atencion_sabado_fin || '',
    horario_domingo_inicio: a.horario_atencion_domingo_inicio || '',
    horario_domingo_fin: a.horario_atencion_domingo_fin || ''
  }));

  const outputPath = path.join(process.cwd(), 'src/data/agencias-shalom.json');
  fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
  console.log(`Saved ${transformed.length} agencies to ${outputPath}`);

  await browser.close();
})();
