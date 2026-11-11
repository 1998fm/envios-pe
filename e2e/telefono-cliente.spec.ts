import { test, expect } from './support/test'
import { appApi, createUser, dbInsert, dbSelect, supabase } from './support/stack'
import { crearProducto, crearVenta } from './support/app'

test('WhatsApp: reutiliza cliente antiguo y enlaza ventas aunque cambie el nombre', async () => {
  const u = await createUser()
  const api = await appApi(u.token)
  const publico = await appApi(null)
  const persona = await dbInsert<{ id: string }>('personas', { nombre: 'lisbeth alvino', telefono: '981 307 304' })
  await dbInsert('cliente_de', { persona_id: persona.id, profile_id: u.id })
  const encontrado = await api.get('/api/personas?busqueda=981307304')
  expect((await encontrado.json()).data.id).toBe(persona.id)
  const prod = await crearProducto(api)
  const venta = await crearVenta(api, { ...persona, nombre: 'lisbeth alvino', telefono: '981 307 304' }, [{ producto_id: prod.id }])
  expect(venta.status(), await venta.text()).toBe(200)
  const ventaId = (await venta.json()).data.id
  // Simular una venta histórica que todavía conserva los espacios.
  const db = await supabase('service')
  await db.patch(`/rest/v1/ventas?id=eq.${ventaId}`, { data: { persona_telefono: '981 307 304' } })
  const pedido = await publico.post('/api/envios', { data: { user_id: u.id, nombre: 'lisbeth alvino espinoza', telefono: '981307304', metodo: 'MOTORIZADO', destino: 'Miraflores', direccion: 'Av. Larco 100' } })
  expect(pedido.status(), await pedido.text()).toBe(200)
  const ventas = await dbSelect('ventas', `id=eq.${ventaId}`)
  expect(ventas[0].persona_id).toBe(persona.id)
  expect(ventas[0].envio_id).toBeTruthy()
  const detalle = await api.get(`/api/envios/${ventas[0].envio_id}/ventas`)
  expect((await detalle.json()).data.map((v: { id: string }) => v.id)).toContain(ventaId)
  const reutiliza = await api.post('/api/personas', { data: { nombre: 'Lisbeth', telefono: '981 307 304' } })
  expect((await reutiliza.json()).data.id).toBe(persona.id)
  await db.dispose(); await api.dispose(); await publico.dispose()
})

test('detalle recupera ventas históricas con espacios junto a las ya vinculadas', async () => {
  const u = await createUser()
  const api = await appApi(u.token)
  const persona = await dbInsert<{ id: string }>('personas', { nombre: 'Cliente', telefono: '982 307 305' })
  await dbInsert('cliente_de', { persona_id: persona.id, profile_id: u.id })
  const prod = await crearProducto(api)
  const ids: string[] = []
  for (let i = 0; i < 2; i++) {
    const r = await crearVenta(api, { ...persona, telefono: '982 307 305' }, [{ producto_id: prod.id }])
    expect(r.status()).toBe(200)
    ids.push((await r.json()).data.id)
  }
  const envio = await dbInsert<{ id: string }>('envios', { user_id: u.id, nombre: 'Otro nombre', telefono: '982307305', metodo: 'MOTORIZADO', estado: 'NO_EMPACADO' })
  const db = await supabase('service')
  await db.patch(`/rest/v1/ventas?id=eq.${ids[0]}`, { data: { envio_id: envio.id } })
  await db.patch(`/rest/v1/ventas?id=eq.${ids[1]}`, { data: { persona_telefono: '982 307 305' } })
  const r = await api.get(`/api/envios/${envio.id}/ventas`)
  expect((await r.json()).data.map((v: { id: string }) => v.id).sort()).toEqual([...ids].sort())
  const otroEnvio = await dbInsert<{ id: string }>('envios', { user_id: u.id, nombre: 'Otro pedido', telefono: '982307305', metodo: 'MOTORIZADO', estado: 'NO_EMPACADO' })
  await db.patch(`/rest/v1/ventas?id=eq.${ids[1]}`, { data: { envio_id: otroEnvio.id } })
  expect((await (await api.get(`/api/envios/${envio.id}/ventas`)).json()).data.map((v: { id: string }) => v.id)).toEqual([ids[0]])
  await db.patch(`/rest/v1/ventas?id=eq.${ids[1]}`, { data: { envio_id: null } })
  await db.patch(`/rest/v1/envios?id=eq.${envio.id}`, { data: { estado: 'ENVIADO' } })
  expect((await (await api.get(`/api/envios/${envio.id}/ventas`)).json()).data.map((v: { id: string }) => v.id)).toEqual([ids[0]])
  const ajeno = await appApi((await createUser()).token)
  expect((await ajeno.get(`/api/envios/${envio.id}/ventas`)).status()).toBe(404)
  await db.dispose(); await api.dispose(); await ajeno.dispose()
})

test('venta nueva encuentra su envío con espacios aunque haya más de 50 pedidos recientes', async () => {
  const u = await createUser()
  const api = await appApi(u.token)
  const persona = await dbInsert<{ id: string }>('personas', { nombre: 'Cliente', telefono: '983307306' })
  await dbInsert('cliente_de', { persona_id: persona.id, profile_id: u.id })
  const envio = await dbInsert<{ id: string }>('envios', { user_id: u.id, nombre: 'Nombre completo', telefono: '983 307 306', metodo: 'MOTORIZADO', estado: 'NO_EMPACADO', fecha_registro: '2025-01-01T00:00:00Z' })
  const db = await supabase('service')
  const relleno = await db.post('/rest/v1/envios', { data: Array.from({ length: 55 }, (_, i) => ({ user_id: u.id, nombre: 'Otro cliente', telefono: `9770000${String(i).padStart(2, '0')}`, metodo: 'MOTORIZADO', estado: 'NO_EMPACADO' })) })
  expect(relleno.ok(), await relleno.text()).toBeTruthy()
  const prod = await crearProducto(api)
  const r = await crearVenta(api, { ...persona, telefono: '983 307 306' }, [{ producto_id: prod.id }])
  expect(r.status(), await r.text()).toBe(200)
  const venta = (await r.json()).data
  expect((await dbSelect('ventas', `id=eq.${venta.id}`))[0].envio_id).toBe(envio.id)
  await db.dispose(); await api.dispose()
})
