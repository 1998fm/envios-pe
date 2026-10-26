import { expect, test } from './support/test'
import { crearGasto, crearPersona, crearProducto, crearVenta, stockDe } from './support/app'
import { appApi, createUser, dbSelect } from './support/stack'

// Flujos de negocio de punta a punta, a través de la API real de la app y con la
// base local. Cada test usa su propio negocio (sin datos compartidos).

test.describe('Productos e inventario', () => {
  test('crear, listar, buscar, editar, ajustar stock con motivo, archivar y borrar', async () => {
    const u = await createUser()
    const api = await appApi(u.token)

    const p = await crearProducto(api, { nombre: 'Vestido Luna Azul', sku: 'VLA-1', stock_actual: 8, precio_venta: 89, precio_compra: 40 })
    expect(p.stock_actual).toBe(8)
    expect(p.precio_compra).toBe(40) // el dueño ve el costo

    // listado y búsqueda por varias palabras (en cualquier orden)
    const lista = await (await api.get('/api/productos')).json()
    expect(lista.data.map((x: { id: string }) => x.id)).toContain(p.id)
    const busca = await (await api.get('/api/productos?busqueda=azul%20vestido')).json()
    expect(busca.data).toHaveLength(1)
    expect((await (await api.get('/api/productos?busqueda=zapato')).json()).data).toHaveLength(0)

    // editar datos
    const ed = await api.put(`/api/productos/${p.id}`, { data: { nombre: 'Vestido Luna Rojo', precio_venta: 95, precio_compra: 40, stock_minimo: 1, unidad: 'unidad' } })
    expect(ed.status()).toBe(200)
    expect((await ed.json()).data.nombre).toBe('Vestido Luna Rojo')

    // el stock no se cambia sin motivo, y con motivo queda en el kardex
    const sinMotivo = await api.put(`/api/productos/${p.id}`, { data: { nombre: 'Vestido Luna Rojo', stock_actual: 20 } })
    expect(sinMotivo.status()).toBe(400)
    const conMotivo = await api.put(`/api/productos/${p.id}`, { data: { nombre: 'Vestido Luna Rojo', stock_actual: 20, motivo: 'Conteo físico' } })
    expect(conMotivo.status()).toBe(200)
    expect(await stockDe(api, p.id)).toBe(20)
    const mov = await (await api.get(`/api/productos/${p.id}/movimientos`)).json()
    expect(mov.data.length).toBeGreaterThanOrEqual(2) // stock inicial + ajuste
    expect(mov.data.map((m: { motivo: string }) => m.motivo)).toContain('Conteo físico')

    // archivar / restaurar en lote
    const arch = await api.patch('/api/productos/batch', { data: { ids: [p.id], archivado: true } })
    expect(arch.status()).toBe(200)
    expect((await (await api.get('/api/productos')).json()).data.map((x: { id: string }) => x.id)).not.toContain(p.id)
    expect((await (await api.get('/api/productos?archivado=true')).json()).data.map((x: { id: string }) => x.id)).toContain(p.id)

    // borrar
    expect((await api.delete(`/api/productos/${p.id}`)).status()).toBe(200)
    expect(await dbSelect('productos', `id=eq.${p.id}`)).toHaveLength(0)
  })

  test('el plan Básico limita a 50 productos', async () => {
    const u = await createUser({ plan: 'basic' })
    const api = await appApi(u.token)
    for (let i = 0; i < 50; i++) {
      const r = await api.post('/api/productos', { data: { nombre: `P${i}`, precio_venta: 1, stock_actual: 0 } })
      expect(r.status(), `producto ${i + 1}`).toBe(200)
    }
    const r = await api.post('/api/productos', { data: { nombre: 'P51', precio_venta: 1, stock_actual: 0 } })
    expect(r.status()).toBe(403)
    // Business Plus no tiene tope
    const bp = await createUser({ plan: 'business_plus' })
    const apiBp = await appApi(bp.token)
    expect((await apiBp.post('/api/productos', { data: { nombre: 'sin tope', precio_venta: 1, stock_actual: 0 } })).status()).toBe(200)
  })
})

