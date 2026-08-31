'use client'

import { QRCodeSVG } from 'qrcode.react'

export type TamanoEtiquetaProducto = {
  nombre: string
  anchoMm: number
  altoMm: number
}

export const TAMANOS_ETIQUETA_PRODUCTO: TamanoEtiquetaProducto[] = [
  { nombre: '40 × 30 mm', anchoMm: 40, altoMm: 30 },
  { nombre: '50 × 25 mm', anchoMm: 50, altoMm: 25 },
  { nombre: '60 × 40 mm', anchoMm: 60, altoMm: 40 },
  { nombre: '70 × 35 mm', anchoMm: 70, altoMm: 35 },
  { nombre: '100 × 50 mm', anchoMm: 100, altoMm: 50 },
]

type Props = {
  productos: { id: string; nombre: string; sku?: string | null }[]
  tamano: TamanoEtiquetaProducto
}

export default function EtiquetasProducto({ productos, tamano }: Props) {
  if (productos.length === 0) return null

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

      <div
        id="zona-etiquetas-producto"
        className="fixed -left-[99999px] top-0"
      >
        {productos.map((p, i) => (
          <div
            key={p.id}
            className="bg-white flex items-stretch gap-1 overflow-hidden"
            style={{
              width: `${tamano.anchoMm}mm`,
              height: `${tamano.altoMm}mm`,
              padding: `${Math.max(1, tamano.altoMm * 0.07)}mm ${Math.max(1, tamano.anchoMm * 0.05)}mm`,
            }}
          >
            <div className="flex flex-col justify-center overflow-hidden">
              <div className="text-[10px] font-bold text-slate-900 leading-tight line-clamp-2">
                {p.nombre}
              </div>
              {p.sku && (
                <div className="text-[8px] font-mono text-slate-600 mt-0.5 leading-none truncate">
                  {p.sku}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center shrink-0 pl-1">
              <QRCodeSVG
                value={p.sku || p.id}
                size={Math.min(tamano.altoMm - Math.max(2, tamano.altoMm * 0.14), tamano.anchoMm * 0.42) * 3.78}
                level="M"
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
