'use client'

import type { Venta } from '@/types/inventario'
import ModalDetalleDocumento from '@/components/ModalDetalleDocumento'
import { Lock } from 'lucide-react'
import { openUpgrade, planNivel } from '@/lib/planGating'

type Props = {
  venta: Venta | null
  onCerrar: () => void
  plan?: string
}

export default function ModalDetalleVenta({ venta, onCerrar, plan = 'basic' }: Props) {
  if (!venta) return null

  const badge = {
    COMPLETADA: 'bg-emerald-100 text-emerald-700',
    ANULADA: 'bg-red-100 text-red-700',
    PENDIENTE: 'bg-amber-100 text-amber-700',
  }[venta.estado]

  const costo = (venta.items || []).reduce(
    (sum, it) => sum + (it.costo_unitario ?? 0) * it.cantidad,
    0
  )
  const ganancia = venta.total - costo
  const pctGanancia = venta.total > 0 ? (ganancia / venta.total) * 100 : 0

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
      {planNivel(plan) >= 1 ? (
        <div className="bg-slate-50 rounded-2xl p-3">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Ganancia</p>
          <p className="font-bold text-emerald-600 text-lg">S/ {ganancia.toFixed(2)}</p>
          <p className="text-[11px] text-slate-400">{pctGanancia.toFixed(0)}% de la venta</p>
        </div>
      ) : (
        <button
          onClick={openUpgrade}
          className="bg-slate-50 rounded-2xl p-3 text-left border border-dashed border-slate-300 hover:border-sky-300 transition-colors"
        >
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Ganancia</p>
          <p className="font-bold text-slate-400 text-lg flex items-center gap-2">
            <Lock size={16} />
            Ver planes
          </p>
        </button>
      )}
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