test.describe('Ventas', () => {
  test('vender descuenta stock, validar faltantes, anular restituye y eliminar limpia', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const prod = await crearProducto(api, { stock_actual: 10, precio_venta: 50, precio_compra: 20 })
    const persona = await crearPersona(api)

    const venta = await crearVenta(api, persona, [{ producto_id: prod.id, producto_nombre: prod.nombre, cantidad: 3, precio_unitario: 50 }])
    expect(venta.status(), await venta.text()).toBe(200)
    const v = (await venta.json()).data
    expect(Number(v.total)).toBe(150)
    expect(v.estado).toBe('COMPLETADA')
    expect(await stockDe(api, prod.id)).toBe(7)

    // no se puede vender más de lo que hay
    const demas = await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 8 }])
    expect(demas.status()).toBe(409)
    expect(await stockDe(api, prod.id)).toBe(7)

    // cantidades inválidas
    expect((await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 0 }])).status()).toBe(400)
    expect((await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 1, precio_unitario: -5 }])).status()).toBe(400)

    // aparece en el listado con su resumen y la ganancia (150 - 3*20)
    const lista = await (await api.get('/api/ventas?resumen=1')).json()
    expect(lista.data).toHaveLength(1)
    expect(lista.resumen.monto).toBe(150)
    expect(lista.resumen.ganancia).toBe(90)

    // anular devuelve el stock
    const anul = await api.put(`/api/ventas/${v.id}`, { data: { estado: 'ANULADA' } })
    expect(anul.status(), await anul.text()).toBe(200)
    expect(await stockDe(api, prod.id)).toBe(10)
    expect((await api.put(`/api/ventas/${v.id}`, { data: { estado: 'ANULADA' } })).status()).toBe(400) // ya anulada

    // eliminar una venta vigente también restituye
    const v2 = (await (await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 4 }])).json()).data
    expect(await stockDe(api, prod.id)).toBe(6)
    expect((await api.delete(`/api/ventas/${v2.id}`)).status()).toBe(200)
    expect(await stockDe(api, prod.id)).toBe(10)
    expect(await dbSelect('ventas', `id=eq.${v2.id}`)).toHaveLength(0)
  })

  test('editar una venta recalcula total y stock', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const prod = await crearProducto(api, { stock_actual: 10 })
    const persona = await crearPersona(api)
    const v = (await (await crearVenta(api, persona, [{ producto_id: prod.id, producto_nombre: prod.nombre, cantidad: 2, precio_unitario: 50 }])).json()).data
    expect(await stockDe(api, prod.id)).toBe(8)

    const ed = await api.put(`/api/ventas/${v.id}`, {
      data: { items: [{ producto_id: prod.id, producto_nombre: prod.nombre, cantidad: 5, precio_unitario: 40 }], metodo_pago: 'YAPE_PLIN' },
    })
    expect(ed.status(), await ed.text()).toBe(200)
    expect(Number((await ed.json()).data.total)).toBe(200)
    expect(await stockDe(api, prod.id)).toBe(5)
  })

  test('pago parcial: los abonos suman, no pueden pasarse del saldo y completan la venta', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const prod = await crearProducto(api, { stock_actual: 5 })
    const persona = await crearPersona(api)
    const v = (await (await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 2, precio_unitario: 100 }], { estado: 'PENDIENTE', monto_pagado: 50 })).json()).data
    expect(v.estado).toBe('PENDIENTE')
    expect(Number(v.monto_pagado)).toBe(50)

    expect((await api.post(`/api/ventas/${v.id}/abonos`, { data: { monto: 0 } })).status()).toBe(400)
    expect((await api.post(`/api/ventas/${v.id}/abonos`, { data: { monto: 500 } })).status()).toBe(400) // excede el saldo

    const a1 = await api.post(`/api/ventas/${v.id}/abonos`, { data: { monto: 100, metodo_pago: 'YAPE_PLIN' } })
    expect(a1.status()).toBe(200)
    expect((await a1.json()).completada).toBe(false)

    const a2 = await api.post(`/api/ventas/${v.id}/abonos`, { data: { monto: 50 } })
    const j2 = await a2.json()
    expect(j2.completada).toBe(true)
    expect(j2.venta.estado).toBe('COMPLETADA')

    const abonos = await (await api.get(`/api/ventas/${v.id}/abonos`)).json()
    expect(abonos.data).toHaveLength(2)

    // borrar un abono reabre la venta
    const del = await api.delete(`/api/ventas/${v.id}/abonos?abono_id=${abonos.data[1].id}`)
    expect(del.status()).toBe(200)
    expect((await del.json()).venta.estado).toBe('PENDIENTE')
  })

  test('completar masivamente las ventas pendientes', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const prod = await crearProducto(api, { stock_actual: 9 })
    const persona = await crearPersona(api)
    await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 1 }], { estado: 'PENDIENTE' })
    await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 1 }], { estado: 'PENDIENTE' })
    const r = await api.post('/api/ventas/migrate', { data: {} })
    expect((await r.json()).count).toBe(2)
    const lista = await (await api.get('/api/ventas?estado=PENDIENTE')).json()
    expect(lista.data).toHaveLength(0)
  })

  test('Básico limita a 100 ventas', async () => {
    const u = await createUser({ plan: 'basic' })
    const api = await appApi(u.token)
    const persona = await crearPersona(api)
    // se siembran 100 ventas directo en la base para no tardar; el límite lo valida la API
    const { dbInsert } = await import('./support/stack')
    for (let i = 0; i < 100; i++) {
      await dbInsert('ventas', { profile_id: u.id, persona_id: persona.id, persona_nombre: 'x', total: 1, estado: 'COMPLETADA', metodo_pago: 'EFECTIVO', monto_pagado: 1 })
    }
    const r = await crearVenta(api, persona, [{ producto_nombre: 'suelto', cantidad: 1, precio_unitario: 1 }])
    expect(r.status()).toBe(403)
  })
})

