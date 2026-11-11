// Stack local tipo Supabase, efímero: Postgres real en un directorio temporal
// (fsync apagado, se borra al terminar) + PostgREST + auth/storage emulados.
//
//   node scripts/local-db/stack.mjs          # lo deja corriendo y muestra las variables
//   import { startStack } from './stack.mjs' # uso desde Playwright / dev.mjs

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import EmbeddedPostgres from 'embedded-postgres'
import pg from 'pg'
import { createGateway, createUserDirect } from './gateway.mjs'
import { LOCAL_JWT_SECRET, signApiKey } from './keys.mjs'
import { postgrestPath } from './setup.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')

// Orden en que se aplican los scripts de supabase/. Los de migración de datos
// (adoptar-ventas-huerfanas, limpiar-espacios-clientes, tarifas-moto-*, etc.)
// no se aplican: en una base vacía no tienen nada que migrar.
export const SCHEMA_ORDER = [
  'clientes-table.sql',
  'personas-dni-nullable.sql',
  'personas-telefono-nullable.sql',
  'inventario.sql',
  'productos-archivados.sql',
  'productos-imagenes.sql',
  'compras.sql',
  'gastos.sql',
  'ventas.sql',
  'ventas-estados-migracion.sql',
  'ventas-estado-envio.sql',
  'ventas-estado-envio-completado.sql',
  'ventas-metodo-pago.sql',
  'ventas-telefono.sql',
  'ventas-persona-dni-nullable.sql',
  'ventas-costo.sql',
  'venta-abonos.sql',
  'envio-items.sql',
  'envio-estado-observacion.sql',
  'olva-agencia-envios.sql',
  'tipo-entrega.sql',
  'solicitar-cantidad.sql',
  'recojo-tienda.sql',
  'mostrar-tracking.sql',
  'escoger-fecha.sql',
  'moto-region.sql',
  'redirect-message-image.sql',
  'color-formulario.sql',
  'cerrar-formulario.sql',
  'cerrar-formulario-dias.sql',
  'antelacion-minima.sql',
  'plan-system.sql',
  'plan-3-planes.sql',
  'super-admin.sql',
  'pagos.sql',
  'agencias-shalom.sql',
  'agencias-shalom-recibe.sql',
  'agencias-olva.sql',
  'codigos-envios-ventas.sql',
  'envios-idempotencia.sql',
  'rpc-stock.sql',
  'kardex-movimientos.sql',
  'rpc-venta-atomico.sql',
  'rpc-guardar-configuracion.sql',
  'logistica-anticipacion-solo-habiles.sql',
  'roles-negocio.sql',
  'limpieza-envios-30-dias.sql',
  'indices-optimizacion.sql',
  'realtime-envios.sql',
  'realtime-ventas.sql',
  'rls-policies.sql',
  'seguridad-fixes.sql',
  'plan-basico-plus.sql',
  'acceso-solo-servidor.sql',
]

/** Puerto libre elegido por el sistema (evita choques con restos de ejecuciones anteriores). */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

const pidFile = path.join(root, '.local-db', process.env.LOCAL_DB_PORT && process.env.LOCAL_DB_PORT !== '54321' ? `stack-${process.env.LOCAL_DB_PORT}.pids.json` : 'stack.pids.json')

/** Mata procesos que quedaron de una ejecución anterior que murió sin limpiar. */
function killStale() {
  try {
    const { pids = [], dirs = [] } = JSON.parse(fs.readFileSync(pidFile, 'utf8'))
    for (const pid of pids) {
      try {
        process.kill(pid)
      } catch {}
    }
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true })
  } catch {}
  fs.rmSync(pidFile, { force: true })
}

function readSql(file) {
  return fs.readFileSync(file, 'utf8').replace(/^﻿/, '')
}

async function waitFor(url, label, ms = 30000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(url)
      if (r.status < 500) return
    } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`${label} no respondió en ${ms / 1000}s (${url})`)
}

