'use client'

import type { Compra } from '@/types/inventario'
import ModalDetalleDocumento from '@/components/ModalDetalleDocumento'

type Props = {
  compra: Compra | null
  onCerrar: () => void
}

export default function ModalDetalleCompra({ compra, onCerrar }: Props) {
  if (!compra) return null

  const badge = {
    COMPLETADA: 'bg-emerald-100 text-emerald-700',
    ANULADA: 'bg-red-100 text-red-700',
  }[compra.estado]

  const tiles = (
    <>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Estado</p>
        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>
          {compra.estado}
        </span>
      </div>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Total</p>
        <p className="font-bold text-slate-900 text-lg">S/ {compra.total.toFixed(2)}</p>
      </div>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Fecha</p>
        <p className="font-semibold text-slate-900 text-sm">
          {new Date(compra.created_at).toLocaleString('es-PE')}
        </p>
      </div>
    </>
  )

  return (
    <ModalDetalleDocumento
      titulo="Detalle de compra"
      entidadLabel="Proveedor"
      entidadNombre={compra.proveedor}
      tiles={tiles}
      items={compra.items}
      onCerrar={onCerrar}
    />
  )
}