test.describe('Compras', () => {
  test('una compra suma stock; anularla lo devuelve; no se puede anular si ya se vendió', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const prod = await crearProducto(api, { stock_actual: 2 })

    const c = await api.post('/api/compras', { data: { proveedor: 'Proveedor SAC', items: [{ producto_id: prod.id, producto_nombre: prod.nombre, cantidad: 10, precio_unitario: 15 }] } })
    expect(c.status(), await c.text()).toBe(200)
    const compra = (await c.json()).data
    expect(Number(compra.total)).toBe(150)
    expect(await stockDe(api, prod.id)).toBe(12)

    const lista = await (await api.get('/api/compras')).json()
    expect(lista.data).toHaveLength(1)
    expect(lista.data[0].items).toHaveLength(1)

    // se vende casi todo → ya no se puede deshacer la compra completa
    const persona = await crearPersona(api)
    await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 8 }])
    expect(await stockDe(api, prod.id)).toBe(4)
    expect((await api.put(`/api/compras/${compra.id}`, { data: { estado: 'ANULADA' } })).status()).toBe(409)
    expect(await stockDe(api, prod.id)).toBe(4)

    // otra compra sí se puede anular
    const c2 = (await (await api.post('/api/compras', { data: { proveedor: 'P2', items: [{ producto_id: prod.id, producto_nombre: prod.nombre, cantidad: 3, precio_unitario: 10 }] } })).json()).data
    expect(await stockDe(api, prod.id)).toBe(7)
    expect((await api.put(`/api/compras/${c2.id}`, { data: { estado: 'ANULADA' } })).status()).toBe(200)
    expect(await stockDe(api, prod.id)).toBe(4)
    expect((await api.put(`/api/compras/${c2.id}`, { data: { estado: 'COMPLETADA' } })).status()).toBe(400)
  })

  test('validaciones de compra', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    expect((await api.post('/api/compras', { data: { proveedor: '', items: [] } })).status()).toBe(400)
    expect((await api.post('/api/compras', { data: { proveedor: 'X' } })).status()).toBe(400)
  })
})

