import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { calcularFechaEntrega } from '@/lib/logistica/calcularFechaEntrega'
import { checkEnvioLimit } from '@/lib/planLimits'

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
          logistica_moto_dias,
          logistica_moto_usa_hora_corte,
          logistica_moto_hora_corte,
          logistica_moto_limitar,
          logistica_moto_cupo,

          logistica_agencias_dias,
          logistica_agencias_usa_hora_corte,
          logistica_agencias_hora_corte,
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

    let fechaProgramada: Date

    if (fechaProgramadaBody) {
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
          {
            logisticaMotoDias:
              perfil.logistica_moto_dias ?? ['MONDAY'],

            logisticaMotoUsaHoraCorte:
              perfil.logistica_moto_usa_hora_corte ?? false,

            logisticaMotoHoraCorte:
              perfil.logistica_moto_hora_corte ?? '18:00',

            logisticaMotoLimitar:
              perfil.logistica_moto_limitar ?? false,

            logisticaMotoCupo:
              perfil.logistica_moto_cupo ?? 0,

            logisticaAgenciasDias:
              perfil.logistica_agencias_dias ?? ['MONDAY'],

            logisticaAgenciasUsaHoraCorte:
              perfil.logistica_agencias_usa_hora_corte ?? false,

            logisticaAgenciasHoraCorte:
              perfil.logistica_agencias_hora_corte ?? '18:00',

            logisticaAgenciasLimitar:
              perfil.logistica_agencias_limitar ?? false,

            logisticaAgenciasCupo:
              perfil.logistica_agencias_cupo ?? 0,
          },
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
    const { data: personaExistente } = await supabaseAdmin
      .from('personas')
      .select('id, telefono')
      .eq('dni', dni)
      .maybeSingle()

    let personaId: string

    if (personaExistente) {
      personaId = personaExistente.id
      if (personaExistente.telefono !== telefono) {
        await supabaseAdmin
          .from('personas')
          .update({ telefono, updated_at: new Date().toISOString() })
          .eq('id', personaId)
      }
    } else {
      const { data: newPersona } = await supabaseAdmin
        .from('personas')
        .insert({ dni, nombre, telefono })
        .select('id')
        .single()
      personaId = newPersona!.id
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
