'use client'

import { Package } from 'lucide-react'
import type { Venta } from '@/types/inventario'
import Burbuja from '@/components/Burbuja'
import { fmtSoles } from '@/lib/format'
import { subtotalItem, resumenVenta } from '@/lib/ventasUI'

/**
 * Muestra cuántos productos tiene la venta y, al pasar el mouse, el detalle en
 * una burbuja. Se usa en la tabla de escritorio, donde hay espacio de sobra.
 *
 * En celular no hay hover, así que ahí el listado se despliega con un toque
 * (lo hace SeccionVentas). Esta burbuja es solo el camino con mouse.
 */
export default function ItemsVentaConBurbuja({ venta }: { venta: Venta }) {
  const r = resumenVenta(venta)
  const items = venta.items ?? []

  return (
    <Burbuja
      trigger={({ onMouseEnter, onMouseLeave, ref }) => (
        <span
          ref={ref}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          title="Ver los productos"
          className="inline-flex cursor-help items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs font-bold text-tori-600 transition-colors hover:bg-tori-50"
        >
          <Package size={12} />
          {r.items} {r.items === 1 ? 'ítem' : 'ítems'}
        </span>
      )}
    >
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">Esta venta no tiene productos registrados.</p>
      ) : (
        <>
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-tori-500">
            {r.items} {r.items === 1 ? 'producto' : 'productos'} · {r.unidades} unidades
          </p>
          <div className="divide-y divide-slate-100">
            {items.map((it, i) => (
              <div key={it.id || i} className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                  {it.producto_nombre}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                  ×{it.cantidad}
                </span>
                <span className="w-20 shrink-0 text-right text-sm font-bold tabular-nums text-slate-900">
                  {fmtSoles(subtotalItem(it))}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-slate-200 pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total</span>
            <span className="text-sm font-extrabold tabular-nums text-slate-900">
              {fmtSoles(venta.total)}
            </span>
          </div>
        </>
      )}
    </Burbuja>
  )
}