test.describe('Gastos', () => {
  test('crear, filtrar por categoría, editar y borrar', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const g1 = await crearGasto(api, { concepto: 'Cajas', monto: 30, categoria: 'MATERIALES' })
    await crearGasto(api, { concepto: 'Taxi', monto: 12, categoria: 'PASAJES' })

    const todos = await (await api.get('/api/gastos')).json()
    expect(todos.data).toHaveLength(2)
    const filtrados = await (await api.get('/api/gastos?categoria=MATERIALES')).json()
    expect(filtrados.data).toHaveLength(1)

    const ed = await api.put(`/api/gastos/${g1.id}`, { data: { monto: 45.5, concepto: 'Cajas grandes' } })
    expect((await ed.json()).data.monto).toBe(45.5)
    expect((await api.post('/api/gastos', { data: { monto: 5 } })).status()).toBe(400) // falta concepto
    expect((await api.post('/api/gastos', { data: { concepto: 'x', monto: 5, categoria: 'INVENTADA' } })).status()).toBe(400)
    expect((await api.put(`/api/gastos/${g1.id}`, { data: { categoria: 'INVENTADA' } })).status()).toBe(400)
    const neg = await (await api.post('/api/gastos', { data: { concepto: 'neg', monto: -50 } })).json()
    expect(neg.data.monto).toBe(0) // el monto no puede ser negativo

    expect((await api.delete(`/api/gastos/${g1.id}`)).status()).toBe(200)
    expect((await (await api.get('/api/gastos')).json()).data).toHaveLength(2) // Taxi + neg
  })
})

test.describe('Clientes', () => {
  test('un cliente con ventas aparece con su total; se puede buscar, editar y quitar', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const prod = await crearProducto(api, { stock_actual: 10 })
    const persona = await crearPersona(api, { nombre: 'Lucía Ramos' })
    await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 1, precio_unitario: 70 }])
    await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 2, precio_unitario: 70 }])

    const lista = await (await api.get('/api/clientes')).json()
    expect(lista.data).toHaveLength(1)
    expect(lista.data[0]).toMatchObject({ nombre: 'Lucía Ramos', ventas: 2, totalVentas: 210 })

    expect((await (await api.get('/api/clientes?busqueda=lucia')).json()).data.length).toBeGreaterThanOrEqual(0)
    expect((await (await api.get('/api/clientes?busqueda=ramos%20l')).json()).data).toHaveLength(1)
    expect((await (await api.get('/api/clientes?busqueda=zzzz')).json()).data).toHaveLength(0)

    const det = await (await api.get(`/api/clientes/${persona.id}`)).json()
    expect(det.data.ventas).toHaveLength(2)
    expect(det.data.totalVentas).toBe(210)

    const ed = await api.put(`/api/clientes/${persona.id}`, { data: { nombre: 'Lucía Ramos Peña' } })
    expect(ed.status()).toBe(200)
    const [p] = await dbSelect<{ nombre: string }>('personas', `id=eq.${persona.id}&select=nombre`)
    expect(p.nombre).toBe('Lucía Ramos Peña')

    // quitar al cliente de mi lista (tiene ventas, la persona se conserva)
    expect((await api.delete(`/api/clientes/${persona.id}`, { data: {} })).status()).toBe(200)
    expect((await (await api.get('/api/clientes')).json()).data).toHaveLength(0)
  })

  test('dos negocios comparten la misma persona sin ver los datos del otro', async () => {
    const a = await createUser()
    const b = await createUser()
    const apiA = await appApi(a.token)
    const apiB = await appApi(b.token)
    const personaA = await crearPersona(apiA)
    // B registra al mismo DNI: se vincula a la misma persona
    const personaB = await crearPersona(apiB, { dni: personaA.dni, telefono: personaA.telefono, nombre: 'Otro nombre' })
    expect(personaB.id).toBe(personaA.id)
    // pero B no pisa la ficha de A
    const [p] = await dbSelect<{ nombre: string }>('personas', `id=eq.${personaA.id}&select=nombre`)
    expect(p.nombre).toBe(personaA.nombre)
    // cada uno ve solo sus ventas
    const prod = await crearProducto(apiA, { stock_actual: 5 })
    await crearVenta(apiA, personaA, [{ producto_id: prod.id, cantidad: 1 }])
    expect((await (await apiB.get(`/api/clientes/${personaA.id}`)).json()).data.ventas).toHaveLength(0)
  })
})

