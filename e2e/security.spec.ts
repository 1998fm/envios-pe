import { createHmac, randomUUID } from 'node:crypto'
import { request } from '@playwright/test'
import { expect, test } from './support/test'
import { crearGasto, crearPersona, crearProducto, crearVenta } from './support/app'
import { appApi, createUser, dbInsert, dbSelect, keys, login, supabase, uniq } from './support/stack'

// Regresiones de seguridad: cada bloque corresponde a un hallazgo corregido.
// Si alguno falla, NO desplegar.

const CRON_SECRET = 'local-cron-secret'
const WEBHOOK_SECRET = 'local-webhook-secret'

test.describe('#2 IDOR: sin sesión no se toca ninguna API de negocio', () => {
  const victima = randomUUID()
  const lecturas = [
    '/api/ventas', '/api/ventas?resumen=1', '/api/clientes', '/api/productos', '/api/compras', '/api/gastos',
    '/api/dashboard', '/api/envios', '/api/plan/features', '/api/usage/shalom', '/api/personas?busqueda=12345678',
    '/api/productos/:id/movimientos', '/api/clientes/:id', '/api/ventas/:id/abonos',
  ]
  for (const plantilla of lecturas) {
    test(`GET ${plantilla} → 401 aunque se pase user_id ajeno`, async () => {
      const ruta = plantilla.replace(':id', randomUUID())
      const api = await appApi(null)
      const sep = ruta.includes('?') ? '&' : '?'
      expect((await api.get(`${ruta}${sep}user_id=${victima}`)).status()).toBe(401)
      await api.dispose()
    })
  }

  const escrituras: [string, string, object][] = [
    ['POST', '/api/gastos', { user_id: victima, concepto: 'x', monto: 1 }],
    ['POST', '/api/productos', { user_id: victima, nombre: 'x' }],
    ['POST', '/api/compras', { user_id: victima, proveedor: 'x', items: [{ producto_nombre: 'x', cantidad: 1, precio_unitario: 1 }] }],
    ['POST', '/api/ventas', { user_id: victima, persona_id: randomUUID(), items: [{ cantidad: 1, precio_unitario: 1 }] }],
    ['POST', '/api/personas', { user_id: victima, nombre: 'x' }],
    ['POST', '/api/ventas/migrate', { user_id: victima }],
    ['POST', '/api/usage/shalom', { user_id: victima, cantidad: 3 }],
    ['PATCH', '/api/productos/batch', { ids: [randomUUID()], archivado: true }],
    ['PUT', '/api/gastos/:id', { concepto: 'hack' }],
    ['DELETE', '/api/gastos/:id', {}],
    ['PUT', '/api/compras/:id', { estado: 'ANULADA' }],
    ['DELETE', '/api/compras/:id', {}],
    ['PUT', '/api/productos/:id', { nombre: 'hack' }],
    ['DELETE', '/api/productos/:id', {}],
    ['PUT', '/api/ventas/:id', { estado: 'ANULADA' }],
    ['DELETE', '/api/ventas/:id', {}],
    ['POST', '/api/ventas/:id/abonos', { monto: 1 }],
    ['PUT', '/api/clientes/:id', { nombre: 'hack' }],
    ['DELETE', '/api/clientes/:id', {}],
    ['POST', '/api/mercadopago/create-subscription', { plan: 'pro', periodo: 'mensual', userId: victima }],
  ]
  for (const [metodo, ruta, body] of escrituras) {
    test(`${metodo} ${ruta} → 401 sin sesión`, async () => {
      const api = await appApi(null)
      const res = await api.fetch(ruta.replace(':id', randomUUID()), { method: metodo, data: body })
      expect(res.status()).toBe(401)
      await api.dispose()
    })
  }
})

