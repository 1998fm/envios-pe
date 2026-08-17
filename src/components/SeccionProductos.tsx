'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Check, X, Printer, Lock } from 'lucide-react'
import { toast } from 'sonner'
import type { Producto } from '@/types/inventario'
import { UNIDADES_MEDIDA } from '@/types/inventario'
import { useConfirm } from '@/components/ConfirmDialog'
import { useOnboarding } from '@/context/OnboardingContext'
import { tourDone, trayectoDone } from '@/lib/tours'
import TourHelpButton from '@/components/TourHelpButton'
import { openUpgrade, planNivel } from '@/lib/planGating'
import EtiquetasProducto, { TAMANOS_ETIQUETA_PRODUCTO, type TamanoEtiquetaProducto } from '@/components/EtiquetasProducto'

type Props = {
  userId: string
  plan?: string
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

export default function SeccionProductos({ userId, plan = 'basic' }: Props) {
  const confirmar = useConfirm()
  const { startTour } = useOnboarding()
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [insertandoEjemplos, setInsertandoEjemplos] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Producto>>({})
  const [showNuevo, setShowNuevo] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [mostrarModalImprimir, setMostrarModalImprimir] = useState(false)
  const [imprimirProducto, setImprimirProducto] = useState<Producto | null>(null)
  const [tamanoEtiqueta, setTamanoEtiqueta] = useState<TamanoEtiquetaProducto>(TAMANOS_ETIQUETA_PRODUCTO[0])
  const [nuevoForm, setNuevoForm] = useState({
    nombre: '',
    sku: '',
    precio_venta: 0,
    precio_compra: 0,
    stock_actual: 0,
    stock_minimo: 0,
    unidad: 'unidad',
  })

  async function cargarProductos(offset = 0, append = false) {
    const params = new URLSearchParams({ user_id: userId })
    if (busqueda) params.set('busqueda', busqueda)
    params.set('offset', String(offset))
    const res = await fetch(`/api/productos?${params}`)
    const json = await res.json()
    if (res.ok) {
      setProductos((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []))
      setHasMore((json.offset + json.data.length) < json.total)
    }
    setLoading(false)
  }

  useEffect(() => { cargarProductos() }, [userId, busqueda])

  async function cargarMas() {
    setCargandoMas(true)
    await cargarProductos(productos.length, true)
    setCargandoMas(false)
  }

  useEffect(() => {
    if (showNuevo && trayectoDone() && !tourDone('modal-nuevo-producto')) {
      const t = setTimeout(() => startTour('modal-nuevo-producto'), 400)
      return () => clearTimeout(t)
    }
  }, [showNuevo, startTour])

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
    if (!(await confirmar({ message: `¿Eliminar "${nombre}"?`, danger: true, confirmLabel: 'Sí, eliminar' }))) return
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
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Límite alcanzado')
        openUpgrade()
        return
      }
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
        <div data-tour="productos-buscar" className="relative flex-1 min-w-[200px]">
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
          data-tour="productos-nuevo"
          onClick={() => setShowNuevo(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
        >
          <Plus size={16} /> Nuevo
        </button>
        {productos.length === 0 && (
          <button
            data-tour="productos-ejemplos"
            onClick={insertarEjemplos}
            disabled={insertandoEjemplos}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {insertandoEjemplos ? 'Insertando...' : 'Insertar ejemplos'}
          </button>
        )}
      </div>

      {productos.length === 0 && !loading && (
        <div data-tour="productos-vacio" className="text-center py-16 text-slate-400">
          <p className="text-lg font-semibold text-slate-500">No hay productos</p>
          <p className="text-sm mt-1">Agrega tu primer producto o inserta ejemplos para empezar</p>
        </div>
      )}

      {productos.length > 0 && (
        <div data-tour="productos-tabla" className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                          inputMode="numeric"
                          pattern="[0-9]*"
                          type="text"
                          value={String(editForm.stock_actual ?? 0)}
                          onChange={(e) => setEditForm({ ...editForm, stock_actual: parseInt(e.target.value, 10) || 0 })}
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
                          inputMode="numeric"
                          pattern="[0-9]*"
                          type="text"
                          value={String(editForm.precio_venta ?? 0)}
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
                          inputMode="numeric"
                          pattern="[0-9]*"
                          type="text"
                          value={String(editForm.precio_compra ?? 0)}
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
                          <button onClick={() => { if (planNivel(plan) < 1) { openUpgrade(); return } setImprimirProducto(p); setMostrarModalImprimir(true) }} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title={planNivel(plan) < 1 ? 'Disponible en Pro y Business Plus' : 'Imprimir etiqueta'}>
                            <Printer size={16} />
                          </button>
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

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={cargarMas}
            disabled={cargandoMas}
            className="px-5 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {cargandoMas ? 'Cargando...' : 'Cargar más productos'}
          </button>
        </div>
      )}

      {showNuevo && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowNuevo(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Nuevo producto</h3>
                <TourHelpButton tourId="modal-nuevo-producto" />
              </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</label>
                <div data-tour="nuevo-producto-nombre">
                <input
                  value={nuevoForm.nombre}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, nombre: e.target.value, sku: generarSKU(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  placeholder="Ej: Polera básica"
                />
                </div>
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
              <div data-tour="nuevo-producto-stock" className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</label>
                   <input
                     inputMode="numeric"
                     pattern="[0-9]*"
                     type="text"
                     value={nuevoForm.stock_actual || ''}
                     onChange={(e) => setNuevoForm({ ...nuevoForm, stock_actual: parseInt(e.target.value, 10) || 0 })}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                   />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock mín.</label>
                   <input
                     inputMode="numeric"
                     pattern="[0-9]*"
                     type="text"
                     value={nuevoForm.stock_minimo || ''}
                     onChange={(e) => setNuevoForm({ ...nuevoForm, stock_minimo: parseInt(e.target.value, 10) || 0 })}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                   />
                 </div>
              </div>
               <div data-tour="nuevo-producto-precios" className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio venta (S/)</label>
                   <input
                     inputMode="numeric"
                     pattern="[0-9]*"
                     type="text"
                     value={nuevoForm.precio_venta || ''}
                     onChange={(e) => setNuevoForm({ ...nuevoForm, precio_venta: parseFloat(e.target.value) || 0 })}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                   />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio compra (S/)</label>
                   <input
                     inputMode="numeric"
                     pattern="[0-9]*"
                     type="text"
                     value={nuevoForm.precio_compra || ''}
                     onChange={(e) => setNuevoForm({ ...nuevoForm, precio_compra: parseFloat(e.target.value) || 0 })}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                   />
                 </div>
               </div>
               <div>
                 {planNivel(plan) < 1 ? (
                   <button
                     onClick={openUpgrade}
                     className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold flex items-center justify-between bg-slate-50 text-slate-500 border border-dashed border-slate-300 hover:border-sky-300 transition-colors"
                     title="Disponible en Pro y Business Plus"
                   >
                     <span className="flex items-center gap-2">
                       <Lock size={14} className="text-slate-400" />
                       Ganancia por venta
                     </span>
                     <span className="text-xs font-semibold text-sky-600">Ver planes</span>
                   </button>
                 ) : (
                  (() => {
                   const ganancia = nuevoForm.precio_venta - nuevoForm.precio_compra
                   const pct = nuevoForm.precio_venta > 0 ? (ganancia / nuevoForm.precio_venta) * 100 : 0
                   const positivo = nuevoForm.precio_venta > 0 && ganancia >= 0
                   const sinDatos = nuevoForm.precio_venta <= 0 && nuevoForm.precio_compra <= 0
                   return (
                     <div className={`rounded-xl px-3 py-2.5 text-sm font-semibold flex items-center justify-between ${
                       sinDatos
                         ? 'bg-slate-50 text-slate-400'
                         : positivo
                         ? 'bg-emerald-50 text-emerald-700'
                         : 'bg-red-50 text-red-600'
                     }`}>
                       <span>Ganancia</span>
                       <span>
                         {sinDatos
                           ? '—'
                           : `S/ ${ganancia.toFixed(2)} · ${pct.toFixed(0)}%`}
                       </span>
                     </div>
                   )
                  })()
                 )}
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
               <button
                 data-tour="nuevo-producto-crear"
                 onClick={crearProducto}
                 className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg transition-all"
               >
                 Crear
               </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalImprimir && imprimirProducto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setMostrarModalImprimir(false); setImprimirProducto(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Imprimir etiqueta</h3>
              <button onClick={() => { setMostrarModalImprimir(false); setImprimirProducto(null) }} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 truncate">
                {imprimirProducto.nombre}
              </div>
              {imprimirProducto.sku && (
                <div className="mt-1 text-xs font-mono text-slate-400 px-3">
                  {imprimirProducto.sku}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tamaño de etiqueta</label>
              <select
                value={`${tamanoEtiqueta.anchoMm}x${tamanoEtiqueta.altoMm}`}
                onChange={(e) => {
                  const t = TAMANOS_ETIQUETA_PRODUCTO.find(
                    (t) => `${t.anchoMm}x${t.altoMm}` === e.target.value
                  )
                  if (t) setTamanoEtiqueta(t)
                }}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              >
                {TAMANOS_ETIQUETA_PRODUCTO.map((t) => (
                  <option key={`${t.anchoMm}x${t.altoMm}`} value={`${t.anchoMm}x${t.altoMm}`}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => { setMostrarModalImprimir(false); setImprimirProducto(null) }} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button
                onClick={() => {
                  setMostrarModalImprimir(false)
                  setTimeout(() => {
                    window.print()
                  }, 300)
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg transition-all"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {imprimirProducto && (
        <EtiquetasProducto
          productos={[imprimirProducto]}
          tamano={tamanoEtiqueta}
        />
      )}
    </div>
  )
}