export async function startStack(opts = {}) {
  killStale()
  const ports = {
    gateway: Number(process.env.LOCAL_DB_PORT || opts.port || 54321),
    pg: Number(process.env.LOCAL_DB_PG_PORT || opts.pgPort || (await freePort())),
    rest: Number(process.env.LOCAL_DB_REST_PORT || opts.restPort || (await freePort())),
  }
  const autoconfirm = opts.autoconfirm ?? process.env.LOCAL_DB_AUTOCONFIRM !== '0'
  const log = opts.quiet ? () => {} : (m) => console.log(`[local-db] ${m}`)
  const jwtSecret = process.env.LOCAL_DB_JWT_SECRET || LOCAL_JWT_SECRET

  // 1) Postgres efímero
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tori-pg-'))
  const embedded = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    port: ports.pg,
    persistent: false,
    onLog: () => {},
    onError: () => {},
    postgresFlags: ['-c', 'fsync=off', '-c', 'synchronous_commit=off', '-c', 'full_page_writes=off', '-c', 'max_connections=60'],
  })
  log('iniciando Postgres…')
  await embedded.initialise()
  await embedded.start()
  await embedded.createDatabase('app')

  // Registro de procesos para limpiar si esta ejecución muere de golpe.
  const pgPid = Number(fs.readFileSync(path.join(dataDir, 'postmaster.pid'), 'utf8').split(/\r?\n/)[0])
  const writePids = (extra = []) => {
    fs.mkdirSync(path.dirname(pidFile), { recursive: true })
    fs.writeFileSync(pidFile, JSON.stringify({ pids: [pgPid, ...extra], dirs: [dataDir] }))
  }
  writePids()

  const pool = new pg.Pool({ host: '127.0.0.1', port: ports.pg, user: 'postgres', password: 'postgres', database: 'app', max: 8 })
  // Al apagar, Postgres corta las conexiones inactivas: no es un error.
  pool.on('error', () => {})

  // 2) Esquema
  const applied = []
  async function apply(label, sql) {
    try {
      await pool.query(sql)
      applied.push(label)
    } catch (e) {
      throw new Error(`Falló ${label}: ${e.message}`)
    }
  }
  await apply('00-bootstrap.sql', readSql(path.join(here, 'sql', '00-bootstrap.sql')))
  // sinEsquema: solo el esqueleto de Supabase (roles, auth, storage); el llamador
  // aplica el esquema (lo usa generar-instalacion.mjs --probar).
  if (!opts.sinEsquema) {
    await apply('01-base-tables.sql', readSql(path.join(here, 'sql', '01-base-tables.sql')))
    for (const f of SCHEMA_ORDER) {
      await apply(f, readSql(path.join(root, 'supabase', f)))
    }
  }
  log(`esquema listo (${applied.length} scripts)`)

  // 3) PostgREST
  const bin = postgrestPath()
  const pgBin = path.join(root, 'node_modules', '@embedded-postgres', `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch}`, 'native', 'bin')
  // PostgREST a veces no logra conectarse en el primer intento (la base acaba de
  // arrancar): se reintenta hasta 3 veces antes de rendirse.
  const opcionesRest = {
    env: {
      ...process.env,
      PATH: `${pgBin}${path.delimiter}${process.env.PATH}`,
      PGRST_DB_URI: `postgres://authenticator:authenticator@127.0.0.1:${ports.pg}/app`,
      PGRST_DB_SCHEMAS: 'public',
      PGRST_DB_ANON_ROLE: 'anon',
      PGRST_JWT_SECRET: jwtSecret,
      PGRST_SERVER_HOST: '127.0.0.1',
      PGRST_SERVER_PORT: String(ports.rest),
      PGRST_DB_POOL: '10',
      PGRST_DB_MAX_ROWS: '1000',
      PGRST_OPENAPI_MODE: 'disabled',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  }

  let rest
  let restLog = ''
  for (let intento = 1; intento <= 3; intento++) {
    restLog = ''
    rest = spawn(bin, [], opcionesRest)
    writePids([rest.pid])
    rest.stdout.on('data', (d) => (restLog += d))
    rest.stderr.on('data', (d) => (restLog += d))
    rest.on('exit', (c) => {
      if (c) restLog += `\n[postgrest salió con código ${c}]`
    })
    try {
      await waitFor(`http://127.0.0.1:${ports.rest}/`, 'PostgREST', 20000)
      break
    } catch (e) {
      rest.kill()
      if (intento === 3) throw new Error(`${e.message}\n--- log de PostgREST ---\n${restLog.slice(-1500)}`)
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  log('PostgREST listo')

  // 4) Gateway (auth + storage + proxy REST)
  const gw = createGateway({ pool, jwtSecret, postgrestPort: ports.rest, port: ports.gateway, autoconfirm })
  await gw.listen()
  const anonKey = await gw.signKey('anon')
  const serviceKey = await gw.signKey('service_role')
  const url = `http://127.0.0.1:${ports.gateway}`
  log(`API lista en ${url}`)

  let stopped = false
  async function stop() {
    if (stopped) return
    stopped = true
    rest.kill()
    await gw.close().catch(() => {})
    await pool.end().catch(() => {})
    await embedded.stop().catch(() => {})
    fs.rmSync(dataDir, { recursive: true, force: true })
    fs.rmSync(pidFile, { force: true })
  }

  return {
    url,
    anonKey,
    serviceKey,
    jwtSecret,
    pool,
    mailbox: gw.mailbox,
    stop,
    createUser: (args) => createUserDirect(pool, args),
    /** Variables de entorno que espera la app (lado servidor y navegador). */
    env: {
      SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: anonKey,
      SUPABASE_SERVICE_ROLE_KEY: serviceKey,
      SUPABASE_JWT_SECRET: jwtSecret,
    },
  }
}

// ---- CLI ----
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const stack = await startStack()
  console.log('\nVariables para la app:')
  for (const [k, v] of Object.entries(stack.env)) console.log(`  ${k}=${v}`)
  console.log('\nCtrl+C para detener y borrar la base.')
  const bye = async () => {
    await stack.stop()
    process.exit(0)
  }
  process.on('SIGINT', bye)
  process.on('SIGTERM', bye)
}
