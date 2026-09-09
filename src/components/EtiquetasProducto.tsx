'use client'

import { QRCodeSVG } from 'qrcode.react'

export type ModoEtiquetaProducto = 'A4' | 'INDIVIDUAL'

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
                  <div className="flex h-full items-stretch gap-1 overflow-hidden bg-white p-[2mm]">
                    <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
                      <div className="line-clamp-2 text-[10px] font-bold leading-tight text-slate-900">
                        {p.nombre}
                      </div>
                      {p.sku && (
                        <div className="mt-0.5 truncate font-mono text-[8px] leading-none text-slate-600">
                          {p.sku}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center justify-center pl-1 pr-0.5">
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

  /* ================= ETIQUETA INDIVIDUAL (página completa, se adapta a la impresora) ================= */
  return (
    <>
      <style>{`
        @media print {
          #zona-impresion,
          #zona-impresion * {
            display: none !important;
          }
        }
      `}</style>

      <div id="zona-etiquetas-producto" className="fixed -left-[99999px] top-0">
        {productos.map((p) => (
          <div key={p.id} className="min-h-screen break-after-page bg-white p-6">
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
              <QRCodeSVG value={p.sku || p.id} size={220} level="M" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}