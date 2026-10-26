// Descarga (una sola vez) el binario de PostgREST para este sistema operativo
// en .local-db/postgrest/ (carpeta ignorada por Git).
//
//   node scripts/local-db/setup.mjs

import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const dir = path.join(root, '.local-db', 'postgrest')
const VERSION = 'v16.5'

const ASSETS = {
  'win32-x64': { file: `postgrest-${VERSION}-windows-x86-64.zip`, bin: 'postgrest.exe', sha256: '17f595b0d8dd37473d0231417dea07c5ac9f791282ff5b017fae51ff29e5de2f' },
  'linux-x64': { file: `postgrest-${VERSION}-linux-static-x86-64.tar.xz`, bin: 'postgrest' },
  'darwin-arm64': { file: `postgrest-${VERSION}-macos-aarch64.tar.xz`, bin: 'postgrest' },
  'darwin-x64': { file: `postgrest-${VERSION}-macos-x86-64.tar.xz`, bin: 'postgrest' },
}

function asset() {
  const a = ASSETS[`${process.platform}-${process.arch}`]
  if (!a) throw new Error(`Sin binario de PostgREST para ${process.platform}-${process.arch}`)
  return a
}

export function postgrestPath() {
  const p = path.join(dir, asset().bin)
  if (!fs.existsSync(p)) {
    throw new Error('Falta PostgREST. Ejecuta: npm run db:setup')
  }
  return p
}

export async function ensurePostgrest() {
  const a = asset()
  const bin = path.join(dir, a.bin)
  if (fs.existsSync(bin)) return bin

  fs.mkdirSync(dir, { recursive: true })
  const url = `https://github.com/PostgREST/postgrest/releases/download/${VERSION}/${a.file}`
  console.log(`Descargando ${a.file}…`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo descargar PostgREST (${res.status})`)
  const buf = Buffer.from(await res.arrayBuffer())

  const sha = crypto.createHash('sha256').update(buf).digest('hex')
  if (a.sha256 && sha !== a.sha256) {
    throw new Error(`El hash del archivo no coincide.\n  esperado: ${a.sha256}\n  obtenido: ${sha}`)
  }
  if (!a.sha256) console.warn(`Aviso: no hay hash fijado para este sistema (sha256 obtenido: ${sha}).`)

  const archive = path.join(dir, a.file)
  fs.writeFileSync(archive, buf)
  execFileSync('tar', ['-xf', archive, '-C', dir], { stdio: 'inherit' })
  fs.rmSync(archive)
  if (process.platform !== 'win32') fs.chmodSync(bin, 0o755)
  console.log(`PostgREST ${VERSION} listo en ${bin}`)
  return bin
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await ensurePostgrest()
}
