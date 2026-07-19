'use client'

import { Eye, X } from 'lucide-react'
import type { Venta } from '@/types/inventario'

type Props = {
  venta: Venta | null
  onCerrar: () => void
}

export default function ModalDetalleVenta({ venta, onCerrar }: Props) {
  if (!venta) return null

  const badge = {
    COMPLETADA: 'bg-emerald-100 text-emerald-700',
    ANULADA: 'bg-red-100 text-red-700',
  }[venta.estado]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCerrar}>
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-100 px-4 sm:px-8 py-3 sm:py-4 shrink-0">
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Detalle de venta
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Información completa de la venta.
          </p>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
              Cliente
            </div>
            <div className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {venta.persona_nombre}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Total</p>
              <p className="font-bold text-slate-900 text-lg">S/ {venta.total.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Fecha</p>
              <p className="font-semibold text-slate-900 text-sm">
                {new Date(venta.created_at).toLocaleString('es-PE')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
              Productos ({venta.items?.length ?? 0})
            </p>
            <div className="bg-slate-50 rounded-2xl divide-y divide-slate-200">
              {venta.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-slate-900">{item.producto_nombre}</span>
                    <span className="text-slate-400 ml-2">×{item.cantidad}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-xs">S/ {item.precio_unitario.toFixed(2)} c/u</span>
                    <span className="text-slate-900 font-semibold ml-3">S/ {item.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {(!venta.items || venta.items.length === 0) && (
                <div className="px-4 py-3 text-sm text-slate-400 text-center">Sin productos</div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-3 sm:p-4 flex justify-end shrink-0 bg-white rounded-b-[28px]">
          <button
            onClick={onCerrar}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-lg hover:shadow-sky-500/20 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
