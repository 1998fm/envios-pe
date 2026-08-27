import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { calcularFechaEntrega } from '@/lib/logistica/calcularFechaEntrega'
import { computeEffectivePlan } from '@/lib/planGating'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const busqueda = searchParams.get('busqueda') || ''
  const estados = searchParams.get('estados')?.split(',').filter(Boolean) || []
  const metodos = searchParams.get('metodos')?.split(',').filter(Boolean) || []

  if (!userId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('envios')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  if (busqueda) {
    query = query.or(
      `nombre.ilike.%${busqueda}%,dni.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`
    )
  }

  if (estados.length > 0) {
    query = query.in('estado', estados)
  }

  if (metodos.length > 0) {
    query = query.in('metodo', metodos)
  }

  const { data, count, error } = await query
    .order('fecha_registro', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    total: count ?? 0,
    offset,
    limit,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      user_id,

      nombre,
      dni,
      telefono,

      metodo,
      nombre_metodo,

      destino,
      direccion,
      referencia,

      detalle,
      observaciones,

      fecha_programada: fechaProgramadaBody,
      idempotency_key: idempotencyKeyBody,
    } = body

    // Llave de idempotencia: 1 llave = 1 envío. Si el cliente reintenta
    // (recarga, error de red, doble envío), se devuelve el envío original.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const idempotencyKey =
      typeof idempotencyKeyBody === 'string' && UUID_RE.test(idempotencyKeyBody)
        ? idempotencyKeyBody
        : null

    if (idempotencyKey) {
      const { data: porLlave, error: errLlave } = await supabaseAdmin
        .from('envios')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (!errLlave && porLlave) {
        return NextResponse.json({
          success: true,
          envio: porLlave,
          duplicado: true,
        })
      }
    }

    const { data: perfil, error: perfilError } =
      await supabaseAdmin
        .from('profiles')
        .select(`
          plan,
          trial_end,
          pro_until,

          logistica_moto_dias,
          logistica_moto_usa_hora_corte,
          logistica_moto_hora_corte,
          logistica_moto_anticipacion,
          logistica_moto_limitar,
          logistica_moto_cupo,

          logistica_agencias_dias,
          logistica_agencias_usa_hora_corte,
          logistica_agencias_hora_corte,
          logistica_agencias_anticipacion,
          logistica_agencias_limitar,
          logistica_agencias_cupo
        `)
        .eq('id', user_id)
        .single()

    if (perfilError || !perfil) {
      return NextResponse.json(
        {
          error: 'No se pudo obtener la configuración logística.',
        },
        {
          status: 400,
        }
      )
    }

    // NOTA: el límite de envíos del plan se aplica SOLO en la exhibición del
    // dashboard (los envíos más allá del tope se ocultan con aviso de upgrade),
    // NUNCA en el registro. El formulario público siempre guarda el pedido,
    // incluso si el mes supera los 50 envíos del plan Básico.

    // Deduplicación: si ya existe un envío idéntico creado en los últimos 30 segundos
    // (doble clic, doble tap o reintento), devolver el existente en lugar de duplicarlo.
    const hace30s = new Date(Date.now() - 30 * 1000).toISOString()
    const { data: duplicado } = await supabaseAdmin
      .from('envios')
      .select('*')
      .eq('user_id', user_id)
      .eq('dni', dni ?? null)
      .eq('telefono', telefono ?? null)
      .eq('metodo', metodo)
      .gte('fecha_registro', hace30s)
      .order('fecha_registro', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (duplicado) {
      return NextResponse.json({
        success: true,
        envio: duplicado,
        duplicado: true,
      })
    }

    // Deduplicación extendida (10 min): mismo cliente + mismo método +
    // exactamente los mismos datos = casi seguro un relleno repetido
    // del formulario (cerró la página y volvió a llenarlo).
    const hace10min = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: duplicadoReciente } = await supabaseAdmin
      .from('envios')
      .select('*')
      .eq('user_id', user_id)
      .eq('nombre', nombre ?? '')
      .eq('dni', dni ?? '')
      .eq('telefono', telefono ?? '')
      .eq('metodo', metodo)
      .eq('destino', destino ?? '')
      .eq('direccion', direccion ?? '')
      .eq('referencia', referencia ?? '')
      .eq('detalle', detalle ?? '')
      .gte('fecha_registro', hace10min)
      .order('fecha_registro', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (duplicadoReciente) {
      return NextResponse.json({
        success: true,
        envio: duplicadoReciente,
        duplicado: true,
      })
    }

    const esPro = computeEffectivePlan(perfil).plan !== 'basic'

    // Para básico la configuración logística personalizada (días, hora de corte, cupo) no aplica
    const logistica = esPro
      ? {
          logisticaMotoDias: perfil.logistica_moto_dias ?? ['MONDAY'],
          logisticaMotoUsaHoraCorte: perfil.logistica_moto_usa_hora_corte ?? false,
          logisticaMotoHoraCorte: perfil.logistica_moto_hora_corte ?? '18:00',
          logisticaMotoAnticipacion: perfil.logistica_moto_anticipacion ?? 1,
          logisticaMotoLimitar: perfil.logistica_moto_limitar ?? false,
          logisticaMotoCupo: perfil.logistica_moto_cupo ?? 0,
          logisticaAgenciasDias: perfil.logistica_agencias_dias ?? ['MONDAY'],
          logisticaAgenciasUsaHoraCorte: perfil.logistica_agencias_usa_hora_corte ?? false,
          logisticaAgenciasHoraCorte: perfil.logistica_agencias_hora_corte ?? '18:00',
          logisticaAgenciasAnticipacion: perfil.logistica_agencias_anticipacion ?? 1,
          logisticaAgenciasLimitar: perfil.logistica_agencias_limitar ?? false,
          logisticaAgenciasCupo: perfil.logistica_agencias_cupo ?? 0,
        }
      : {
          logisticaMotoDias: perfil.logistica_moto_dias ?? ['MONDAY'],
          logisticaMotoUsaHoraCorte: false,
          logisticaMotoHoraCorte: '18:00',
          logisticaMotoAnticipacion: 1,
          logisticaMotoLimitar: false,
          logisticaMotoCupo: 0,
          logisticaAgenciasDias: perfil.logistica_agencias_dias ?? ['MONDAY'],
          logisticaAgenciasUsaHoraCorte: false,
          logisticaAgenciasHoraCorte: '18:00',
          logisticaAgenciasAnticipacion: 1,
          logisticaAgenciasLimitar: false,
          logisticaAgenciasCupo: 0,
        }

    let fechaProgramada: Date

    if (esPro && fechaProgramadaBody) {
      fechaProgramada = new Date(fechaProgramadaBody)
    } else {
      const tipoMetodo =
        metodo === 'MOTORIZADO'
          ? 'MOTO'
          : 'AGENCIA'

      fechaProgramada =
        await calcularFechaEntrega(
          supabaseAdmin,
          user_id,
          logistica,
          tipoMetodo
        )
    }

    const insertPayload: Record<string, any> = {
      user_id,

      nombre,
      dni,
      telefono,

      metodo,
      nombre_metodo,

      destino,
      direccion,
      referencia,

      detalle,
      observaciones,

      estado: 'NO_EMPACADO',

      fecha_registro:
        new Date().toISOString(),

      fecha_programada:
        fechaProgramada.toISOString(),
    }
    if (idempotencyKey) insertPayload.idempotency_key = idempotencyKey

    let { data, error } =
      await supabaseAdmin
        .from('envios')
        .insert([insertPayload])
        .select()
        .single()

    // La columna aún no existe (migración pendiente en Supabase):
    // reintentar sin la llave para no bloquear el pedido.
    if (
      error &&
      idempotencyKey &&
      (error.code === 'PGRST204' || /idempotency_key/i.test(error.message || ''))
    ) {
      delete insertPayload.idempotency_key
      const reintento = await supabaseAdmin
        .from('envios')
        .insert([insertPayload])
        .select()
        .single()
      data = reintento.data
      error = reintento.error
    }

    // Carrera concurrente: otro request creó el envío con esta misma
    // llave (índice único). Devolver el existente en vez de fallar.
    if (error && idempotencyKey && error.code === '23505') {
      const { data: porLlave } = await supabaseAdmin
        .from('envios')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (porLlave) {
        return NextResponse.json({
          success: true,
          envio: porLlave,
          duplicado: true,
        })
      }
    }

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      )
    }

    // ============================================================
    // Pasos secundarios (persona, backfill, vínculo): NUNCA deben
    // romper la respuesta. El envío ya fue creado; si algo falla aquí
    // se registra en logs y se responde éxito igualmente. Antes, un
    // fallo aquí devolvía error 500 con el pedido YA guardado, el
    // cliente reintentaba y generaba duplicados.
    // ============================================================
    try {
    // Guardar/actualizar persona (cliente final)
    // Buscar primero por DNI; si no hay DNI o no se encuentra, buscar por teléfono
    let personaId: string | null = null

    // 1) Buscar por DNI
    if (dni) {
      const { data: porDni } = await supabaseAdmin
        .from('personas')
        .select('id, nombre, telefono')
        .eq('dni', dni)
        .maybeSingle()
      if (porDni) personaId = porDni.id
    }

    // 2) Buscar por teléfono como respaldo
    if (!personaId && telefono) {
      const { data: personasTel } = await supabaseAdmin
        .from('personas')
        .select('id, nombre, dni')
        .eq('telefono', telefono)
        .limit(10)

      if (personasTel && personasTel.length > 0) {
        // Preferir una persona ya vinculada a este negocio; si no, la primera
        let match = personasTel[0]
        for (const p of personasTel) {
          const { data: vinculo } = await supabaseAdmin
            .from('cliente_de')
            .select('id')
            .eq('persona_id', p.id)
            .eq('profile_id', user_id)
            .maybeSingle()
          if (vinculo) {
            match = p
            break
          }
        }
        personaId = match.id
      }
    }

    if (personaId) {
      // Actualizar datos que falten o sean diferentes
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (dni) updates.dni = dni
      if (nombre) updates.nombre = nombre
      if (telefono) updates.telefono = telefono
      const { error: updErr } = await supabaseAdmin
        .from('personas')
        .update(updates)
        .eq('id', personaId)
      // Si falla (ej: otro cliente ya tiene ese DNI), actualizar solo nombre/teléfono
      if (updErr) {
        const reUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
        if (nombre) reUpdates.nombre = nombre
        if (telefono) reUpdates.telefono = telefono
        await supabaseAdmin.from('personas').update(reUpdates).eq('id', personaId)
      }
    } else {
      const { data: newPersona } = await supabaseAdmin
        .from('personas')
        .insert({ dni: dni || null, nombre, telefono: telefono || null })
        .select('id')
        .single()
      personaId = newPersona!.id
    }

    // Completar datos faltantes en las ventas de este cliente (backfill)
    if (dni) {
      await supabaseAdmin
        .from('ventas')
        .update({ persona_dni: dni })
        .eq('persona_id', personaId)
        .is('persona_dni', null)
    }
    if (nombre) {
      await supabaseAdmin
        .from('ventas')
        .update({ persona_nombre: nombre })
        .eq('persona_id', personaId)
        .is('persona_nombre', null)
    }

    // Vincular con este negocio (si no existe ya)
    const { data: vinculoExistente } = await supabaseAdmin
      .from('cliente_de')
      .select('id')
      .eq('persona_id', personaId)
      .eq('profile_id', user_id)
      .maybeSingle()

    if (!vinculoExistente) {
      await supabaseAdmin
        .from('cliente_de')
        .insert({ persona_id: personaId, profile_id: user_id })
    }
    } catch (secErr) {
      console.error('Post-envío no fatal (persona/vínculo/backfill):', secErr)
    }

    return NextResponse.json({
      success: true,
      envio: data,
    })
} catch (err) {

  console.error(err)

  return NextResponse.json(
    {
      error: String(err),
    },
    {
      status: 500,
    }
  )

}
}
