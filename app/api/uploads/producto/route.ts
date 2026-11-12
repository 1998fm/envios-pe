import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { requirePlus } from '@/lib/negocioAuth'
import { subirImagen } from '@/lib/configuracionNegocio'
import { imagenEnUso } from '@/lib/productos/imagenes'
import { aProxy } from '@/lib/mediaUrl'

// Foto de producto (el navegador ya la comprimió). Va al servidor, que valida
// tipo y tamaño y la guarda en la carpeta del negocio.
export async function POST(request: Request) {
  const auth = await requirePlus('ver_productos')
  if (!auth.ok) return auth.response

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 })
  }
  const archivo = form.get('file')
  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })
  }

  const r = await subirImagen(
    'productos',
    (ext) => `${auth.ownerId}/producto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
    archivo,
    2 * 1024 * 1024
  )
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json({ url: aProxy(r.url), ruta: r.ruta })
}

// Borra una foto subida (por ejemplo, si falló la creación del producto).
export async function DELETE(request: Request) {
  const auth = await requirePlus('ver_productos')
  if (!auth.ok) return auth.response

  const ruta = new URL(request.url).searchParams.get('ruta') || ''
  // Solo dentro de la carpeta del propio negocio.
  if (!ruta.startsWith(`${auth.ownerId}/`) || ruta.includes('..')) {
    return NextResponse.json({ error: 'Ruta no válida' }, { status: 403 })
  }
  const {data} = supabaseAdmin.storage.from('productos').getPublicUrl(ruta)
  if(await imagenEnUso(data.publicUrl)) return NextResponse.json({error:'Esta imagen está siendo utilizada por un producto'}, {status:409})
  await supabaseAdmin.storage.from('productos').remove([ruta])
  return NextResponse.json({ ok: true })
}
