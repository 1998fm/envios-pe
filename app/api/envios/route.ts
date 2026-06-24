import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      user_id,
      nombre,
      dni,
      telefono,
      metodo,
      detalle,
      observaciones,
    } = body

    const { data, error } = await supabaseAdmin
      .from('envios')
      .insert([
        {
          user_id,
          nombre,
          dni,
          telefono,
          metodo,
          detalle,
          observaciones,
          estado: 'NO_EMPACADO',
          fecha_registro: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      envio: data,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}