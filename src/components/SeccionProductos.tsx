'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Producto } from '@/types/inventario'
import { UNIDADES_MEDIDA } from '@/types/inventario'

type Props = {
  userId: string
}

function generarSKU(nombre: string): string {
  return nombre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.slice(0, 4).toUpperCase())
    .join('-')
}

const EJEMPLOS = [
  { nombre: 'Polera básica', precio_venta: 29.90, precio_compra: 12.00, stock_actual: 50, stock_minimo: 10, unidad: 'unidad' },
  { nombre: 'Polo manga larga', precio_venta: 39.90, precio_compra: 18.00, stock_actual: 30, stock_minimo: 5, unidad: 'unidad' },
  { nombre: 'Jeans', precio_venta: 59.90, precio_compra: 25.00, stock_actual: 20, stock_minimo: 5, unidad: 'unidad' },
  { nombre: 'Arroz 1kg', precio_venta: 4.50, precio_compra: 3.20, stock_actual: 100, stock_minimo: 20, unidad: 'kg' },
  { nombre: 'Aceite 1L', precio_venta: 9.90, precio_compra: 6.50, stock_actual: 40, stock_minimo: 10, unidad: 'L' },
  { nombre: 'Leche 1L', precio_venta: 5.50, precio_compra: 4.00, stock_actual: 60, stock_minimo: 12, unidad: 'L' },
]

export default function SeccionProductos({ userId }: Props) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [insertandoEjemplos, setInsertandoEjemplos] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Producto>>({})
  const [showNuevo, setShowNuevo] = useState(false)
  const [nuevoForm, setNuevoForm] = useState({
    nombre: '',
    sku: '',
    precio_venta: 0,
    precio_compra: 0,
    stock_actual: 0,
    stock_minimo: 0,
    unidad: 'unidad',
  })

  async function cargarProductos() {
    const params = new URLSearchParams({ user_id: userId })
    if (busqueda) params.set('busqueda', busqueda)
    const res = await fetch(`/api/productos?${params}`)
    const json = await res.json()
    if (res.ok) setProductos(json.data || [])
    setLoading(false)
  }

  useEffect(() => { cargarProductos() }, [userId, busqueda])

  function iniciarEdicion(p: Producto) {
    setEditandoId(p.id)
    setEditForm({ ...p })
  }

  async function guardarEdicion() {
    if (!editandoId) return
    const res = await fetch(`/api/productos/${editandoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      toast.success('Producto actualizado')
      setEditandoId(null)
      cargarProductos()
    } else {
      toast.error('Error al guardar')
    }
  }

  async function eliminarProducto(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Producto eliminado')
      cargarProductos()
    } else {
      toast.error('Error al eliminar')
    }
  }

  async function crearProducto() {
    if (!nuevoForm.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...nuevoForm, user_id: userId }),
    })
    if (res.ok) {
      toast.success('Producto creado')
      setShowNuevo(false)
      setNuevoForm({ nombre: '', sku: '', precio_venta: 0, precio_compra: 0, stock_actual: 0, stock_minimo: 0, unidad: 'unidad' })
      cargarProductos()
    } else {
      toast.error('Error al crear')
    }
  }

  async function insertarEjemplos() {
    setInsertandoEjemplos(true)
    for (const ej of EJEMPLOS) {
      await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ej, sku: generarSKU(ej.nombre), user_id: userId }),
      })
    }
    toast.success(`${EJEMPLOS.length} productos de ejemplo creados`)
    setInsertandoEjemplos(false)
    cargarProductos()
  }

  function SelectUnidad({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-sky-500 rounded px-2 py-1 text-sm focus:outline-none bg-white"
      >
        {UNIDADES_MEDIDA.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
    )
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando productos...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setLoading(true) }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
        <button
          onClick={() => setShowNuevo(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
        >
          <Plus size={16} /> Nuevo
        </button>
        {productos.length === 0 && (
          <button
            onClick={insertarEjemplos}
            disabled={insertandoEjemplos}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {insertandoEjemplos ? 'Insertando...' : 'Insertar ejemplos'}
          </button>
        )}
      </div>

      {productos.length === 0 && !loading && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-semibold text-slate-500">No hay productos</p>
          <p className="text-sm mt-1">Agrega tu primer producto o inserta ejemplos para empezar</p>
        </div>
      )}

      {productos.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">P. Venta</th>
                <th className="px-4 py-3 text-right">P. Compra</th>
                <th className="px-4 py-3 text-center">Und</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((p) => {
                const editando = editandoId === p.id
                const bajoStock = p.stock_actual <= p.stock_minimo && p.stock_minimo > 0
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${bajoStock ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      {editando ? (
                        <input
                          value={editForm.nombre || ''}
                          onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value, sku: generarSKU(e.target.value) })}
                          className="w-full px-2 py-1 rounded border border-sky-500 text-sm focus:outline-none"
                        />
                      ) : (
                        <span className="font-medium text-slate-900">{p.nombre}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {editando ? (
                        <input
                          value={editForm.sku || ''}
                          onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                          className="w-24 px-2 py-1 rounded border border-sky-500 text-sm focus:outline-none"
                        />
                      ) : (
                        <span>{p.sku || '—'}</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${bajoStock ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                      {editando ? (
                        <input
                          type="number"
                          value={editForm.stock_actual ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, stock_actual: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 rounded border border-sky-500 text-sm text-right focus:outline-none"
                        />
                      ) : (
                        <span>{p.stock_actual}</span>
                      )}
                      {p.stock_minimo > 0 && (
                        <span className="text-[11px] text-slate-400 ml-1">/ mín: {p.stock_minimo}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {editando ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.precio_venta ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, precio_venta: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 rounded border border-sky-500 text-sm text-right focus:outline-none"
                        />
                      ) : (
                        <span>S/ {p.precio_venta.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {editando ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.precio_compra ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, precio_compra: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 rounded border border-sky-500 text-sm text-right focus:outline-none"
                        />
                      ) : (
                        <span>S/ {p.precio_compra.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editando ? (
                        <SelectUnidad value={editForm.unidad || 'unidad'} onChange={(v) => setEditForm({ ...editForm, unidad: v })} />
                      ) : (
                        <span className="text-slate-500">{p.unidad}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editando ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={guardarEdicion} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Guardar">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditandoId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => iniciarEdicion(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Editar">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => eliminarProducto(p.id, p.nombre)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowNuevo(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900">Nuevo producto</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</label>
                <input
                  value={nuevoForm.nombre}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, nombre: e.target.value, sku: generarSKU(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  placeholder="Ej: Polera básica"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</label>
                <input
                  value={nuevoForm.sku}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, sku: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  placeholder="Se genera automáticamente"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</label>
                  <input
                    type="number"
                    value={nuevoForm.stock_actual}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, stock_actual: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock mín.</label>
                  <input
                    type="number"
                    value={nuevoForm.stock_minimo}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, stock_minimo: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio venta (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoForm.precio_venta}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, precio_venta: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio compra (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoForm.precio_compra}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, precio_compra: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidad</label>
                <select
                  value={nuevoForm.unidad}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, unidad: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                >
                  {UNIDADES_MEDIDA.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNuevo(false)} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button onClick={crearProducto} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg transition-all">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
