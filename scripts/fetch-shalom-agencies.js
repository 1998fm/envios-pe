// Script para obtener agencias de la API de Shalom
// Ejecutar: node scripts/fetch-shalom-agencies.js
// Guarda en src/data/agencias-shalom.json

const https = require('https');
const fs = require('fs');
const path = require('path');

const URL = 'https://serviceapp2.shalomcontrol.com/api/v1/web/agencias/listar';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching agencies from Shalom API...');
  const result = await fetch(URL);
  
  if (!result.success || !result.data) {
    console.error('API returned null data. Rate limited? Try again later.');
    process.exit(1);
  }
  
  const agencies = result.data
    .filter(a => a.web === 1)
    .map(a => ({
      codigo: a.ter_abrebiatura,
      nombre: a.nombre,
      direccion: a.direccion,
      telefono: a.telefono,
      horario: a.hora_atencion,
      horario_domingo: a.hora_domingo,
      lat: parseFloat(a.latitud),
      lng: parseFloat(a.longitud),
      reparto: a.ter_reparto_habilitado === '1',
    }));
  
  const outPath = path.join(__dirname, '..', 'src', 'data', 'agencias-shalom.json');
  fs.writeFileSync(outPath, JSON.stringify(agencies, null, 2), 'utf8');
  console.log(Saved  agencies to );
}

main().catch(console.error);
