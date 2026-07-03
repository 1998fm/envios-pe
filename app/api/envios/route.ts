import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { calcularFechaEntrega } from '@/lib/logistica/calcularFechaEntrega'

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

    const tipoMetodo =
      metodo === 'MOTORIZADO'
        ? 'MOTO'
        : 'AGENCIA'

    const fechaProgramada =
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
