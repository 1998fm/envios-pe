'use client'

import type { Venta } from '@/types/inventario'
import ModalDetalleDocumento from '@/components/ModalDetalleDocumento'

type Props = {
  venta: Venta | null
  onCerrar: () => void
}

export default function ModalDetalleVenta({ venta, onCerrar }: Props) {
  if (!venta) return null

  const badge = {
    COMPLETADA: 'bg-emerald-100 text-emerald-700',
    ANULADA: 'bg-red-100 text-red-700',
    PENDIENTE: 'bg-amber-100 text-amber-700',
  }[venta.estado]

  const tiles = (
    <>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">DNI</p>
        <p className="font-semibold text-slate-900 text-sm">{venta.persona_dni || '—'}</p>
      </div>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Estado</p>
        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>
          {venta.estado}
        </span>
      </div>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Pago</p>
        <p className="font-semibold text-slate-900 text-sm">
          {venta.metodo_pago === 'EFECTIVO' ? 'Efectivo' : venta.metodo_pago === 'YAPE_PLIN' ? 'Yape / Plin' : 'Tarjeta'}
        </p>
      </div>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Total</p>
        <p className="font-bold text-slate-900 text-lg">S/ {venta.total.toFixed(2)}</p>
      </div>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Fecha</p>
        <p className="font-semibold text-slate-900 text-sm">
          {new Date(venta.created_at).toLocaleString('es-PE')}
        </p>
      </div>
    </>
  )

  return (
    <ModalDetalleDocumento
      titulo="Detalle de venta"
      entidadLabel="Cliente"
      entidadNombre={venta.persona_nombre}
      tiles={tiles}
      items={venta.items}
      onCerrar={onCerrar}
      tourId="modal-detalle-venta"
    />
  )
}
