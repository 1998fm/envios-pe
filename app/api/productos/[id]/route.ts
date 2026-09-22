import { NextResponse } from 'next/server'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import { rutaDesdeUrlProducto } from '@/lib/comprimirImagen'
import { sincronizarArchivoPorStock } from '@/lib/sincronizarArchivoStock'
import { ajustarStock } from '@/lib/stock'

// La URL de la imagen solo se acepta si apunta al bucket público de productos
function validarImagenUrl(valor: unknown): string | null {
  if (
    typeof valor === 'string' &&
    valor.length <= 500 &&
    valor.includes('/object/public/productos/')
  ) {
    return valor
  }
  return null
}

async function borrarArchivoProducto(imagenUrl: string | null | undefined) {
  if (!imagenUrl) return
  const ruta = rutaDesdeUrlProducto(imagenUrl)
  if (!ruta) return
  try {
    await supabaseAdmin.storage.from('productos').remove([ruta])
  } catch (err) {
    // No fatal: el producto ya se guardó/eliminó; solo queda registrado en logs.
    console.error('No se pudo borrar el archivo del bucket:', ruta, err)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const nuevaImagenUrl = validarImagenUrl(body.imagen_url)

  const { data: actual } = await supabaseAdmin
    .from('productos')
    .select('imagen_url, stock_actual')
    .eq('id', id)
    .maybeSingle()

  // El stock NUNCA se escribe directo en el PUT: para cambiarlo se exige un
  // motivo y se usa el RPC ajustar_stock (queda registrado en el kardex).
  if (body.stock_actual !== undefined && body.stock_actual !== null) {
    const stockNuevo = Number(body.stock_actual)
    if (!Number.isInteger(stockNuevo) || stockNuevo < 0) {
      return NextResponse.json(
        { error: 'El stock debe ser un número entero mayor o igual a 0.' },
        { status: 400 }
      )
    }
    const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : ''
    if (!motivo) {
      return NextResponse.json(
        { error: 'Para ajustar el stock se requiere un motivo (ajuste de inventario).' },
        { status: 400 }
      )
    }
    const stockActualPrevio = Number(actual?.stock_actual ?? 0)
    if (stockNuevo !== stockActualPrevio) {
      const res = await ajustarStock(id, stockNuevo, motivo)
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 409 })
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from('productos')
    .update({
      nombre: body.nombre,
      sku: body.sku ?? null,
      descripcion: body.descripcion ?? null,
      precio_venta: body.precio_venta ?? 0,
      precio_compra: body.precio_compra ?? 0,
      stock_minimo: body.stock_minimo ?? 0,
      unidad: body.unidad || 'unidad',
      ...(body.imagen_url !== undefined ? { imagen_url: nuevaImagenUrl } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Si cambió la foto, eliminar el archivo anterior del bucket
  if (actual?.imagen_url && actual.imagen_url !== data.imagen_url) {
    await borrarArchivoProducto(actual.imagen_url)
  }

  // Stock 0 o negativo archiva automáticamente; stock > 0 reactiva
  await sincronizarArchivoPorStock([id])

  return NextResponse.json({ data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Leer la URL de la foto ANTES de eliminar el registro
  const { data: actual } = await supabaseAdmin
    .from('productos')
    .select('imagen_url')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabaseAdmin
    .from('productos')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Eliminar también la imagen para no ocupar espacio del Storage
  await borrarArchivoProducto(actual?.imagen_url)

  return NextResponse.json({ success: true })
}
