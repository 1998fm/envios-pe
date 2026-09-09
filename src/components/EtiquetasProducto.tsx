'use client'

import { QRCodeSVG } from 'qrcode.react'

export type TamanoEtiquetaProducto = {
  nombre: string
  anchoMm: number
  altoMm: number
}

export type ModoEtiquetaProducto = 'A4' | 'INDIVIDUAL'

export const TAMANOS_ETIQUETA_PRODUCTO: TamanoEtiquetaProducto[] = [
  { nombre: '40 × 30 mm', anchoMm: 40, altoMm: 30 },
  { nombre: '50 × 25 mm', anchoMm: 50, altoMm: 25 },
  { nombre: '60 × 40 mm', anchoMm: 60, altoMm: 40 },
  { nombre: '70 × 35 mm', anchoMm: 70, altoMm: 35 },
  { nombre: '100 × 50 mm', anchoMm: 100, altoMm: 50 },
]

export const COPIAS_A4_OPCIONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

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
const MARGEN_PAGINA_MM = 8
const GAP_A4_MM = 2.2

type ProductoEtiqueta = { id: string; nombre: string; sku?: string | null }

type Props = {
  productos: ProductoEtiqueta[]
  modo?: ModoEtiquetaProducto
  copias?: number
  tamano?: TamanoEtiquetaProducto
}

function ContenidoEtiqueta({
  producto,
  qrSize,
  qrPadding,
  padding,
  medidas,
}: {
  producto: ProductoEtiqueta
  qrSize: number
  qrPadding: string
  padding?: string
  medidas?: { anchoMm: number; altoMm: number }
}) {
  return (
    <div
      className="flex h-full items-stretch gap-1 overflow-hidden bg-white"
      style={{
        padding: padding || undefined,
        width: medidas ? `${medidas.anchoMm}mm` : undefined,
        height: medidas ? `${medidas.altoMm}mm` : undefined,
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
        <div className="line-clamp-2 text-[10px] font-bold leading-tight text-slate-900">
          {producto.nombre}
        </div>
        {producto.sku && (
          <div className="mt-0.5 truncate font-mono text-[8px] leading-none text-slate-600">
            {producto.sku}
          </div>
        )}
      </div>
      <div className={`flex shrink-0 items-center justify-center ${qrPadding}`}>
        <QRCodeSVG value={producto.sku || producto.id} size={qrSize} level="M" />
      </div>
    </div>
  )
}

function copiasValidas(copias: number) {
  if (Number.isNaN(copias) || copias < 1) return 1
  if (copias > 10) return 10
  return Math.floor(copias)
}

export default function EtiquetasProducto({
  productos,
  modo = 'INDIVIDUAL',
  copias = 4,
  tamano = TAMANOS_ETIQUETA_PRODUCTO[0],
}: Props) {
  if (productos.length === 0) return null

  /* ================= HOJA A4 (copias 1 a 10 en una sola hoja) ================= */
  if (modo === 'A4') {
    const copiasA4 = copiasValidas(copias)
    const columnas = COLUMNAS_A4[copiasA4] || 1
    const filas = Math.ceil(copiasA4 / columnas)
    const altoCeldaMm = (ALTO_PAGINA_MM - MARGEN_PAGINA_MM - GAP_A4_MM * (filas - 1)) / filas
    const qrSize = copiasA4 <= 2 ? 140 : copiasA4 <= 4 ? 100 : 72

    return (
      <>
        <style>{`
          @media print {
            @page {
              size: 210mm 297mm;
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
                padding: `${MARGEN_PAGINA_MM / 2}mm`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columnas}, 1fr)`,
                gap: `${GAP_A4_MM}mm`,
              }}
            >
              {Array.from({ length: copiasA4 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-lg border-2 border-gray-300"
                  style={{ height: `${altoCeldaMm}mm` }}
                >
                  <ContenidoEtiqueta producto={p} qrSize={qrSize} qrPadding="pl-1 pr-0.5" padding="2mm" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    )
  }

  /* ================= ETIQUETA INDIVIDUAL (según impresora) ================= */
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: ${tamano.anchoMm}mm ${tamano.altoMm}mm;
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
          <ContenidoEtiqueta
            key={p.id}
            producto={p}
            medidas={tamano}
            qrSize={Math.min(tamano.altoMm - Math.max(2, tamano.altoMm * 0.14), tamano.anchoMm * 0.42) * 3.78}
            qrPadding="pl-1"
            padding={`${Math.max(1, tamano.altoMm * 0.07)}mm ${Math.max(1, tamano.anchoMm * 0.05)}mm`}
          />
        ))}
      </div>
    </>
  )
}