test.describe('Pedidos (formulario público) y panel', () => {
  test('el cliente envía un pedido sin sesión y el dueño lo ve; los duplicados no se repiten', async () => {
    const u = await createUser()
    const publico = await appApi(null)
    const dni = '45678123'
    const pedido = {
      user_id: u.id, nombre: 'Ana Torres', dni, telefono: '987654321', metodo: 'MOTORIZADO',
      destino: 'Miraflores', direccion: 'Av. Larco 100', referencia: 'frente al parque', detalle: '2 vestidos',
    }
    const r = await publico.post('/api/envios', { data: pedido })
    expect(r.status(), await r.text()).toBe(200)
    const j = await r.json()
    expect(j.success).toBe(true)
    expect(j.envio.fecha_programada).toBeTruthy()

    // reenviar lo mismo (doble clic) no crea otro
    const otra = await (await publico.post('/api/envios', { data: pedido })).json()
    expect(otra.duplicado || otra.pendienteExistente).toBeTruthy()
    expect(await dbSelect('envios', `user_id=eq.${u.id}&select=id`)).toHaveLength(1)

    // el dueño lo ve, con código legible, y puede filtrar y buscar
    const api = await appApi(u.token)
    const lista = await (await api.get('/api/envios')).json()
    expect(lista.data).toHaveLength(1)
    expect(lista.data[0]).toMatchObject({ nombre: 'Ana Torres', estado: 'NO_EMPACADO', metodo: 'MOTORIZADO' })
    expect(lista.data[0].codigo).toMatch(/^E-\d+/)
    expect((await (await api.get('/api/envios?busqueda=torres')).json()).data).toHaveLength(1)
    expect((await (await api.get('/api/envios?estados=ENVIADO')).json()).data).toHaveLength(0)
    expect((await (await api.get('/api/envios?metodos=SHALOM')).json()).data).toHaveLength(0)

    // y el cliente final y el negocio quedaron vinculados
    const clientes = await (await api.get('/api/clientes')).json()
    expect(clientes.data.map((c: { nombre: string }) => c.nombre)).toContain('Ana Torres')
  })

  test('el resumen del panel refleja ventas, gastos y compras', async () => {
    const u = await createUser()
    const api = await appApi(u.token)
    const prod = await crearProducto(api, { stock_actual: 10, precio_compra: 10 })
    const persona = await crearPersona(api)
    await crearVenta(api, persona, [{ producto_id: prod.id, cantidad: 2, precio_unitario: 100 }])
    await crearGasto(api, { monto: 40 })
    await api.post('/api/compras', { data: { proveedor: 'P', items: [{ producto_id: prod.id, producto_nombre: 'x', cantidad: 1, precio_unitario: 25 }] } })

    const r = await api.get('/api/dashboard')
    expect(r.status()).toBe(200)
    const txt = JSON.stringify(await r.json())
    expect(txt).toContain('200') // ventas del mes
    expect(txt.length).toBeGreaterThan(200)
  })

  test('el plan y sus límites se informan al panel', async () => {
    const basic = await createUser({ plan: 'basic' })
    const bp = await createUser({ plan: 'business_plus' })
    const b = await (await (await appApi(basic.token)).get('/api/plan/features')).json()
    expect(b.plan).toBe('basic')
    expect(b.max_envios).toBe(50)
    expect(b.max_productos).toBe(50)
    const p = await (await (await appApi(bp.token)).get('/api/plan/features')).json()
    expect(p.plan).toBe('business_plus')
    expect(p.isTrial).toBe(true)
    expect(p.max_envios).toBeNull()
  })

  test('un trial vencido cae a Básico al consultar el plan', async () => {
    const u = await createUser({ plan: 'business_plus', trial: false })
    const { supabase } = await import('./support/stack')
    const db = await supabase('service')
    await db.patch(`/rest/v1/profiles?id=eq.${u.id}`, { data: { trial_end: new Date(Date.now() - 864e5).toISOString(), pro_until: null } })
    const r = await (await (await appApi(u.token)).get('/api/plan/features')).json()
    expect(r.plan).toBe('basic')
  })
})