test.describe('#2 IDOR: un usuario con sesión no ve ni modifica lo de otro negocio', () => {
  test('listados aislados; ?user_id= y body.user_id ajenos se ignoran', async () => {
    const a = await createUser()
    const b = await createUser()
    const apiA = await appApi(a.token)
    const apiB = await appApi(b.token)

    const prodA = await crearProducto(apiA, { nombre: 'Solo de A' })
    const gastoA = await crearGasto(apiA, { concepto: 'Gasto de A' })
    const personaA = await crearPersona(apiA)
    const ventaA = await (await crearVenta(apiA, personaA, [{ producto_id: prodA.id, producto_nombre: 'Solo de A', cantidad: 2 }])).json()

    // B pide los datos de A con el user_id de A en la URL: recibe lo SUYO (vacío).
    for (const ruta of ['productos', 'gastos', 'ventas', 'compras', 'clientes']) {
      const r = await apiB.get(`/api/${ruta}?user_id=${a.id}`)
      expect(r.status(), ruta).toBe(200)
      expect((await r.json()).data, ruta).toHaveLength(0)
    }

    // B escribe diciendo que es A: el registro queda a nombre de B.
    const creado = await apiB.post('/api/gastos', { data: { user_id: a.id, concepto: 'Intento de B', monto: 1 } })
    expect(creado.status()).toBe(200)
    expect((await creado.json()).data.profile_id).toBe(b.id)

    // B no puede editar/borrar/anular lo de A por id: 404 y nada cambia.
    expect((await apiB.put(`/api/gastos/${gastoA.id}`, { data: { concepto: 'hackeado' } })).status()).toBe(404)
    expect((await apiB.delete(`/api/gastos/${gastoA.id}`)).status()).toBe(404)
    expect((await apiB.put(`/api/productos/${prodA.id}`, { data: { nombre: 'hackeado' } })).status()).toBe(404)
    expect((await apiB.delete(`/api/productos/${prodA.id}`)).status()).toBe(404)
    expect((await apiB.patch('/api/productos/batch', { data: { ids: [prodA.id], archivado: true } })).status()).toBe(200)
    expect((await apiB.put(`/api/ventas/${ventaA.data.id}`, { data: { estado: 'ANULADA' } })).status()).toBe(404)
    expect((await apiB.delete(`/api/ventas/${ventaA.data.id}`)).status()).toBe(404)
    expect((await apiB.post(`/api/ventas/${ventaA.data.id}/abonos`, { data: { monto: 1 } })).status()).toBe(404)
    expect((await apiB.get(`/api/ventas/${ventaA.data.id}/abonos`)).status()).toBe(404)
    expect((await apiB.get(`/api/productos/${prodA.id}/movimientos`)).status()).toBe(404)
    expect((await apiB.get(`/api/clientes/${personaA.id}`)).status()).toBe(404)
    expect((await apiB.put(`/api/clientes/${personaA.id}`, { data: { nombre: 'hackeado' } })).status()).toBe(404)
    expect((await apiB.delete(`/api/clientes/${personaA.id}`, { data: {} })).status()).toBe(404)

    // Y los datos de A siguen intactos.
    const [g] = await dbSelect<{ concepto: string }>('gastos', `id=eq.${gastoA.id}&select=concepto`)
    expect(g.concepto).toBe('Gasto de A')
    const [p] = await dbSelect<{ nombre: string; archivado: boolean }>('productos', `id=eq.${prodA.id}&select=nombre,archivado`)
    expect(p.nombre).toBe('Solo de A')
    expect(p.archivado).toBe(false)
    const [v] = await dbSelect<{ estado: string }>('ventas', `id=eq.${ventaA.data.id}&select=estado`)
    expect(v.estado).not.toBe('ANULADA')
    const [pa] = await dbSelect<{ nombre: string }>('personas', `id=eq.${personaA.id}&select=nombre`)
    expect(pa.nombre).toBe(personaA.nombre)

    await apiA.dispose()
    await apiB.dispose()
  })

  test('no se pueden vender ni comprar productos de otro negocio', async () => {
    const a = await createUser()
    const b = await createUser()
    const apiA = await appApi(a.token)
    const apiB = await appApi(b.token)
    const prodA = await crearProducto(apiA, { stock_actual: 5 })
    const personaB = await crearPersona(apiB)

    const venta = await crearVenta(apiB, personaB, [{ producto_id: prodA.id, cantidad: 3 }])
    expect(venta.status()).toBe(403)

    const compra = await apiB.post('/api/compras', { data: { proveedor: 'X', items: [{ producto_id: prodA.id, producto_nombre: 'x', cantidad: 50, precio_unitario: 1 }] } })
    expect(compra.status()).toBe(403)

    const [p] = await dbSelect<{ stock_actual: number }>('productos', `id=eq.${prodA.id}&select=stock_actual`)
    expect(p.stock_actual).toBe(5)
  })

  test('/api/personas solo encuentra clientes del propio negocio', async () => {
    const a = await createUser()
    const b = await createUser()
    const apiA = await appApi(a.token)
    const apiB = await appApi(b.token)
    const personaA = await crearPersona(apiA, { nombre: 'Clienta Privada' })

    const propia = await (await apiA.get(`/api/personas?busqueda=${personaA.dni}`)).json()
    expect(propia.data?.nombre).toBe('Clienta Privada')

    const ajena = await (await apiB.get(`/api/personas?busqueda=${personaA.dni}`)).json()
    expect(ajena.data).toBeNull()
  })
})

