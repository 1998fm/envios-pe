'use client'

import { QRCodeSVG } from 'qrcode.react'

export type ModoEtiquetaProducto = 'A4' | 'INDIVIDUAL'

export type TamanoEtiquetaProducto = {
  nombre: string
  anchoMm: number
  altoMm: number
}

export const TAMANOS_ETIQUETA_PRODUCTO: TamanoEtiquetaProducto[] = [
  { nombre: '40 × 30 mm (3 × 4 cm)', anchoMm: 40, altoMm: 30 },
  { nombre: '50 × 25 mm', anchoMm: 50, altoMm: 25 },
  { nombre: '60 × 40 mm', anchoMm: 60, altoMm: 40 },
  { nombre: '70 × 35 mm', anchoMm: 70, altoMm: 35 },
  { nombre: '100 × 50 mm', anchoMm: 100, altoMm: 50 },
]

export const COPIAS_A4_OPCIONES = Array.from({ length: 30 }, (_, i) => i + 1)

const COLUMNAS_A4: Record<number, number> = {
  1: 1,
  2: 2,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
  7: 3,
  8: 3,
  9: 3,
  10: 4,
}

const ALTO_PAGINA_MM = 297
const ANCHO_PAGINA_MM = 210
const MARGEN_PAGINA_MM = 8
const GAP_A4_MM = 3
const PROPORCION_A4 = 2.4

function elegirColumnas(n: number) {
  let mejor = 1
  let mejorRatio = -1
  for (let c = 1; c <= 10; c++) {
    const r = Math.ceil(n / c)
    const w = (ANCHO_PAGINA_MM - MARGEN_PAGINA_MM - GAP_A4_MM * (c - 1)) / c
    const h = (ALTO_PAGINA_MM - MARGEN_PAGINA_MM - GAP_A4_MM * (r - 1)) / r
    const ratio = w / h
    if (ratio > mejorRatio) {
      mejorRatio = ratio
      mejor = c
    }
  }
  return mejor
}

type ProductoEtiqueta = { id: string; nombre: string; sku?: string | null }

type Props = {
  productos: ProductoEtiqueta[]
  modo?: ModoEtiquetaProducto
  copias?: number
  tamano?: TamanoEtiquetaProducto | null
}

function copiasValidas(copias: number) {
  if (Number.isNaN(copias) || copias < 1) return 1
  if (copias > 30) return 30
  return Math.floor(copias)
}

