import * as XLSX from 'xlsx'

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

export function exportarShalom(
  envios: any[],
  origen: string
) {

  const filas = envios.map((envio) => {

    const medidas = obtenerMedidas(
      envio.tamano
    )

    return {
      'DESTINATARIO (DOC)': envio.dni,

      'TELF. DESTINATARIO':
        envio.telefono,

      'CONTACTO (DOC)': '',

      'TELF. CONTACTO': '',

      'NRO GRR': '',

      ORIGEN: origen,

      DESTINO: obtenerDestino(
        envio.detalle
      ),

      MERCADERIA:
        envio.tamano ||
        'PAQUETE XS',

      ALTO: medidas.alto,

      ANCHO: medidas.ancho,

      LARGO: medidas.largo,

      PESO: medidas.peso,

      CANTIDAD: 1,
    }
  })

  const ws =
    XLSX.utils.json_to_sheet(filas)

  const wb =
    XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    'SHALOM'
  )

  XLSX.writeFile(
    wb,
    'envios-shalom.xlsx'
  )
}