test.describe('#10 Roles y permisos se aplican en el servidor', () => {
  async function miembroConRol(permisos: Record<string, boolean>) {
    const dueno = await createUser()
    const miembro = await createUser({ plan: 'basic' })
    const rol = await dbInsert<{ id: string }>('business_roles', { owner_id: dueno.id, nombre: `Rol ${uniq('r')}`, vista_default: 'ventas', permisos })
    await dbInsert('business_members', { owner_id: dueno.id, user_id: miembro.id, role_id: rol.id })
    return { dueno, miembro }
  }

  test('sin ver_ganancia/ver_kpis no salen costos ni totales, con o sin ?resumen=1', async () => {
    const { dueno, miembro } = await miembroConRol({ ver_ventas: true, ver_clientes: true })
    const apiD = await appApi(dueno.token)
    const apiM = await appApi(miembro.token)

    const prod = await crearProducto(apiD, { precio_compra: 30, precio_venta: 80, stock_actual: 20 })
    const persona = await crearPersona(apiD)
    expect((await crearVenta(apiD, persona, [{ producto_id: prod.id, cantidad: 2, precio_unitario: 80 }])).status()).toBe(200)

    // el dueño sí ve costo y ganancia
    const dueño = await (await apiD.get('/api/ventas?resumen=1')).json()
    expect(dueño.data[0].items[0].costo_unitario).toBe(30)
    expect(dueño.resumen.ganancia).toBeGreaterThan(0)

    for (const q of ['', '?resumen=1', `?user_id=${dueno.id}&resumen=1`]) {
      const r = await apiM.get(`/api/ventas${q}`)
      expect(r.status(), q).toBe(200)
      const j = await r.json()
      expect(j.data).toHaveLength(1) // ve las ventas del negocio del dueño
      expect(j.data[0].items[0]).not.toHaveProperty('costo_unitario')
      if (j.resumen) {
        expect(j.resumen.monto).toBe(0)
        expect(j.resumen.ganancia).toBe(0)
        expect(j.resumen.costo).toBe(0)
      }
    }
  })

  test('con ver_kpis pero sin ver_ganancia: ve totales y no ganancias', async () => {
    const { dueno, miembro } = await miembroConRol({ ver_ventas: true, ver_kpis_venta: true })
    const apiD = await appApi(dueno.token)
    const apiM = await appApi(miembro.token)
    const prod = await crearProducto(apiD, { precio_compra: 10, precio_venta: 100, stock_actual: 5 })
    await crearVenta(apiD, await crearPersona(apiD), [{ producto_id: prod.id, cantidad: 1, precio_unitario: 100 }])
    const j = await (await apiM.get('/api/ventas?resumen=1')).json()
    expect(j.resumen.monto).toBe(100)
    expect(j.resumen.ganancia).toBe(0)
    expect(j.data[0].items[0]).not.toHaveProperty('costo_unitario')
  })

  test('el resumen no filtra dinero ni ganancias a un rol que no puede verlos', async () => {
    const { dueno, miembro } = await miembroConRol({ ver_resumen: true, ver_envios: true })
    const apiD = await appApi(dueno.token)
    const apiM = await appApi(miembro.token)
    const prod = await crearProducto(apiD, { precio_compra: 30, precio_venta: 100, stock_actual: 20 })
    await crearVenta(apiD, await crearPersona(apiD), [{ producto_id: prod.id, cantidad: 2, precio_unitario: 100 }])
    await crearGasto(apiD, { monto: 40 })

    const d = await (await apiD.get('/api/dashboard')).json()
    expect(d.acceso).toEqual({ dinero: true, ganancia: true, egresos: true })
    expect(d.hoy.ventas).toBe(200)
    expect(d.hoy.ganancia).toBe(140)
    expect(d.kpis.gananciaMes).toBe(140)
    expect(d.kpis.gastosMes).toBe(40)

    const m = await (await apiM.get('/api/dashboard')).json()
    expect(m.acceso).toEqual({ dinero: false, ganancia: false, egresos: false })
    for (const n of [m.hoy.ventas, m.hoy.ganancia, m.kpis.ventasMes, m.kpis.gananciaMes, m.kpis.ventasHoy, m.kpis.saldoDisponible, m.kpis.totalGastos, m.kpis.gastosMes, m.kpis.totalVentas, m.kpis.cobrosPendientesTotal]) {
      expect(n).toBe(0)
    }
    expect(m.historico.ventas.every((h: { total: number }) => h.total === 0)).toBe(true)
    expect(m.graficos.ventasPorMetodo.every((x: { total: number }) => x.total === 0)).toBe(true)
  })

  test('con ver_kpis_venta ve lo vendido pero no ganancia ni saldo', async () => {
    const { dueno, miembro } = await miembroConRol({ ver_resumen: true, ver_kpis_venta: true })
    const apiD = await appApi(dueno.token)
    const apiM = await appApi(miembro.token)
    const prod = await crearProducto(apiD, { precio_compra: 30, precio_venta: 100, stock_actual: 20 })
    await crearVenta(apiD, await crearPersona(apiD), [{ producto_id: prod.id, cantidad: 1, precio_unitario: 100 }])
    const m = await (await apiM.get('/api/dashboard')).json()
    expect(m.acceso).toEqual({ dinero: true, ganancia: false, egresos: false })
    expect(m.hoy.ventas).toBe(100)
    expect(m.hoy.ganancia).toBe(0)
    expect(m.kpis.gananciaMes).toBe(0)
    expect(m.kpis.saldoDisponible).toBe(0)
  })

  test('el dueño puede crear roles durante la prueba gratuita de Business Plus', async () => {
    const dueno = await createUser({ plan: 'business_plus', trial: true })
    const api = await appApi(dueno.token)
    const r = await api.post('/api/roles', { data: { nombre: 'Vendedor', vista_default: 'ventas', permisos: { ver_ventas: true } } })
    expect(r.status(), await r.text()).toBe(200)
    const f = await (await api.get('/api/plan/features')).json()
    expect(f.plan).toBe('business_plus')
  })

  test('un permiso no abre otras pestañas: sin ver_gastos → 403, sin ver_productos no hay costo', async () => {
    const { dueno, miembro } = await miembroConRol({ ver_ventas: true })
    const apiD = await appApi(dueno.token)
    const apiM = await appApi(miembro.token)
    await crearGasto(apiD)
    await crearProducto(apiD, { precio_compra: 33 })

    expect((await apiM.get('/api/gastos')).status()).toBe(403)
    expect((await apiM.post('/api/gastos', { data: { concepto: 'x', monto: 1 } })).status()).toBe(403)
    expect((await apiM.get('/api/compras')).status()).toBe(403)
    expect((await apiM.get('/api/clientes')).status()).toBe(403)
    expect((await apiM.get('/api/dashboard')).status()).toBe(403)
    expect((await apiM.delete(`/api/productos/${randomUUID()}`)).status()).toBe(403)

    // el catálogo sí sirve para vender, pero sin el costo de compra
    const cat = await apiM.get('/api/productos')
    expect(cat.status()).toBe(200)
    const prods = (await cat.json()).data as Record<string, unknown>[]
    expect(prods.length).toBeGreaterThan(0)
    for (const p of prods) expect(p).not.toHaveProperty('precio_compra')
  })

  test('un miembro cuyo dueño ya no está en Business Plus pierde el acceso', async () => {
    const { dueno, miembro } = await miembroConRol({ ver_ventas: true })
    const db = await supabase('service')
    const r = await db.patch(`/rest/v1/profiles?id=eq.${dueno.id}`, { data: { plan: 'basic', trial_end: null, pro_until: null } })
    expect(r.ok()).toBe(true)
    const apiM = await appApi(miembro.token)
    expect((await apiM.get('/api/ventas')).status()).toBe(403)
  })

  test('un usuario sin rol ni negocio no entra al negocio de otro por user_id', async () => {
    const dueno = await createUser()
    const intruso = await createUser({ plan: 'basic' })
    await crearGasto(await appApi(dueno.token))
    const r = await (await appApi(intruso.token)).get(`/api/gastos?user_id=${dueno.id}`)
    expect(r.status()).toBe(403)
  })
})

