import * as XLSX from 'xlsx'

export const MAX_ENVIOS_POR_ARCHIVO = 50

const TAMANOS = {
  'PAQUETE XS': {
    alto: 0.15,
    ancho: 0.20,
    largo: 0.12,
    peso: 0.5,
  },

  'PAQUETE S': {
    alto: 0.20,
    ancho: 0.30,
    largo: 0.12,
    peso: 2,
  },

  'PAQUETE M': {
    alto: 0.24,
    ancho: 0.30,
    largo: 0.20,
    peso: 5,
  },

  'PAQUETE L': {
    alto: 0.42,
    ancho: 0.30,
    largo: 0.23,
    peso: 10,
  },
}

function obtenerDestino(
  detalle: string
) {
  const partes = detalle
    .split('/')
    .map((p) => p.trim())

  return partes[partes.length - 1] || ''
}

function obtenerMedidas(
  tamano?: string | null
) {
  return (
    TAMANOS[
      (tamano ||
        'PAQUETE XS') as keyof typeof TAMANOS
    ] || TAMANOS['PAQUETE XS']
  )
}

// Shalom Pro acepta máximo 50 envíos por archivo. Si hay más,
// se divide automáticamente en grupos de 50 (el último puede llevar menos).
export function dividirGrupos(lote: any[]): any[][] {
  const grupos: any[][] = []
  for (let i = 0; i < lote.length; i += MAX_ENVIOS_POR_ARCHIVO) {
    grupos.push(lote.slice(i, i + MAX_ENVIOS_POR_ARCHIVO))
  }
  return grupos
}

function nombreArchivo(total: number, idx: number) {
  return total === 1 ? 'envios-shalom.xlsx' : `envios-shalom-${idx + 1}.xlsx`
}

// Descarga solo los archivos que estén seleccionados (por defecto todos).
// Sirve para re-descargar únicamente el lote que falló en Shalom Pro
// sin volver a bajar los que ya se subieron bien.
export function exportarShalom(lote: any[], origen: string, seleccionados?: boolean[]) {
  const grupos = dividirGrupos(lote)
  const activos = seleccionados ?? grupos.map(() => true)

  grupos.forEach((envios, idx) => {
    if (!activos[idx]) return

    const filas = envios.map((envio) => {
      const medidas = obtenerMedidas(envio.tamano)

      return {
        'DESTINATARIO (DOC)': envio.dni,
        'TELF. DESTINATARIO': envio.telefono,
        'CONTACTO (DOC)': '',
        'TELF. CONTACTO': '',
        'NRO GRR': '',
        ORIGEN: obtenerDestino(origen),
        DESTINO: obtenerDestino(envio.detalle),
        MERCADERIA: envio.tamano || 'PAQUETE XS',
        ALTO: medidas.alto,
        ANCHO: medidas.ancho,
        LARGO: medidas.largo,
        PESO: medidas.peso,
        CANTIDAD: 1,
      }
    })

    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'SHALOM')
    XLSX.writeFile(wb, nombreArchivo(grupos.length, idx))
  })

  return grupos.filter((_, i) => activos[i]).length
}