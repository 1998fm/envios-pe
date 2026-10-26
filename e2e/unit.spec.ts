import { expect, test } from './support/test'
import { claveValida, cronAutorizado } from '../src/lib/cronAuth'
import { permitir } from '../src/lib/rateLimit'
import { urlHttpSegura } from '../src/lib/urlSegura'

// Pruebas rápidas de las utilidades de seguridad (sin app ni base de datos).

test.describe('urlHttpSegura', () => {
  const aceptadas: [string, string][] = [
    ['https://tienda.pe/gracias', 'https://tienda.pe/gracias'],
    ['http://tienda.pe', 'http://tienda.pe/'],
    ['  https://x.com/a?b=1  ', 'https://x.com/a?b=1'],
    ['instagram.com/mi_tienda', 'https://instagram.com/mi_tienda'],
    ['wa.me/51999999999', 'https://wa.me/51999999999'],
  ]
  for (const [entrada, salida] of aceptadas) {
    test(`acepta ${JSON.stringify(entrada)}`, () => expect(urlHttpSegura(entrada)).toBe(salida))
  }

  const rechazadas = [
    'javascript:alert(1)', 'JAVASCRIPT:alert(1)', ' javascript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)', 'file:///etc/passwd', 'ftp://x.com', '', '   ', null, undefined, 42, {}, 'https://' + 'a'.repeat(2100) + '.com',
  ]
  for (const entrada of rechazadas) {
    test(`rechaza ${JSON.stringify(entrada)?.slice(0, 40)}`, () => expect(urlHttpSegura(entrada as never)).toBeUndefined())
  }
})

test.describe('rateLimit', () => {
  const req = (ip: string) => new Request('http://x/', { headers: { 'x-forwarded-for': ip } })

  test('permite hasta el máximo y luego bloquea', () => {
    const ip = `9.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`
    const r = Array.from({ length: 5 }, () => permitir(req(ip), 'u1', 3, 60_000))
    expect(r).toEqual([true, true, true, false, false])
  })

  test('cada IP y cada nombre tienen su propio cupo', () => {
    const a = `8.8.${Math.floor(Math.random() * 250)}.1`
    const b = `8.8.${Math.floor(Math.random() * 250)}.2`
    for (let i = 0; i < 3; i++) permitir(req(a), 'u2', 3, 60_000)
    expect(permitir(req(a), 'u2', 3, 60_000)).toBe(false)
    expect(permitir(req(b), 'u2', 3, 60_000)).toBe(true)
    expect(permitir(req(a), 'otro-nombre', 3, 60_000)).toBe(true)
  })

  test('la ventana se reinicia', async () => {
    const ip = `7.7.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`
    expect(permitir(req(ip), 'u3', 1, 50)).toBe(true)
    expect(permitir(req(ip), 'u3', 1, 50)).toBe(false)
    await new Promise((r) => setTimeout(r, 80))
    expect(permitir(req(ip), 'u3', 1, 50)).toBe(true)
  })
})

test.describe('cronAuth', () => {
  const con = (h: Record<string, string>) => new Request('http://x/', { headers: h })

  test('sin CRON_SECRET configurado todo se rechaza', () => {
    const antes = process.env.CRON_SECRET
    delete process.env.CRON_SECRET
    expect(cronAutorizado(con({ authorization: 'Bearer cualquiera' }))).toBe(false)
    expect(cronAutorizado(con({ authorization: 'Bearer ' }))).toBe(false)
    expect(cronAutorizado(con({ 'x-vercel-cron': '1' }))).toBe(false)
    if (antes) process.env.CRON_SECRET = antes
  })

  test('solo vale Authorization: Bearer <secreto>', () => {
    const antes = process.env.CRON_SECRET
    process.env.CRON_SECRET = 's3cr3t-largo-de-prueba'
    expect(cronAutorizado(con({ authorization: 'Bearer s3cr3t-largo-de-prueba' }))).toBe(true)
    expect(cronAutorizado(con({ authorization: 'bearer s3cr3t-largo-de-prueba' }))).toBe(false)
    expect(cronAutorizado(con({ authorization: 's3cr3t-largo-de-prueba' }))).toBe(false)
    expect(cronAutorizado(con({ authorization: 'Bearer s3cr3t-largo-de-pruebaX' }))).toBe(false)
    expect(cronAutorizado(con({ 'x-vercel-cron': '1' }))).toBe(false)
    expect(cronAutorizado(con({}))).toBe(false)
    if (antes) process.env.CRON_SECRET = antes
    else delete process.env.CRON_SECRET
  })

  test('claveValida compara claves compartidas', () => {
    expect(claveValida('abc', 'abc')).toBe(true)
    expect(claveValida('abd', 'abc')).toBe(false)
    expect(claveValida(null, 'abc')).toBe(false)
    expect(claveValida('abc', undefined)).toBe(false)
    expect(claveValida('', '')).toBe(false)
  })
})
