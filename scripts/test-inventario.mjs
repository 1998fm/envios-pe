// ============================================================
// TEST E2E DE INVENTARIO (KARDEX + RPC ATOMICOS)
// ============================================================
// Ejecuta el flujo completo contra la base REAL usando una empresa
// desechable (perfil + productos + persona de prueba) que se elimina
// al final. No toca datos reales del usuario.
//
// Invariante maestro verificado en cada paso:
//   stock_actual del producto == sum(movimientos_inventario.cantidad)
//
// Uso:
//   npm run test:inventario
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const envPath = join(process.cwd(), '.env.local')
if (!existsSync(envPath)) {
  console.error('No existe .env.local')
  process.exit(1)
}

const env = {}
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/)
  if (m) {
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[m[1]] = val
  }
}

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SB_SERVICE = env.SUPABASE_SERVICE_ROLE_KEY

if (!SB_URL || !SB_SERVICE) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const admin = createClient(SB_URL, SB_SERVICE)

let fallas = 0
let pasos = 0

function ok(nombre) {
  pasos++
  console.log(`  ✓ ${nombre}`)
}
function fallo(nombre, detalle) {
  fallas++
  pasos++
  console.error(`  ✗ ${nombre}: ${detalle}`)
}
function check(condicion, nombre, detalle = '') {
  if (condicion) ok(nombre)
  else fallo(nombre, detalle)
}

// ── utilidades ────────────────────────────────────────────────
async function stockActual(productoId) {
  const { data, error } = await admin
    .from('productos')
    .select('stock_actual')
    .eq('id', productoId)
    .single()
  if (error) throw new Error(`stockActual: ${error.message}`)
  return Number(data.stock_actual)
}

async function sumaKardex(productoId) {
  const { data, error } = await admin
    .from('movimientos_inventario')
    .select('cantidad')
    .eq('producto_id', productoId)
  if (error) throw new Error(`sumaKardex: ${error.message}`)
  return (data || []).reduce((acc, m) => acc + Number(m.cantidad), 0)
}

// Verifica que el stock físico coincida con el libro kardex acumulado
async function verifyReconciliado(productoId, nombre) {
  const [s, k] = await Promise.all([stockActual(productoId), sumaKardex(productoId)])
  check(s === k, `${nombre} → stock=suma kardex (${s} = ${k})`, `stock ${s} != kardex ${k}`)
}

async function movimientos(productoId) {
  const { data, error } = await admin
    .from('movimientos_inventario')
    .select('tipo, cantidad, saldo_antes, saldo_despues')
    .eq('producto_id', productoId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`movimientos: ${error.message}`)
  return data || []
}

// ── setup: empresa desechable ─────────────────────────────────
console.log('\n[setup] Creando empresa de prueba (desechable)...')
const tag = `test${Date.now()}`
const email = `${tag}@inventario.test`
const { data: authData, error: authErr } = await admin.auth.admin.createUser({
  email,
  password: 'TestInventario123!',
  email_confirm: true,
})
if (authErr) {
  console.error(`No se pudo crear el usuario de prueba: ${authErr.message}`)
  process.exit(1)
}
const profileId = authData.user.id

const { error: profileErr } = await admin.from('profiles').insert({
  id: profileId,
  empresa: `Test Inventario ${tag}`,
  slug: `test-inventario-${tag}`,
  plan: 'business_plus',
})
if (profileErr) {
  console.error(`No se pudo crear el perfil de prueba: ${profileErr.message}`)
  process.exit(1)
}

let personaId = null
let productoIds = []
let compraIds = []
let ventaIds = []

async function limpia() {
  console.log('\n[cleanup] Limpiando datos de prueba...')
  if (ventaIds.length) {
    await admin.from('ventas').delete().in('id', ventaIds)
    ventaIds = []
  }
  if (compraIds.length) {
    await admin.from('compras').delete().in('id', compraIds)
    compraIds = []
  }
  if (productoIds.length) {
    await admin.from('productos').delete().in('id', productoIds)
    productoIds = []
  }
  if (personaId) {
    await admin.from('personas').delete().eq('id', personaId)
    personaId = null
  }
  await admin.from('profiles').delete().eq('id', profileId)
  await admin.auth.admin.deleteUser(profileId)
}

async function nuevoProducto(nombre, stockInicial) {
  const { data, error } = await admin
    .from('productos')
    .insert({
      profile_id: profileId,
      nombre,
      precio_venta: 10,
      precio_compra: 5,
      stock_actual: 0,
    })
    .select()
    .single()
  if (error) throw new Error(`crear producto: ${error.message}`)
  productoIds.push(data.id)

  // Stock inicial vía ajustar_stock (kardex AJUSTE) como en /api/productos
  const { data: r, error: rErr } = await admin.rpc('ajustar_stock', {
    p_producto_id: data.id,
    p_stock_nuevo: stockInicial,
    p_motivo: 'Stock inicial',
  })
  if (rErr) throw new Error(`ajustar_stock inicial: ${rErr.message}`)
  if (!r?.length) throw new Error('ajustar_stock inicial devolvió vacío')
  return data.id
}