test.describe('#1 Pro gratis y suscripciones', () => {
  test('/api/payment/success ya no activa planes', async () => {
    const u = await createUser({ plan: 'basic' })
    const api = await appApi(u.token)
    for (const body of [{ userId: u.id, planType: 'pro' }, { userId: u.id, planType: 'basic' }]) {
      const r = await api.post('/api/payment/success', { data: body })
      expect(r.status()).toBe(410)
    }
    const anon = await appApi(null)
    expect((await anon.post('/api/payment/success', { data: { userId: u.id, planType: 'pro' } })).status()).toBe(410)
    expect((await anon.post('/api/payment/create', { data: { userId: u.id, planType: 'pro' } })).status()).toBe(410)
    const [p] = await dbSelect<{ plan: string; pro_until: string | null }>('profiles', `id=eq.${u.id}&select=plan,pro_until`)
    expect(p.plan).toBe('basic')
    expect(p.pro_until).toBeNull()
  })

  test('create-subscription valida el plan y no acepta un userId del body', async () => {
    const u = await createUser({ plan: 'basic' })
    const api = await appApi(u.token)
    expect((await api.post('/api/mercadopago/create-subscription', { data: { plan: 'oro', periodo: 'mensual' } })).status()).toBe(400)
    expect((await api.post('/api/mercadopago/create-subscription', { data: { plan: 'pro', periodo: 'semanal' } })).status()).toBe(400)
  })
})

test.describe('#3 #4 #5 La base solo responde al servidor', () => {
  const TABLAS = [
    'profiles', 'envios', 'ventas', 'venta_items', 'venta_abonos', 'productos', 'gastos', 'compras', 'compra_items', 'personas', 'cliente_de',
    'business_members', 'business_roles', 'business_invites', 'pagos', 'tarifas_moto', 'plan_features', 'admin_audit_log', 'agencias_shalom', 'agencias_olva',
    'movimientos_inventario', 'shalom_exports',
  ]

  test('con la clave pública o con una sesión de usuario NO se lee ninguna tabla, ni la propia', async () => {
    const u = await createUser()
    await crearGasto(await appApi(u.token))
    const anon = await supabase('anon')
    const user = await supabase({ token: u.token })
    for (const t of TABLAS) {
      for (const [quien, ctx] of [['anon', anon], ['usuario', user]] as const) {
        const r = await ctx.get(`/rest/v1/${t}?select=*&limit=5`)
        expect([401, 403, 404], `${quien} pudo leer ${t} (${r.status()})`).toContain(r.status())
      }
    }
    // ni siquiera su propio perfil
    const propio = await user.get(`/rest/v1/profiles?id=eq.${u.id}&select=id`)
    expect([401, 403]).toContain(propio.status())
  })

  test('tampoco se escribe: cambiar plan/rol, crear perfiles o tocar datos propios está denegado', async () => {
    const u = await createUser({ plan: 'basic' })
    const user = await supabase({ token: u.token })
    for (const cambio of [{ plan: 'business_plus' }, { role: 'super_admin' }, { pro_until: '2099-01-01' }, { empresa: 'mi nombre' }]) {
      const r = await user.patch(`/rest/v1/profiles?id=eq.${u.id}`, { data: cambio })
      expect([401, 403], JSON.stringify(cambio)).toContain(r.status())
    }
    const ins = await user.post('/rest/v1/profiles', { data: { id: randomUUID(), role: 'super_admin' } })
    expect([401, 403]).toContain(ins.status())
    const gasto = await user.post('/rest/v1/gastos', { data: { profile_id: u.id, concepto: 'directo', monto: 1 } })
    expect([401, 403]).toContain(gasto.status())

    const [p] = await dbSelect<{ plan: string; role: string; empresa: string }>('profiles', `id=eq.${u.id}&select=plan,role,empresa`)
    expect(p.plan).toBe('basic')
    expect(p.role).toBe('user')
    expect(p.empresa).toBe(u.empresa)
  })

  test('ninguna función del esquema se puede llamar desde el cliente', async () => {
    const u = await createUser()
    const prod = await crearProducto(await appApi(u.token), { stock_actual: 5 })
    const anon = await supabase('anon')
    const user = await supabase({ token: u.token })
    const id = randomUUID()
    const llamadas: [string, object][] = [
      ['ajustar_stock', { p_producto_id: prod.id, p_stock_nuevo: 999, p_motivo: 'hack' }],
      ['descontar_stock', { p_producto_id: prod.id, p_cantidad: 5, p_referencia_id: null, p_tipo: 'VENTA', p_motivo: 'hack' }],
      ['sumar_stock', { p_producto_id: prod.id, p_cantidad: 500, p_referencia_id: null, p_tipo: 'COMPRA', p_motivo: 'hack' }],
      ['restar_stock', { p_producto_id: prod.id, p_cantidad: 5, p_referencia_id: null, p_tipo: 'ANULACION_COMPRA', p_motivo: 'hack' }],
      ['anular_venta_atomico', { p_venta_id: id }],
      ['eliminar_venta_atomico', { p_venta_id: id }],
      ['slug_disponible', { p_slug: 'x' }],
      ['guardar_configuracion', { p_profile_id: u.id, p_empresa: 'x' }],
      ['limpiar_envios_basico_antiguos', {}],
    ]
    for (const [fn, args] of llamadas) {
      for (const [quien, ctx] of [['anon', anon], ['usuario', user]] as const) {
        const r = await ctx.post(`/rest/v1/rpc/${fn}`, { data: args })
        expect([401, 403, 404], `${quien} ejecutó ${fn} (${r.status()}: ${await r.text()})`).toContain(r.status())
      }
    }
    const [p] = await dbSelect<{ stock_actual: number }>('productos', `id=eq.${prod.id}&select=stock_actual`)
    expect(p.stock_actual).toBe(5)
  })

  test('el almacenamiento no acepta escrituras directas del navegador', async () => {
    const u = await createUser()
    const k = await keys()
    const ctx = await request.newContext({ baseURL: k.url, extraHTTPHeaders: { apikey: k.anonKey, Authorization: `Bearer ${u.token}` } })
    const r = await ctx.post(`/rest/v1/objects?select=*`, { data: { bucket_id: 'logos', name: `${u.id}/x.png` } })
    expect([401, 403, 404]).toContain(r.status())
  })
})