export default function EtiquetasProducto({
  productos,
  modo = 'INDIVIDUAL',
  copias = 4,
  tamano = null,
}: Props) {
  if (productos.length === 0) return null

  /* ================= HOJA A4 (copias 1 a 10 en una sola hoja) ================= */
  if (modo === 'A4') {
    const copiasA4 = copiasValidas(copias)
    const anchoUtilMm = ANCHO_PAGINA_MM - MARGEN_PAGINA_MM
    const altoUtilMm = ALTO_PAGINA_MM - MARGEN_PAGINA_MM

    const usarAspecto = copiasA4 <= 10
    const columnas = usarAspecto ? COLUMNAS_A4[copiasA4] || 1 : elegirColumnas(copiasA4)
    const filas = Math.ceil(copiasA4 / columnas)
    const anchoPorCol = (anchoUtilMm - GAP_A4_MM * (columnas - 1)) / columnas
    const altoPorFila = (altoUtilMm - GAP_A4_MM * (filas - 1)) / filas

    const altoCeldaMm = usarAspecto ? Math.min(anchoPorCol / PROPORCION_A4, altoPorFila) : altoPorFila
    const anchoCeldaMm = usarAspecto ? altoCeldaMm * PROPORCION_A4 : anchoPorCol
    const qrSize = Math.min(anchoCeldaMm * 0.4, altoCeldaMm * 0.65) * 3.78
    const fuenteNombreMm = usarAspecto
      ? Math.min(altoCeldaMm * 0.1, anchoCeldaMm * 0.06)
      : Math.min(altoCeldaMm * 0.22, anchoCeldaMm * 0.09)
    const fuenteSkuMm = fuenteNombreMm * 0.72

    return (
      <>
        <style>{`
          @media print {
            @page {
              size: ${ANCHO_PAGINA_MM}mm ${ALTO_PAGINA_MM}mm;
              margin: 0;
            }
            #zona-impresion,
            #zona-impresion * {
              display: none !important;
            }
          }
        `}</style>

        <div id="zona-etiquetas-producto" className="fixed -left-[99999px] top-0">
          {productos.map((p) => (
            <div
              key={p.id}
              className="break-after-page"
              style={{
                height: `${ALTO_PAGINA_MM}mm`,
                width: '100%',
                display: 'grid',
                gridTemplateColumns: `repeat(${columnas}, ${anchoCeldaMm}mm)`,
                gridTemplateRows: `repeat(${filas}, ${altoCeldaMm}mm)`,
                gap: `${GAP_A4_MM}mm`,
                placeContent: 'center',
              }}
            >
              {Array.from({ length: copiasA4 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border-2 border-gray-300">
                  <div className="flex h-full w-full items-stretch gap-[1mm] overflow-hidden bg-white p-[2mm]">
                    <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
                      <div
                        className="line-clamp-2 font-bold leading-tight text-slate-900"
                        style={{ fontSize: `${fuenteNombreMm}mm` }}
                      >
                        {p.nombre}
                      </div>
                      {p.sku && (
                        <div
                          className="mt-[0.5mm] truncate font-mono leading-none text-slate-600"
                          style={{ fontSize: `${fuenteSkuMm}mm` }}
                        >
                          {p.sku}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center justify-center pl-[1mm] pr-[0.5mm]">
                      <QRCodeSVG value={p.sku || p.id} size={qrSize} level="M" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    )
  }

  /* ================= ETIQUETA INDIVIDUAL ================= */
  const qrPx = tamano
    ? Math.min(tamano.altoMm - Math.max(1, tamano.altoMm * 0.14), tamano.anchoMm * 0.5) * 3.78
    : 220

  return (
    <>
      <style>{`
        @media print {
          @page {
            ${tamano ? `size: ${tamano.anchoMm}mm ${tamano.altoMm}mm;` : ''}
            margin: 0;
          }
          #zona-impresion,
          #zona-impresion * {
            display: none !important;
          }
        }
      `}</style>

      <div id="zona-etiquetas-producto" className="fixed -left-[99999px] top-0">
        {productos.map((p) => (
          <div
            key={p.id}
            className={tamano ? '' : 'min-h-screen break-after-page bg-white p-6'}
          >
            {tamano ? (
              <div
                className="flex items-stretch gap-[1mm] overflow-hidden bg-white"
                style={{
                  width: `${tamano.anchoMm}mm`,
                  height: `${tamano.altoMm}mm`,
                  padding: `${Math.max(1, tamano.altoMm * 0.06)}mm ${Math.max(1, tamano.anchoMm * 0.05)}mm`,
                }}
              >
                <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
                  <div
                    className="line-clamp-2 font-bold leading-tight text-slate-900"
                    style={{ fontSize: '3mm' }}
                  >
                    {p.nombre}
                  </div>
                  {p.sku && (
                    <div
                      className="mt-[0.5mm] truncate font-mono leading-none text-slate-600"
                      style={{ fontSize: '2.2mm' }}
                    >
                      {p.sku}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center justify-center pl-[1mm]">
                  <QRCodeSVG value={p.sku || p.id} size={qrPx} level="M" />
                </div>
              </div>
            ) : (
              <div className="flex h-[95vh] flex-col items-center justify-center gap-8 rounded-2xl border-2 border-gray-300 bg-white">
                <div className="text-center">
                  <div className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    Producto
                  </div>
                  <div className="mx-auto mt-2 max-w-md break-words text-center text-3xl font-bold text-slate-900">
                    {p.nombre}
                  </div>
                  {p.sku && (
                    <div className="mt-3 font-mono text-xl text-slate-500">{p.sku}</div>
                  )}
                </div>
                <QRCodeSVG value={p.sku || p.id} size={qrPx} level="M" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}