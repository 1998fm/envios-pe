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