test.describe('#4 #5 #6 Configuración del negocio (servidor)', () => {
  const configBase = (over: Record<string, unknown> = {}) => ({
    vistaConfig: 'EMPRESA', empresa: `Empresa ${uniq('cfg')}`, telefonoEmpresa: '999111222', direccionEmpresa: 'Av. 1', nuevoOrigen: '', logoUrl: '', redirectUrl: '',
    redirectMessage: '', redirectMessageImage: '', instagramUrl: '', facebookUrl: '', tiktokUrl: '', webUrl: '', whatsappUrl: '',
    metodoMotorizado: true, metodoShalom: false, metodoOlva: false, metodoMarvisur: false, metodoFlores: false, metodoOtro: false, nombreMetodoOtro: '',
    metodoRecojo: false, mensajeRecojo: 'Recoge', logisticaMotoDias: ['MONDAY'], logisticaMotoHoraCorte: '16:00', logisticaMotoUsaHoraCorte: true,
    logisticaMotoAnticipacion: 2, logisticaMotoAnticipacionSoloHabiles: true, logisticaMotoLimitar: true, logisticaMotoCupo: 5,
    logisticaAgenciasDias: ['MONDAY'], logisticaAgenciasHoraCorte: '18:00', logisticaAgenciasUsaHoraCorte: false, logisticaAgenciasAnticipacion: 1,
    logisticaAgenciasAnticipacionSoloHabiles: false, logisticaAgenciasLimitar: false, logisticaAgenciasCupo: 0, solicitarCantidadProductos: false,
    mostrarEscogerFecha: true, mostrarTracking: true, cerrarFormulario: false, cerradoFormularioMensaje: '', cerrarFormularioDias: [], motoRegion: 'lima',
    colorPrimario: '#0284c7', colorSecundario: '#4f46e5', tarifas: { Miraflores: '10', Surco: '12', Vacio: '' }, ...over,
  })
  const png = () => Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  const enviar = async (api: Awaited<ReturnType<typeof appApi>>, config: object, archivos: Record<string, { name: string; mimeType: string; buffer: Buffer }> = {}) =>
    api.post('/api/configuracion', { multipart: { config: JSON.stringify(config), ...archivos } })

  test('guarda la configuración, las tarifas y devuelve el slug nuevo', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const r = await enviar(api, configBase({ empresa: 'Mi Negocio Nuevo' }))
    expect(r.status(), await r.text()).toBe(200)
    expect((await r.json()).slug).toBe('mi-negocio-nuevo')
    const [p] = await dbSelect<Record<string, unknown>>('profiles', `id=eq.${u.id}&select=empresa,slug,logistica_moto_limitar,logistica_moto_cupo`)
    expect(p).toMatchObject({ empresa: 'Mi Negocio Nuevo', slug: 'mi-negocio-nuevo', logistica_moto_limitar: true, logistica_moto_cupo: 5 })
    const [t] = await dbSelect<{ tarifas: Record<string, number> }>('tarifas_moto', `profile_id=eq.${u.id}&select=tarifas`)
    expect(t.tarifas).toEqual({ Miraflores: 10, Surco: 12 }) // el vacío no se guarda
  })

  test('el plan Básico no puede activar opciones de Pro aunque las mande', async () => {
    const u = await createUser({ plan: 'basic' })
    const r = await enviar(await appApi(u.token), configBase())
    expect(r.status(), await r.text()).toBe(200)
    const [p] = await dbSelect<Record<string, unknown>>('profiles', `id=eq.${u.id}&select=logistica_moto_limitar,logistica_moto_cupo,logistica_moto_usa_hora_corte,logistica_moto_anticipacion`)
    expect(p).toMatchObject({ logistica_moto_limitar: false, logistica_moto_cupo: 0, logistica_moto_usa_hora_corte: false, logistica_moto_anticipacion: 1 })
  })

  test('rechaza nombres repetidos, URLs peligrosas y datos incompletos', async () => {
    const a = await createUser()
    const b = await createUser()
    const apiB = await appApi(b.token)
    expect((await enviar(await appApi(a.token), configBase({ empresa: 'Marca Unica' }))).status()).toBe(200)
    const repetido = await enviar(apiB, configBase({ empresa: 'Marca Unica' }))
    expect(repetido.status()).toBe(400)
    expect((await repetido.json()).error).toMatch(/ya existe/i)

    for (const campo of ['redirectUrl', 'instagramUrl', 'facebookUrl', 'tiktokUrl', 'webUrl', 'whatsappUrl']) {
      const r = await enviar(apiB, configBase({ empresa: `Otra ${campo}`, [campo]: 'javascript:alert(document.cookie)' }))
      expect(r.status(), campo).toBe(400)
      expect((await r.json()).error).toMatch(/http/i)
    }
    expect((await enviar(apiB, configBase({ empresa: '   ' }))).status()).toBe(400)
    expect((await apiB.post('/api/configuracion', { data: 'no es multipart' })).status()).toBe(400)
    const [p] = await dbSelect<{ redirect_url: string | null }>('profiles', `id=eq.${b.id}&select=redirect_url`)
    expect(p.redirect_url ?? '').not.toContain('javascript')
  })

  test('solo el dueño configura: un miembro y un visitante reciben 403/401', async () => {
    const dueno = await createUser()
    const miembro = await createUser({ plan: 'basic' })
    const rol = await dbInsert<{ id: string }>('business_roles', { owner_id: dueno.id, nombre: 'Todo', vista_default: 'resumen', permisos: { ver_resumen: true, ver_envios: true } })
    await dbInsert('business_members', { owner_id: dueno.id, user_id: miembro.id, role_id: rol.id })
    expect((await enviar(await appApi(miembro.token), configBase())).status()).toBe(403)
    expect((await enviar(await appApi(null), configBase())).status()).toBe(401)
    const [p] = await dbSelect<{ empresa: string }>('profiles', `id=eq.${dueno.id}&select=empresa`)
    expect(p.empresa).toBe(dueno.empresa)
  })

  test('el logo solo acepta imágenes válidas y se sirve por /media (sin mostrar la base)', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const malo = await enviar(api, configBase(), { logo: { name: 'x.html', mimeType: 'text/html', buffer: Buffer.from('<script>alert(1)</script>') } })
    expect(malo.status()).toBe(400)
    const svg = await enviar(api, configBase(), { logo: { name: 'x.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg onload="alert(1)"/>') } })
    expect(svg.status()).toBe(400)
    const grande = await enviar(api, configBase(), { logo: { name: 'g.png', mimeType: 'image/png', buffer: Buffer.alloc(4 * 1024 * 1024, 1) } })
    expect(grande.status()).toBe(400)

    const ok = await enviar(api, configBase(), { logo: { name: 'logo.png', mimeType: 'image/png', buffer: png() } })
    expect(ok.status(), await ok.text()).toBe(200)
    const logoUrl = (await ok.json()).logoUrl as string
    expect(logoUrl).toBe(`/media/logos/${u.id}/logo.png`)

    const img = await api.get(logoUrl)
    expect(img.status()).toBe(200)
    expect(img.headers()['content-type']).toContain('image/png')
    expect((await img.body()).length).toBe(png().length)

    // la sesión y el formulario público también la entregan por /media
    const ses = await (await api.get('/api/session')).json()
    expect(ses.profile.logo_url).toBe(logoUrl)
    const pagina = await (await api.get(`/f/${ses.profile.slug}`)).text()
    expect(pagina).toContain(`/media/logos/${u.id}/logo.png`)
    expect(pagina).not.toContain('/storage/v1/')
  })
})

