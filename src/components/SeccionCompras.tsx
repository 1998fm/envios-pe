'use client'

import { useEffect, useState } from 'react'
import { Plus, X, RotateCcw, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Compra, Producto } from '@/types/inventario'
import ModalDetalleCompra from '@/components/ModalDetalleCompra'

type Props = { userId: string }

const ESTADOS = ['COMPLETADA', 'ANULADA'] as const

export default function SeccionCompras({ userId }: Props) {
  const [compras, setCompras] = useState<Compra[]>([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNueva, setShowNueva] = useState(false)

  const [compraDetalle, setCompraDetalle] = useState<Compra | null>(null)

  const [proveedor, setProveedor] = useState('')

  const [productos, setProductos] = useState<Producto[]>([])
  const [busquedaProd, setBusquedaProd] = useState('')
  const [itemsCompra, setItemsCompra] = useState<{ producto_id: string; nombre: string; cantidad: number; precio: number }[]>([])
  const [creando, setCreando] = useState(false)

  async function cargarCompras() {
    const params = new URLSearchParams({ user_id: userId })
    if (filtroEstado) params.set('estado', filtroEstado)
    const res = await fetch(`/api/compras?${params}`)
    const json = await res.json()
    if (res.ok) setCompras(json.data || [])
    setLoading(false)
  }

  useEffect(() => { cargarCompras() }, [userId, filtroEstado])

  useEffect(() => {
    if (showNueva) {
      fetch(`/api/productos?user_id=${userId}`).then((r) => r.json()).then((j) => setProductos(j.data || []))
    }
  }, [showNueva, userId])

  function agregarProducto(prod: Producto) {
    // Si ya está en la lista, incrementar cantidad
    const existente = itemsCompra.find((it) => it.producto_id === prod.id)
    if (existente) {
      setItemsCompra(itemsCompra.map((it) =>
        it.producto_id === prod.id ? { ...it, cantidad: it.cantidad + 1 } : it
      ))
      return
    }
    setItemsCompra([...itemsCompra, { producto_id: prod.id, nombre: prod.nombre, cantidad: 1, precio: prod.precio_compra }])
  }

  function quitarProducto(idx: number) {
    setItemsCompra(itemsCompra.filter((_, i) => i !== idx))
  }

  function cambiarCantidad(idx: number, cant: number) {
    const nuevos = [...itemsCompra]
    nuevos[idx].cantidad = Math.max(1, cant)
    setItemsCompra(nuevos)
  }

  function cambiarPrecio(idx: number, precio: number) {
    const nuevos = [...itemsCompra]
    nuevos[idx].precio = Math.max(0, precio)
    setItemsCompra(nuevos)
  }

  const total = itemsCompra.reduce((sum, it) => sum + it.cantidad * it.precio, 0)

  async function crearCompra() {
    if (!proveedor.trim()) { toast.error('Ingresa el nombre del proveedor'); return }
    if (itemsCompra.length === 0) { toast.error('Agrega al menos un producto'); return }
    setCreando(true)
    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        proveedor: proveedor.trim(),
        items: itemsCompra.map((it) => ({
          producto_id: it.producto_id,
          producto_nombre: it.nombre,
          cantidad: it.cantidad,
          precio_unitario: it.precio,
        })),
      }),
    })
    if (res.ok) {
      toast.success('Compra registrada')
      cerrarNueva()
      cargarCompras()
    } else {
      toast.error('Error al registrar compra')
    }
    setCreando(false)
  }

  function cerrarNueva() {
    setShowNueva(false)
    setProveedor('')
    setItemsCompra([])
    setBusquedaProd('')
  }

  async function anularCompra(compra: Compra) {
    if (!confirm('¿Estás seguro de anular esta compra? Se revertirá el stock.')) return
    const res = await fetch(`/api/compras/${compra.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'ANULADA' }),
    })
    if (res.ok) {
      toast.success('Compra anulada')
      cargarCompras()
    } else {
      toast.error('Error al anular compra')
    }
  }

  async function eliminarCompra(id: string) {
    if (!confirm('¿Eliminar esta compra definitivamente?')) return
    const res = await fetch(`/api/compras/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Compra eliminada')
      cargarCompras()
    } else {
      toast.error('Error al eliminar')
    }
  }

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(busquedaProd.toLowerCase()))
  )

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando compras...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowNueva(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
        >
          <Plus size={16} /> Nueva compra
        </button>
        <div className="flex gap-1">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(filtroEstado === e ? '' : e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filtroEstado === e
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {e === 'COMPLETADA' ? 'Completadas' : 'Anuladas'}
            </button>
          ))}
        </div>
      </div>

      {compras.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-semibold text-slate-500">No hay compras</p>
          <p className="text-sm mt-1">Registra tu primera compra</p>
        </div>
      )}

      {compras.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-right">Productos</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Fecha</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {compras.map((c) => {
                const badge = {
                  COMPLETADA: 'bg-emerald-100 text-emerald-700',
                  ANULADA: 'bg-red-100 text-red-700',
                }[c.estado]
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.proveedor}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{c.items?.length ?? 0} ítems</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">S/ {c.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setCompraDetalle(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Ver detalle">
                          <Eye size={15} />
                        </button>
                        {c.estado === 'COMPLETADA' && (
                          <button onClick={() => anularCompra(c)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Anular">
                            <RotateCcw size={15} />
                          </button>
                        )}
                        {c.estado !== 'COMPLETADA' && (
                          <button onClick={() => eliminarCompra(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNueva && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={cerrarNueva}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="shrink-0 p-6 pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Nueva compra</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</label>
                <input
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agregar productos</label>
                <input
                  value={busquedaProd}
                  onChange={(e) => setBusquedaProd(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  placeholder="Buscar producto..."
                />
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {productosFiltrados.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => agregarProducto(p)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium text-slate-700">{p.nombre}</span>
                      <span className="text-xs text-slate-400">S/ {p.precio_compra.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {itemsCompra.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items de la compra</label>
                  <div className="mt-1 divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {itemsCompra.map((it, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <span className="flex-1 font-medium text-slate-700 truncate">{it.nombre}</span>
                        <input
                          type="number"
                          value={it.cantidad}
                          onChange={(e) => cambiarCantidad(i, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 rounded border border-slate-200 text-sm text-center"
                          min={1}
                        />
                        <span className="text-slate-400">×</span>
                        <input
                          type="number"
                          step="0.01"
                          value={it.precio}
                          onChange={(e) => cambiarPrecio(i, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 rounded border border-slate-200 text-sm text-right"
                          min={0}
                        />
                        <span className="text-slate-600 font-mono w-20 text-right">S/ {(it.cantidad * it.precio).toFixed(2)}</span>
                        <button onClick={() => quitarProducto(i)} className="p-1 rounded text-slate-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-right mt-2 text-lg font-bold text-slate-900">
                    Total: S/ {total.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-200 p-4 flex gap-3">
              <button onClick={cerrarNueva} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button onClick={crearCompra} disabled={creando || !proveedor.trim() || itemsCompra.length === 0} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg disabled:opacity-50 transition-all">
                {creando ? 'Registrando...' : 'Registrar compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalDetalleCompra compra={compraDetalle} onCerrar={() => setCompraDetalle(null)} />
    </div>
  )
}
