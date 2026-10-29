// Genera supabase/instalacion-completa.sql: UN solo script para dejar lista una
// base de Supabase NUEVA (tablas, funciones, políticas, índices y permisos), en el
// orden correcto. Se pega y se ejecuta una vez en el SQL Editor.
//
//   node scripts/local-db/generar-instalacion.mjs            # genera el archivo
//   node scripts/local-db/generar-instalacion.mjs --probar   # lo genera y lo prueba en una base vacía
//
// Fuente: sql/01-base-tables.sql (tablas que nunca tuvieron script) + los scripts
// de supabase/ en el orden de SCHEMA_ORDER (stack.mjs).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SCHEMA_ORDER, startStack } from './stack.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const salida = path.join(root, 'supabase', 'instalacion-completa.sql')
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n').trimEnd()

const partes = [
  `-- ============================================================
-- INSTALACIÓN COMPLETA — Tori (envios-pe)
-- ============================================================
-- Deja lista una base de Supabase NUEVA y vacía. Pégalo entero en
-- Supabase → SQL Editor → New query → Run (una sola vez).
--
-- Archivo generado: NO se edita a mano. Para regenerarlo:
--   node scripts/local-db/generar-instalacion.mjs
--
-- Después de ejecutarlo hay que hacer a mano (ver el README del proyecto):
--   1. Storage → crear el bucket público "logos".
--   2. Registrar tu usuario y volverlo super admin:
--        UPDATE profiles SET role = 'super_admin'
--         WHERE id = (SELECT id FROM auth.users WHERE email = 'tu-correo@ejemplo.com');
--   3. Auth → URL Configuration: Site URL y Redirect URL  <tu-sitio>/auth/callback
--
-- Incluye supabase/acceso-solo-servidor.sql al final: el navegador no accede a la
-- base, solo el servidor de la app (requiere la versión actual de la app).
-- ============================================================
`,
  `-- >>>>>>>>>> tablas base (profiles, envios, tarifas_moto) <<<<<<<<<<\n${leer(path.join(here, 'sql', '01-base-tables.sql'))}`,
]
for (const f of SCHEMA_ORDER) {
  partes.push(`-- >>>>>>>>>> supabase/${f} <<<<<<<<<<\n${leer(path.join(root, 'supabase', f))}`)
}
const sql = partes.join('\n\n') + '\n'
fs.writeFileSync(salida, sql, 'utf8')
console.log(`Generado ${path.relative(root, salida)} (${Math.round(sql.length / 1024)} KB, ${SCHEMA_ORDER.length + 1} bloques)`)

if (process.argv.includes('--probar')) {
  console.log('Probando en una base vacía…')
  const stack = await startStack({ quiet: true, sinEsquema: true })
  try {
    await stack.pool.query(sql)
    const { rows } = await stack.pool.query(
      "SELECT count(*)::int AS tablas FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
    )
    const { rows: planes } = await stack.pool.query('SELECT plan FROM plan_features ORDER BY plan')
    console.log(`OK: ${rows[0].tablas} tablas en public; planes: ${planes.map((p) => p.plan).join(', ')}`)
  } finally {
    await stack.stop()
  }
}
