import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { calcularFechaEntrega } from '@/lib/logistica/calcularFechaEntrega'
import { checkEnvioLimit } from '@/lib/planLimits'
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
    } = body

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

    const { allowed, reason } = await checkEnvioLimit(user_id)
    if (!allowed) {
      return NextResponse.json({ error: reason }, { status: 403 })
    }

    const esPro = computeEffectivePlan(perfil).plan === 'pro'

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

    const { data, error } =
      await supabaseAdmin
        .from('envios')
        .insert([
          {
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
          },
        ])
        .select()
        .single()

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