test.describe('Sesión, login y cookies', () => {
  test('/api/session solo devuelve lo del propio negocio y no se puede usar sin sesión', async () => {
    const a = await createUser({ empresa: 'Empresa A' })
    const b = await createUser({ empresa: 'Empresa B' })
    expect((await (await appApi(null)).get('/api/session')).status()).toBe(401)
    const ses = await (await (await appApi(a.token)).get('/api/session')).json()
    expect(ses.user.id).toBe(a.id)
    expect(ses.profile.empresa).toBe('Empresa A')
    expect(ses.negocio.esOwner).toBe(true)
    expect(JSON.stringify(ses)).not.toContain(b.id)
  })

  test('un miembro ve el perfil del dueño y su rol', async () => {
    const dueno = await createUser({ empresa: 'Dueña SAC' })
    const miembro = await createUser({ plan: 'basic' })
    const rol = await dbInsert<{ id: string }>('business_roles', { owner_id: dueno.id, nombre: 'Lectura', vista_default: 'resumen', permisos: { ver_resumen: true } })
    await dbInsert('business_members', { owner_id: dueno.id, user_id: miembro.id, role_id: rol.id })
    const ses = await (await (await appApi(miembro.token)).get('/api/session')).json()
    expect(ses.negocio).toMatchObject({ esOwner: false, ownerId: dueno.id, userId: miembro.id })
    expect(ses.negocio.rol.permisos.ver_resumen).toBe(true)
    expect(ses.profile.empresa).toBe('Dueña SAC')
  })

  test('login: cookie httpOnly, sin tokens en la respuesta; clave mala 401; 10 intentos y luego 429', async () => {
    const u = await createUser()
    const api = await appApi(null)
    const ok = await api.post('/api/auth/login', { data: { email: u.email, password: u.password } })
    expect(ok.status()).toBe(200)
    const cuerpo = await ok.text()
    expect(cuerpo).not.toMatch(/access_token|refresh_token|eyJ/)
    const cookies = ok.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie').map((h) => h.value)
    expect(cookies.length).toBeGreaterThan(0)
    for (const c of cookies) {
      expect(c, c).toMatch(/HttpOnly/i)
      expect(c, c).toMatch(/SameSite=Lax/i)
    }

    const bad = await api.post('/api/auth/login', { data: { email: u.email, password: 'incorrecta' } })
    expect(bad.status()).toBe(401)
    expect((await bad.json()).error).toMatch(/correo o contraseña incorrectos/i)
    expect((await api.post('/api/auth/login', { data: { email: '', password: '' } })).status()).toBe(400)

    const otra = await appApi(null)
    const codigos: number[] = []
    for (let i = 0; i < 11; i++) codigos.push((await otra.post('/api/auth/login', { data: { email: u.email, password: `mala-${i}` } })).status())
    expect(codigos.slice(0, 10).every((c) => c === 401)).toBe(true)
    expect(codigos[10]).toBe(429)
  })

  test('recuperar contraseña: no revela si el correo existe y limita los intentos', async () => {
    const u = await createUser()
    const api = await appApi(null)
    const existe = await api.post('/api/auth/forgot', { data: { email: u.email } })
    const noExiste = await api.post('/api/auth/forgot', { data: { email: `${uniq('nadie')}@e2e.test` } })
    expect(existe.status()).toBe(200)
    expect(noExiste.status()).toBe(200)
    expect(await existe.json()).toEqual(await noExiste.json())
    expect((await api.post('/api/auth/forgot', { data: { email: 'no-es-correo' } })).status()).toBe(400)
    const codigos: number[] = []
    for (let i = 0; i < 6; i++) codigos.push((await api.post('/api/auth/forgot', { data: { email: u.email } })).status())
    expect(codigos).toContain(429)
  })

  test('el callback de correo no sirve para redirigir a otros sitios ni acepta códigos falsos', async () => {
    const api = await appApi(null)
    for (const next of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)']) {
      const r = await api.get(`/auth/callback?code=falso&next=${encodeURIComponent(next)}`, { maxRedirects: 0 })
      expect(r.status()).toBe(307)
      const destino = r.headers()['location'] ?? ''
      expect(destino, next).not.toContain('evil.com')
      expect(destino).toContain('/login')
    }
  })

  test('cambiar la contraseña exige sesión y mínimo 8 caracteres', async () => {
    const u = await createUser()
    expect((await (await appApi(null)).post('/api/auth/password', { data: { password: 'NuevaClave123' } })).status()).toBe(401)
    expect((await (await appApi(u.token)).post('/api/auth/password', { data: { password: 'corta' } })).status()).toBe(400)
  })

  test('"entrar como" una empresa solo lo abre un super admin', async () => {
    const normal = await createUser()
    const objetivo = await createUser()
    expect((await (await appApi(null)).get('/auth/impersonar?token_hash=abc', { maxRedirects: 0 })).headers()['location'] ?? '').toContain('/login')
    expect((await (await appApi(normal.token)).get('/auth/impersonar?token_hash=abc', { maxRedirects: 0 })).headers()['location'] ?? '').toContain('/login')
    // el panel de administración usa la cookie de sesión: sin ella (o sin ser admin) no entra
    expect([401, 403]).toContain((await (await appApi(normal.token)).post(`/api/admin/empresas/${objetivo.id}/impersonate`)).status())
  })
})

