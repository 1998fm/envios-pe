'use client'

import { useEffect, useState } from 'react'
import { Pencil, X, Plus, Minus, Check, Loader2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { Venta, Producto } from '@/types/inventario'
import { tourDone, trayectoDone } from '@/lib/tours'
import TourHelpButton from '@/components/TourHelpButton'
import { useOnboarding } from '@/context/OnboardingContext'
import { openUpgrade, planNivel } from '@/lib/planGating'
import { Lock } from 'lucide-react'

type Props = {
  venta: Venta | null
  onCerrar: () => void
  onGuardar?: (ventaActualizada?: Venta) => void
  plan?: string
  userId?: string
}

const METODOS_PAGO = [
  { key: 'EFECTIVO', label: 'Efectivo' },
  { key: 'YAPE_PLIN', label: 'Yape / Plin' },
  { key: 'TARJETA', label: 'Tarjeta' },
] as const

type EditItem = {
  id?: string
  producto_id: string | null
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  costo_unitario?: number
}

export default function ModalDetalleVenta({ venta, onCerrar, onGuardar, plan = 'basic', userId }: Props) {
  const { startTour } = useOnboarding()
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [nombreEdit, setNombreEdit] = useState('')
  const [metodoEdit, setMetodoEdit] = useState<'EFECTIVO' | 'YAPE_PLIN' | 'TARJETA'>('EFECTIVO')
  const [itemsEdit, setItemsEdit] = useState<EditItem[]>([])
  const [busquedaProd, setBusquedaProd] = useState('')
  const [productos, setProductos] = useState<Producto[]>([])

  useEffect(() => {
    if (!venta?.id || !userId || !editando) return
    fetch(`/api/productos?user_id=${userId}&limit=1000`)
      .then((r) => r.json())
      .then((j) => setProductos(j.data || []))
  }, [venta?.id, userId, editando])

  useEffect(() => {
    if (!venta) return
    if (trayectoDone() && !tourDone('modal-detalle-venta')) {
      const t = setTimeout(() => startTour('modal-detalle-venta'), 400)
      return () => clearTimeout(t)
    }
  }, [venta, startTour])

  useEffect(() => {
    if (!venta) return
    if (trayectoDone() && !tourDone('modal-detalle-venta')) {
      const t = setTimeout(() => startTour('modal-detalle-venta'), 400)
      return () => clearTimeout(t)
    }
  }, [venta, startTour])

  if (!venta) return null
  const v = venta

  function iniciarEdicion() {
    setNombreEdit(v.persona_nombre)
    setMetodoEdit(v.metodo_pago as 'EFECTIVO' | 'YAPE_PLIN' | 'TARJETA')
    setItemsEdit(
      (v.items || []).map((it) => ({
        id: it.id,
        producto_id: it.producto_id,
        producto_nombre: it.producto_nombre,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        costo_unitario: it.costo_unitario,
      }))
    )
    setBusquedaProd('')
    setEditando(true)
  }

  function cancelarEdicion() {
    setEditando(false)
    setBusquedaProd('')
  }

  function agregarProducto(prod: Producto) {
    const existe = itemsEdit.find((it) => it.producto_id === prod.id)
    if (existe) {
      setItemsEdit(itemsEdit.map((it) =>
        it.producto_id === prod.id ? { ...it, cantidad: it.cantidad + 1 } : it
      ))
    } else {
      setItemsEdit([...itemsEdit, {
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        cantidad: 1,
        precio_unitario: prod.precio_venta,
      }])
    }
    setBusquedaProd('')
  }

  function quitarProducto(idx: number) {
    setItemsEdit(itemsEdit.filter((_, i) => i !== idx))
  }

  function cambiarCantidad(idx: number, delta: number) {
    const nuevos = [...itemsEdit]
    nuevos[idx].cantidad = Math.max(1, nuevos[idx].cantidad + delta)
    setItemsEdit(nuevos)
  }

  function cambiarPrecio(idx: number, precio: number) {
    const nuevos = [...itemsEdit]
    nuevos[idx].precio_unitario = Math.max(0, precio)
    setItemsEdit(nuevos)
  }

  const totalEdit = itemsEdit.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0)

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(busquedaProd.toLowerCase()))
  )

  async function guardarCambios() {
    if (itemsEdit.length === 0) { toast.error('Agrega al menos un producto'); return }
    if (!nombreEdit.trim()) { toast.error('El nombre del cliente es requerido'); return }
    setGuardando(true)
    const res = await fetch(`/api/ventas/${v.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metodo_pago: metodoEdit,
        persona_nombre: nombreEdit.trim(),
        persona_dni: v.persona_dni,
        items: itemsEdit.map((it) => ({
          producto_id: it.producto_id,
          producto_nombre: it.producto_nombre,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          costo_unitario: it.costo_unitario ?? 0,
        })),
      }),
    })
    const texto = await res.text()
    if (res.ok) {
      const data = (() => { try { return JSON.parse(texto) } catch { return {} } })()
      toast.success('Venta actualizada')
      setEditando(false)
      onGuardar?.(data.data)
    } else {
      const data = (() => { try { return JSON.parse(texto) } catch { return {} } })()
      toast.error(data.error || texto || 'Error al guardar')
    }
    setGuardando(false)
  }

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

  const puedeEditar = venta.estado !== 'ANULADA'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCerrar}>
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-100 px-4 sm:px-8 py-3 sm:py-4 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {editando ? 'Editar venta' : 'Detalle de venta'}
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
              {editando ? 'Modifica los datos y guarda los cambios.' : 'Información completa.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {puedeEditar && !editando && (
              <button
                onClick={iniciarEdicion}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <Pencil size={13} /> Editar
              </button>
            )}
            <TourHelpButton tourId="modal-detalle-venta" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Cliente</div>
            {editando ? (
              <input
                value={nombreEdit}
                onChange={(e) => setNombreEdit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
            ) : (
              <div className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900">
                {venta.persona_nombre}
              </div>
            )}
          </div>

          {editando ? (
            <>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Método de pago</div>
                <div className="grid grid-cols-3 gap-2">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMetodoEdit(m.key)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        metodoEdit === m.key
                          ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400 hover:text-sky-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Productos</div>
                <div className="flex gap-2 mt-1">
                  <input
                    value={busquedaProd}
                    onChange={(e) => setBusquedaProd(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    placeholder="Buscar producto para agregar..."
                  />
                </div>
                {busquedaProd && (
                  <div className="mt-1 max-h-32 overflow-y-auto space-y-1 border border-slate-100 rounded-xl">
                    {productosFiltrados.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => agregarProducto(p)}
                        disabled={p.stock_actual <= 0}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="font-medium text-slate-700">{p.nombre}</span>
                        <span className="text-xs text-slate-400">S/ {p.precio_venta.toFixed(2)} · Stock: {p.stock_actual}</span>
                      </button>
                    ))}
                    {productosFiltrados.length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-400 text-center">Sin resultados</div>
                    )}
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {itemsEdit.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="flex-1 font-medium text-slate-700 truncate">{it.producto_nombre}</span>
                    <button onClick={() => cambiarCantidad(i, -1)} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-semibold text-slate-900">{it.cantidad}</span>
                    <button onClick={() => cambiarCantidad(i, 1)} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <Plus size={14} />
                    </button>
                    <span className="text-slate-400">×</span>
                    <input
                      inputMode="decimal"
                      type="text"
                      value={it.precio_unitario}
                      onChange={(e) => cambiarPrecio(i, parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 rounded border border-slate-200 text-sm text-right"
                    />
                    <span className="text-slate-600 font-mono w-20 text-right">S/ {(it.cantidad * it.precio_unitario).toFixed(2)}</span>
                    <button onClick={() => quitarProducto(i)} className="p-1 rounded text-slate-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {itemsEdit.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-400 text-center">Sin productos</div>
                )}
              </div>

              <div className="text-right text-lg font-bold text-slate-900">
                Total: S/ {totalEdit.toFixed(2)}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">DNI</p>
                  <p className="font-semibold text-slate-900 text-sm">{venta.persona_dni || '—'}</p>
                </div>
                {venta.persona_telefono && (
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Número</p>
                    <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      <span className="font-mono">{venta.persona_telefono}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(String(venta.persona_telefono)); toast.success('Número copiado') }}
                        className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Copiar número"
                      >
                        <Copy size={13} />
                      </button>
                    </p>
                  </div>
                )}
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
                      <Lock size={16} /> Ver planes
                    </p>
                  </button>
                )}
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
            </>
          )}
        </div>

        <div className="border-t border-slate-100 p-3 sm:p-4 flex justify-end gap-2 shrink-0 bg-white rounded-b-[28px]">
          {editando ? (
            <>
              <button onClick={cancelarEdicion} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button
                onClick={guardarCambios}
                disabled={guardando}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-50 transition-all duration-200"
              >
                {guardando && <Loader2 size={14} className="animate-spin" />}
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <button
              onClick={onCerrar}
              className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-lg hover:shadow-sky-500/20 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