async function nuevaPersona(nombre) {
  const { data, error } = await admin
    .from('personas')
    .insert({ dni: String(Date.now()).slice(-8), nombre, telefono: '999000000' })
    .select()
    .single()
  if (error) throw new Error(`crear persona: ${error.message}`)
  personaId = data.id
  return data.id
}

async function crearVenta(estado, items) {
  const { data: venta, error } = await admin
    .from('ventas')
    .insert({
      profile_id: profileId,
      persona_id: personaId,
      persona_nombre: 'Cliente Test',
      persona_dni: String(Date.now()).slice(-8),
      total: items.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0),
      estado,
      metodo_pago: 'EFECTIVO',
      monto_pagado: estado === 'COMPLETADA' ? items.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0) : 0,
    })
    .select()
    .single()
  if (error) throw new Error(`crear venta: ${error.message}`)
  ventaIds.push(venta.id)

  const { error: itErr } = await admin.from('venta_items').insert(
    items.map((it) => ({
      venta_id: venta.id,
      producto_id: it.producto_id,
      producto_nombre: it.nombre,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      costo_unitario: it.costo_unitario ?? 0,
      subtotal: it.cantidad * it.precio_unitario,
    }))
  )
  if (itErr) throw new Error(`crear venta_items: ${itErr.message}`)
  return venta.id
}