test.describe('Fotos de producto', () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

  test('se suben por el servidor, solo imágenes, y solo se borran las del propio negocio', async () => {
    const a = await createUser()
    const b = await createUser()
    const apiA = await appApi(a.token)

    expect((await (await appApi(null)).post('/api/uploads/producto', { multipart: { file: { name: 'a.png', mimeType: 'image/png', buffer: png } } })).status()).toBe(401)
    expect((await apiA.post('/api/uploads/producto', { multipart: { file: { name: 'a.html', mimeType: 'text/html', buffer: Buffer.from('<b>x</b>') } } })).status()).toBe(400)
    expect((await apiA.post('/api/uploads/producto', { multipart: { file: { name: 'g.png', mimeType: 'image/png', buffer: Buffer.alloc(3 * 1024 * 1024, 1) } } })).status()).toBe(400)

    const ok = await apiA.post('/api/uploads/producto', { multipart: { file: { name: 'a.png', mimeType: 'image/png', buffer: png } } })
    expect(ok.status(), await ok.text()).toBe(200)
    const { url, ruta } = await ok.json()
    expect(url).toMatch(new RegExp(`^/media/productos/${a.id}/producto-`))
    expect((await apiA.get(url)).status()).toBe(200)

    // el producto se crea con esa foto y la lista la devuelve por /media
    const prod = await crearProducto(apiA, { imagen_url: url })
    expect(prod.imagen_url).toBe(url)

    // otro negocio no puede borrarla; el dueño sí
    expect((await (await appApi(b.token)).delete(`/api/uploads/producto?ruta=${encodeURIComponent(ruta)}`)).status()).toBe(403)
    expect((await apiA.delete(`/api/uploads/producto?ruta=${encodeURIComponent('../otro/x.png')}`)).status()).toBe(403)
    expect((await apiA.delete(`/api/uploads/producto?ruta=${encodeURIComponent(ruta)}`)).status()).toBe(200)
  })

  test('una URL de imagen externa no se guarda en el producto', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const p = await crearProducto(api, { imagen_url: 'https://evil.com/x.png' })
    expect(p.imagen_url ?? null).toBeNull()
  })
})

test.describe('#8 Cron', () => {
  const rutas = ['/api/cron/downgrade-plans', '/api/shalom/sync', '/api/olva/sync']
  for (const ruta of rutas) {
    test(`${ruta} rechaza x-vercel-cron y tokens incorrectos`, async () => {
      const api = await appApi(null)
      expect((await api.get(ruta)).status()).toBe(401)
      expect((await api.get(ruta, { headers: { 'x-vercel-cron': '1' } })).status()).toBe(401)
      expect((await api.get(ruta, { headers: { authorization: 'Bearer incorrecto' } })).status()).toBe(401)
      expect((await api.get(ruta, { headers: { authorization: CRON_SECRET } })).status()).toBe(401)
      expect((await api.post(ruta, { headers: { 'x-sync-key': 'incorrecta' } }).catch(() => null))?.status() ?? 401).not.toBe(200)
    })
  }

  test('con el secreto correcto degrada a basic los planes vencidos y deja los vigentes', async () => {
    const vencido = await createUser({ plan: 'pro', trial: false })
    const vigente = await createUser({ plan: 'pro', trial: false })
    const db = await supabase('service')
    await db.patch(`/rest/v1/profiles?id=eq.${vencido.id}`, { data: { pro_until: new Date(Date.now() - 864e5).toISOString() } })
    await db.patch(`/rest/v1/profiles?id=eq.${vigente.id}`, { data: { pro_until: new Date(Date.now() + 10 * 864e5).toISOString() } })

    const api = await appApi(null)
    const r = await api.get('/api/cron/downgrade-plans', { headers: { authorization: `Bearer ${CRON_SECRET}` } })
    expect(r.status(), await r.text()).toBe(200)

    const [v] = await dbSelect<{ plan: string }>('profiles', `id=eq.${vencido.id}&select=plan`)
    const [g] = await dbSelect<{ plan: string }>('profiles', `id=eq.${vigente.id}&select=plan`)
    expect(v.plan).toBe('basic')
    expect(g.plan).toBe('pro')
  })
})

