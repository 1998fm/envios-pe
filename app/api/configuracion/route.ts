import { NextResponse } from 'next/server'
import { requireNegocio } from '@/lib/negocioAuth'
import { guardarConfiguracion, type ConfigEntrada } from '@/lib/configuracionNegocio'

// Guarda la configuración del negocio (solo el dueño). Recibe multipart:
//   config        JSON con los campos del formulario
//   logo          (opcional) imagen del logo
//   mensajeImagen (opcional) imagen del mensaje de éxito
export async function POST(request: Request) {
  const auth = await requireNegocio()
  if (!auth.ok) return auth.response
  if (!auth.esOwner) {
    return NextResponse.json({ error: 'Solo el dueño puede cambiar la configuración' }, { status: 403 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 })
  }

  let config: ConfigEntrada
  try {
    config = JSON.parse(String(form.get('config') ?? '{}'))
  } catch {
    return NextResponse.json({ error: 'Configuración no válida' }, { status: 400 })
  }
  const archivo = (campo: string) => {
    const f = form.get(campo)
    return f instanceof File && f.size > 0 ? f : null
  }

  const r = await guardarConfiguracion(auth.ownerId, config, {
    logo: archivo('logo'),
    mensajeImagen: archivo('mensajeImagen'),
  })
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json({ ok: true, ...r })
}
