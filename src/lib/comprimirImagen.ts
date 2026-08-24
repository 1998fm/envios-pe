export async function comprimirImagenWebP(
  file: File,
  maxDim = 1024,
  quality = 0.85
): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const w = Math.min(bitmap.width, maxDim)
    const h = Math.max(1, Math.round((bitmap.height / bitmap.width) * w))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }

    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality)
    )
    if (!blob) return file

    const nombreSinExtension = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${nombreSinExtension}.webp`, { type: 'image/webp' })
  } catch {
    return file
  }
}

// ============================================================
// Compresión para fotos de producto: redimensiona al lado mayor
// indicado y exporta JPEG con la calidad dada. Resultado típico:
// 30-60 KB (vs 3-8 MB de una foto original), para que el
// bucket 'productos' rinda dentro del Storage de Supabase.
// ============================================================

type FuenteImagen = ImageBitmap | HTMLImageElement

async function cargarFuente(file: File): Promise<FuenteImagen> {
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      // cae al fallback de abajo
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    img.src = URL.createObjectURL(file)
  })
}

export async function comprimirImagen(
  file: File,
  maxLado = 512,
  calidad = 0.75
): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen.')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('La imagen es muy grande (máximo 10 MB).')
  }

  const fuente = await cargarFuente(file)
  const anchoOriginal = 'width' in fuente ? (fuente.width as number) : 0
  const altoOriginal = 'height' in fuente ? (fuente.height as number) : 0

  const escala = Math.min(1, maxLado / Math.max(anchoOriginal, altoOriginal, 1))
  const ancho = Math.max(1, Math.round(anchoOriginal * escala))
  const alto = Math.max(1, Math.round(altoOriginal * escala))

  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen.')

  // Fondo blanco: evita que los PNG transparentes se vean negros en JPEG
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ancho, alto)
  ctx.drawImage(fuente as CanvasImageSource, 0, 0, ancho, alto)

  if ('close' in fuente && typeof fuente.close === 'function') {
    fuente.close()
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size === 0) reject(new Error('No se pudo comprimir la imagen.'))
        else resolve(blob)
      },
      'image/jpeg',
      calidad
    )
  })
}

// Extrae la ruta del objeto dentro del bucket 'productos' desde su URL pública.
// Ej: https://xyz.supabase.co/storage/v1/object/public/productos/{uid}/f.jpg
//  -> '{uid}/f.jpg'
export function rutaDesdeUrlProducto(url: string): string | null {
  const marcador = '/object/public/productos/'
  const i = url.indexOf(marcador)
  if (i === -1) return null
  const ruta = url.substring(i + marcador.length)
  return ruta.length > 0 ? ruta : null
}