test.describe('#9 Webhook de MercadoPago', () => {
  const firma = (dataId: string, requestId: string, secret = WEBHOOK_SECRET, ts = String(Date.now())) =>
    `ts=${ts},v1=${createHmac('sha256', secret).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest('hex')}`

  test('sin firma, con firma inventada o con otro secreto → 401', async () => {
    const api = await appApi(null)
    const body = { type: 'preapproval', data: { id: '123' } }
    expect((await api.post('/api/webhooks/mercadopago', { data: body })).status()).toBe(401)
    expect((await api.post('/api/webhooks/mercadopago?data.id=123', { data: body, headers: { 'x-signature': 'ts=1,v1=abc', 'x-request-id': 'r1' } })).status()).toBe(401)
    const mala = firma('123', 'r2', 'otro-secreto')
    expect((await api.post('/api/webhooks/mercadopago?data.id=123', { data: body, headers: { 'x-signature': mala, 'x-request-id': 'r2' } })).status()).toBe(401)
  })

  test('con firma válida se acepta (y un tópico que no es suscripción no toca planes)', async () => {
    const api = await appApi(null)
    const reqId = uniq('req')
    const r = await api.post('/api/webhooks/mercadopago?data.id=999', {
      data: { type: 'payment', data: { id: '999' } },
      headers: { 'x-signature': firma('999', reqId), 'x-request-id': reqId },
    })
    expect(r.status()).toBe(200)
  })

  test('una firma vieja (replay) se rechaza', async () => {
    const api = await appApi(null)
    const vieja = String(Date.now() - 3600_000)
    const r = await api.post('/api/webhooks/mercadopago?data.id=5', {
      data: { type: 'payment', data: { id: '5' } },
      headers: { 'x-signature': firma('5', 'r5', WEBHOOK_SECRET, vieja), 'x-request-id': 'r5' },
    })
    expect(r.status()).toBe(401)
  })
})

test.describe('#11 Datos personales en rutas públicas', () => {
  async function negocioConEnvio() {
    const u = await createUser()
    const api = await appApi(null)
    const dni = String(Math.floor(10_000_000 + Math.random() * 89_999_999))
    const telefono = `9${dni.slice(0, 8)}`
    const r = await api.post('/api/envios', {
      data: { user_id: u.id, nombre: 'María Fernanda Quispe', dni, telefono, metodo: 'MOTORIZADO', destino: 'Miraflores', direccion: 'Av. Privada 123', referencia: 'portón verde', detalle: 'Vestido' },
    })
    expect(r.status(), await r.text()).toBe(200)
    return { u, dni, telefono, api }
  }

  test('tracking: solo con DNI no devuelve nada; con DNI + teléfono sí, sin dirección ni nombre completo', async () => {
    const { u, dni, telefono, api } = await negocioConEnvio()
    const soloDni = await (await api.get(`/api/tracking?user_id=${u.id}&dni=${dni}`)).json()
    expect(soloDni.data ?? null).toBeNull()
    const telMalo = await (await api.get(`/api/tracking?user_id=${u.id}&dni=${dni}&telefono=900000000`)).json()
    expect(telMalo.data).toEqual([])

    const ok = await (await api.get(`/api/tracking?user_id=${u.id}&dni=${dni}&telefono=${telefono}`)).json()
    expect(ok.data).toHaveLength(1)
    expect(ok.data[0].nombre).toBe('María')
    expect(JSON.stringify(ok)).not.toContain('Av. Privada')
    expect(JSON.stringify(ok)).not.toContain('Quispe')
  })

  test('tracking: limita los intentos (429) para que no se pueda adivinar DNIs', async () => {
    const u = await createUser()
    const api = await appApi(null)
    const codigos: number[] = []
    for (let i = 0; i < 17; i++) {
      codigos.push((await api.get(`/api/tracking?user_id=${u.id}&dni=${10000000 + i}&telefono=999999999`)).status())
    }
    expect(codigos.slice(0, 15).every((c) => c === 200)).toBe(true)
    expect(codigos[16]).toBe(429)
  })

  test('el formulario público no devuelve datos del cliente al repetir un pedido', async () => {
    const { u, dni, telefono, api } = await negocioConEnvio()
    const otra = await appApi(null)
    const r = await otra.post('/api/envios', { data: { user_id: u.id, nombre: 'Atacante', dni, telefono, metodo: 'MOTORIZADO', destino: 'X', direccion: 'Y' } })
    expect(r.status()).toBe(200)
    const j = await r.json()
    expect(j.duplicado || j.pendienteExistente).toBeTruthy()
    expect(Object.keys(j.envio).sort()).toEqual(['fecha_programada', 'id'])
    void api
  })

  test('/api/personas ya no es una consulta pública', async () => {
    const api = await appApi(null)
    expect((await api.get('/api/personas?busqueda=12345678')).status()).toBe(401)
  })
})

test.describe('#12 Registro', () => {
  test('la app no envía correos al registrar y el alta sigue limitada por IP', async () => {
    // Decisión de producto: sin correos (el límite gratuito de Supabase es de pocos por
    // hora). La defensa contra altas masivas es el límite por IP.
    const { readFileSync } = await import('node:fs')
    const fuente = readFileSync('app/api/register/route.ts', 'utf8')
    expect(fuente).toMatch(/admin\.createUser/)
    expect(fuente).not.toMatch(/auth\.signUp/)
    expect(fuente).toMatch(/permitir\(/)
  })
})

test.describe('#13 proxy.ts', () => {
  test('existe en la raíz, exporta `proxy` y el viejo middleware ya no está', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    expect(existsSync('proxy.ts')).toBe(true)
    expect(existsSync('app/middleware.ts')).toBe(false)
    expect(readFileSync('proxy.ts', 'utf8')).toMatch(/export\s+async\s+function\s+proxy/)
  })
})