// ──────────────────────────────────────────────────────────────
try {
  console.log('\n=== Flujo 1: Ajuste inicial de stock (kardex AJUSTE) ===')
  const p1 = await nuevoProducto('Producto Test A', 50)
  await verifyReconciliado(p1, 'Ajuste inicial 50')

  console.log('\n=== Flujo 2: Compra (kardex COMPRA) ===')
  const { data: compra } = await admin
    .from('compras')
    .insert({ profile_id: profileId, proveedor: 'Proveedor Test', total: 100, estado: 'COMPLETADA' })
    .select()
    .single()
  compraIds.push(compra.id)
  const { data: compraItem } = await admin
    .from('compra_items')
    .insert({ compra_id: compra.id, producto_id: p1, producto_nombre: 'Producto Test A', cantidad: 30, precio_unitario: 5, subtotal: 150 })
    .select()
    .single()
  const { data: rCompra, error: eCompra } = await admin.rpc('sumar_stock', {
    p_producto_id: p1,
    p_cantidad: 30,
    p_referencia_id: compra.id,
    p_tipo: 'COMPRA',
    p_motivo: 'Compra',
  })
  check(!eCompra, 'sumar_stock compra OK', eCompra?.message)
  await verifyReconciliado(p1, 'Stock tras compra (80)')
  check((await movimientos(p1)).length === 2, 'Kardex tiene 2 movimientos (AJUSTE + COMPRA)', 'No son 2')

  console.log('\n=== Flujo 3: Venta (kardex VENTA) ===')
  const { data: rVenta, error: eVenta } = await admin.rpc('descontar_stock', {
    p_producto_id: p1,
    p_cantidad: 20,
    p_referencia_id: crypto.randomUUID(),
    p_tipo: 'VENTA',
    p_motivo: 'Venta',
  })
  check(!eVenta && rVenta?.[0]?.stock_final === 60, 'descontar_stock venta OK → 60', eVenta?.message)
  await verifyReconciliado(p1, 'Stock tras venta (60)')

  console.log('\n=== Flujo 4: Venta con stock insuficiente (se rechaza) ===')
  const { data: rInsuf, error: eInsuf } = await admin.rpc('descontar_stock', {
    p_producto_id: p1,
    p_cantidad: 999,
    p_referencia_id: crypto.randomUUID(),
    p_tipo: 'VENTA',
    p_motivo: 'Venta',
  })
  check(!eInsuf && (!rInsuf || rInsuf.length === 0), 'descontar_stock insuficiente → 0 filas (sin error, sin stock fantasma)', eInsuf?.message)
  check((await stockActual(p1)) === 60, 'Stock sigue en 60', `cambió a ${await stockActual(p1)}`)
  await verifyReconciliado(p1, 'Reconciliado tras rechazo')

  console.log('\n=== Flujo 5: Anular compra ya vendida (bloqueo E2) ===')
  // La compra sumó 30; en el kardex el producto tiene 60. Intentar anular 30
  // es legítimo, pero probamos el bloqueo con un excedente de 100.
  const { data: rRest, error: eRest } = await admin.rpc('restar_stock', {
    p_producto_id: p1,
    p_cantidad: 100,
    p_referencia_id: compra.id,
    p_tipo: 'ANULACION_COMPRA',
    p_motivo: 'Anulación compra',
  })
  check(!eRest && (!rRest || rRest.length === 0), 'restar_stock con exceso → 0 filas (bloqueo, sin negativos)', eRest?.message)
  check((await stockActual(p1)) === 60, 'Stock sigue en 60 tras bloqueo', `cambió a ${await stockActual(p1)}`)
  await verifyReconciliado(p1, 'Reconciliado tras bloqueo de anulación')

  console.log('\n=== Flujo 6: Ajuste manual requiere motivo (se valida) ===')
  const { error: eMotivo } = await admin.rpc('ajustar_stock', {
    p_producto_id: p1,
    p_stock_nuevo: 70,
    p_motivo: '   ',
  })
  check(!!eMotivo, 'ajustar_stock sin motivo → error', eMotivo?.message || 'no lanzó error')
  check((await stockActual(p1)) === 60, 'Stock intacto tras ajuste sin motivo', `cambió a ${await stockActual(p1)}`)

  console.log('\n=== Flujo 7: Ajuste manual válido (kardex AJUSTE) ===')
  const { data: rAjuste, error: eAjuste } = await admin.rpc('ajustar_stock', {
    p_producto_id: p1,
    p_stock_nuevo: 70,
    p_motivo: 'Conteo físico',
  })
  check(!eAjuste && rAjuste?.[0]?.stock_final === 70, 'ajustar_stock válido → 70', eAjuste?.message)
  await verifyReconciliado(p1, 'Reconciliado tras ajuste válido')

  console.log('\n=== Flujo 8: Edición de venta atómica ===')
  await nuevaPersona('Cliente Test 2')
  // Producto con stock para la venta
  const p2 = await nuevoProducto('Producto Test B', 0)
  const { data: rCompra2, error: eCompra2 } = await admin.rpc('sumar_stock', {
    p_producto_id: p2,
    p_cantidad: 100,
    p_referencia_id: compra.id,
    p_tipo: 'COMPRA',
    p_motivo: 'Compra',
  })
  check(!eCompra2, 'Stock base para venta (100)', eCompra2?.message)

  const venta1 = await crearVenta('COMPLETADA', [
    { producto_id: p2, nombre: 'Producto Test B', cantidad: 10, precio_unitario: 10 },
  ])
  const { data: rEdit, error: eEdit } = await admin.rpc('editar_venta_atomico', {
    p_venta_id: venta1,
    p_items: [
      { producto_id: p2, producto_nombre: 'Producto Test B', cantidad: 4, precio_unitario: 12 },
    ],
    p_metodo_pago: 'EFECTIVO',
    p_persona_nombre: 'Cliente Test 2',
    p_persona_dni: '00000000',
  })
  // Tras editar: se devuelven 10 y se descuentan 4 → neto -4 sobre 100 → 96
  check(!eEdit, 'editar_venta_atomico OK', eEdit)
  await verifyReconciliado(p2, 'Stock tras edición (96)')
  const { data: ventaEditada } = await admin.from('ventas').select('total').eq('id', venta1).single()
  check(ventaEditada?.total === 48, `Total recalculado (48)`, `fue ${ventaEditada?.total}`)
  const { data: itemsEditados } = await admin.from('venta_items').select('cantidad').eq('venta_id', venta1)
  check(itemsEditados?.length === 1 && Number(itemsEditados[0].cantidad) === 4, 'Items reemplazados (1 × 4)', 'items no cuadran')

  console.log('\n=== Flujo 8b: Edición fallida NO deja corrupción (rollback) ===')
  const { data: eEdit2, error: eEdit2Err } = await admin.rpc('editar_venta_atomico', {
    p_venta_id: venta1,
    p_items: [
      { producto_id: p2, producto_nombre: 'Producto Test B', cantidad: 999999, precio_unitario: 1 },
    ],
    p_metodo_pago: 'EFECTIVO',
  })
  check(!!eEdit2Err, 'edición con stock insuficiente → error', eEdit2Err?.message || 'no lanzó error')
  await verifyReconciliado(p2, 'Stock intacto tras edición fallida (96)')
  const { data: viCheck } = await admin.from('venta_items').select('id').eq('venta_id', venta1)
  check(viCheck?.length === 1, 'Los ítems originales siguen (no quedó venta sin detalle)', `hay ${viCheck?.length}`)

  console.log('\n=== Flujo 9: Anular venta atómica (kardex ANULACION_VENTA) ===')
  const { data: rAnula, error: eAnula } = await admin.rpc('anular_venta_atomico', {
    p_venta_id: venta1,
  })
  check(!eAnula, 'anular_venta_atomico OK', eAnula?.message)
  const { data: ventaAnulada } = await admin.from('ventas').select('estado').eq('id', venta1).single()
  check(ventaAnulada?.estado === 'ANULADA', 'Venta pasa a ANULADA', ventaAnulada?.estado)
  await verifyReconciliado(p2, 'Stock tras anular venta (100)')

  console.log('\n=== Flujo 10: Eliminar venta atómica (restaura + borra) ===')
  const venta2 = await crearVenta('PENDIENTE', [
    { producto_id: p2, nombre: 'Producto Test B', cantidad: 7, precio_unitario: 10 },
  ])
  const { data: rElim, error: eElim } = await admin.rpc('eliminar_venta_atomico', {
    p_venta_id: venta2,
  })
  check(!eElim, 'eliminar_venta_atomico OK', eElim?.message)
  const { data: ventaBorrada } = await admin.from('ventas').select('id').eq('id', venta2)
  check((ventaBorrada || []).length === 0, 'Venta eliminada de la tabla', 'sigue existiendo')
  await verifyReconciliado(p2, 'Stock tras eliminar venta (100)')

  console.log('\n=== Flujo 11: Concurrencia (20 descuentos simultáneos) ===')
  const p3 = await nuevoProducto('Producto Test C', 100)
  // Lanzar 20 descuentos de a 1 unidad en paralelo: el total debe ser 80
  // (con FOR UPDATE no puede quedar por debajo de 0 ni perderse unidades).
  const desc = Array.from({ length: 20 }, () =>
    admin.rpc('descontar_stock', { p_producto_id: p3, p_cantidad: 1, p_tipo: 'VENTA', p_motivo: 'Concurrencia' })
  )
  const resultados = await Promise.all(desc)
  const errores = resultados.filter((r) => r.error)
  check(errores.length === 0, '20 descuentos concurrentes sin errores', errores.map((e) => e.error.message).join('; '))
  await verifyReconciliado(p3, 'Stock tras concurrencia (80)')

  console.log('\n=== Flujo 12: Guarda de autorización (multi-tenant) ===')
  // Solo se ejecuta si la base tiene la guarda auth.uid() desplegada. Un
  // segundo perfil NO debe poder mover el stock del perfil A.
  const { data: authData2, error: authErr2 } = await admin.auth.admin.createUser({
    email: `test2-${tag}@inventario.test`,
    password: 'TestInventario123!',
    email_confirm: true,
  })
  if (authErr2) {
    fallo('crear 2do usuario de prueba', authErr2.message)
  } else {
    const profileId2 = authData2.user.id
    await admin.from('profiles').insert({
      id: profileId2,
      empresa: `Test Inventario 2 ${tag}`,
      slug: `test-inventario-2-${tag}`,
      plan: 'business_plus',
    })

    // Un cliente autenticado como perfil 2 intenta descontar stock del perfil A
    const anon = createClient(SB_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: sesion, error: sesionErr } = await anon.auth.signInWithPassword({
      email: `test2-${tag}@inventario.test`,
      password: 'TestInventario123!',
    })
    if (sesionErr || !sesion?.session?.access_token) {
      fallo('login del perfil 2', sesionErr?.message || 'sin sesión')
    } else {
      const autenticado = createClient(SB_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${sesion.session.access_token}` } },
      })
      const stockAntesIntento = await stockActual(p1)
      const { data: rCross, error: eCross } = await autenticado.rpc('descontar_stock', {
        p_producto_id: p1,
        p_cantidad: 1,
        p_tipo: 'VENTA',
        p_motivo: 'Intento ajeno',
      })
      if (eCross && /No autorizado/i.test(eCross.message)) {
        ok('descontar_stock de otro tenant → rechazado (No autorizado)')
      } else if (!eCross && rCross?.length > 0) {
        fallo('descontar_stock de otro tenant → PERMITIDO (guarda NO desplegada)', 're-aplica kardex-movimientos.sql y rpc-venta-atomico.sql con las guardas auth.uid()')
      } else {
        fallo('guarda multi-tenant', eCross?.message || `respuesta inesperada ${JSON.stringify(rCross)}`)
      }
      check((await stockActual(p1)) === stockAntesIntento, 'Stock del perfil A intacto tras intento ajeno', `cambió a ${await stockActual(p1)}`)
    }
    await admin.from('profiles').delete().eq('id', profileId2)
    await admin.auth.admin.deleteUser(profileId2)
  }

  // ── Resumen final ───────────────────────────────────────────
  console.log(`\n=== RESULTADO: ${pasos - fallas}/${pasos} pasos OK ===`)
  if (fallas > 0) {
    console.error(`FALLARON ${fallas} pasos`)
    process.exitCode = 1
  } else {
    console.log('INVENTARIO CONSISTENTE ✔')
  }
} finally {
  await limpia()
  console.log('\nCleanup completado.')
}