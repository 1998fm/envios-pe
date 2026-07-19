'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Check, X, RotateCcw, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { Venta, Producto } from '@/types/inventario'
import ModalDetalleVenta from '@/components/ModalDetalleVenta'

type Props = { userId: string }

const ESTADOS = ['COMPLETADA', 'ANULADA'] as const

export default function SeccionVentas({ userId }: Props) {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNueva, setShowNueva] = useState(false)

  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null)

  const [busquedaCli, setBusquedaCli] = useState('')
  const [personaSel, setPersonaSel] = useState<{ id: string; nombre: string; dni: string; telefono?: string } | null>(null)
  const [buscandoPersona, setBuscandoPersona] = useState(false)
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false)
  const [nuevoCliForm, setNuevoCliForm] = useState({ dni: '', nombre: '', telefono: '' })
  const [creandoCliente, setCreandoCliente] = useState(false)

  const [productos, setProductos] = useState<Producto[]>([])
  const [busquedaProd, setBusquedaProd] = useState('')
  const [itemsVenta, setItemsVenta] = useState<{ producto_id: string; nombre: string; cantidad: number; precio: number }[]>([])
  const [creando, setCreando] = useState(false)

  async function cargarVentas() {
    const params = new URLSearchParams({ user_id: userId })
    if (filtroEstado) params.set('estado', filtroEstado)
    const res = await fetch(`/api/ventas?${params}`)
    const json = await res.json()
    if (res.ok) setVentas(json.data || [])
    setLoading(false)
  }

  useEffect(() => { cargarVentas() }, [userId, filtroEstado])

  useEffect(() => {
    if (showNueva) {
      fetch(`/api/productos?user_id=${userId}`).then((r) => r.json()).then((j) => setProductos(j.data || []))
    }
  }, [showNueva, userId])

  async function buscarPersona() {
    if (busquedaCli.length < 3) return
    setBuscandoPersona(true)
    setMostrarNuevoCliente(false)

    const res = await fetch(`/api/personas?user_id=${userId}&busqueda=${busquedaCli}`)
    const json = await res.json()
    if (json.data) {
      setPersonaSel({ id: json.data.id, nombre: json.data.nombre, dni: json.data.dni, telefono: json.data.telefono })
    } else {
      setPersonaSel(null)
      setMostrarNuevoCliente(true)
      setNuevoCliForm({
        dni: busquedaCli.length === 8 ? busquedaCli : '',
        nombre: '',
        telefono: busquedaCli.length > 8 ? busquedaCli : '',
      })
    }
    setBuscandoPersona(false)
  }

  async function crearNuevoCliente() {
    if (!nuevoCliForm.nombre.trim()) {
      toast.error('Nombre es requerido')
      return
    }
    setCreandoCliente(true)
    const res = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, dni: nuevoCliForm.dni || null, nombre: nuevoCliForm.nombre, telefono: nuevoCliForm.telefono || null }),
    })
    const json = await res.json()
    if (res.ok) {
      setPersonaSel({ id: json.data.id, nombre: nuevoCliForm.nombre, dni: nuevoCliForm.dni, telefono: nuevoCliForm.telefono })
      setMostrarNuevoCliente(false)
      toast.success('Cliente registrado')
    } else {
      toast.error(json.error || 'Error al crear cliente')
    }
    setCreandoCliente(false)
  }

  function agregarProducto(prod: Producto) {
    setItemsVenta([...itemsVenta, { producto_id: prod.id, nombre: prod.nombre, cantidad: 1, precio: prod.precio_venta }])
  }

  function quitarProducto(idx: number) {
    setItemsVenta(itemsVenta.filter((_, i) => i !== idx))
  }

  function cambiarCantidad(idx: number, cant: number) {
    const nuevos = [...itemsVenta]
    nuevos[idx].cantidad = Math.max(1, cant)
    setItemsVenta(nuevos)
  }

  function cambiarPrecio(idx: number, precio: number) {
    const nuevos = [...itemsVenta]
    nuevos[idx].precio = Math.max(0, precio)
    setItemsVenta(nuevos)
  }

  const total = itemsVenta.reduce((sum, it) => sum + it.cantidad * it.precio, 0)

  async function crearVenta() {
    if (!personaSel) { toast.error('Selecciona un cliente'); return }
    if (itemsVenta.length === 0) { toast.error('Agrega al menos un producto'); return }
    setCreando(true)
    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        persona_id: personaSel.id,
        persona_nombre: personaSel.nombre,
        persona_dni: personaSel.dni,
        items: itemsVenta.map((it) => ({
          producto_id: it.producto_id,
          producto_nombre: it.nombre,
          cantidad: it.cantidad,
          precio_unitario: it.precio,
        })),
      }),
    })
    if (res.ok) {
      toast.success('Venta creada')
      cerrarNueva()
      cargarVentas()
    } else {
      toast.error('Error al crear venta')
    }
    setCreando(false)
  }

  function cerrarNueva() {
    setShowNueva(false)
    setPersonaSel(null)
    setBusquedaCli('')
    setItemsVenta([])
    setBusquedaProd('')
    setMostrarNuevoCliente(false)
    setNuevoCliForm({ dni: '', nombre: '', telefono: '' })
  }

  async function anularVenta(venta: Venta) {
    if (!confirm('¿Estás seguro de anular esta venta? Se restaurará el stock.')) return
    const res = await fetch(`/api/ventas/${venta.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'ANULADA' }),
    })
    if (res.ok) {
      toast.success('Venta anulada')
      cargarVentas()
    } else {
      toast.error('Error al anular venta')
    }
  }

  async function eliminarVenta(id: string) {
    if (!confirm('¿Eliminar esta venta definitivamente?')) return
    const res = await fetch(`/api/ventas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Venta eliminada')
      cargarVentas()
    } else {
      toast.error('Error al eliminar')
    }
  }

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(busquedaProd.toLowerCase()))
  )

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando ventas...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowNueva(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
        >
          <Plus size={16} /> Nueva venta
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

      {ventas.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-semibold text-slate-500">No hay ventas</p>
          <p className="text-sm mt-1">Registra tu primera venta</p>
        </div>
      )}

      {ventas.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3 text-right">Productos</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Estado Venta</th>
                <th className="px-4 py-3 text-center">Envío</th>
                <th className="px-4 py-3 text-right">Fecha</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventas.map((v) => {
                const badge = {
                  COMPLETADA: 'bg-emerald-100 text-emerald-700',
                  ANULADA: 'bg-red-100 text-red-700',
                }[v.estado]
                return (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{v.persona_nombre}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{v.persona_dni}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{v.items?.length ?? 0} ítems</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">S/ {v.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        v.estado_envio === 'ENVIADO' ? 'bg-emerald-100 text-emerald-700' :
                        v.estado_envio === 'EMPACADO' ? 'bg-amber-100 text-amber-700' :
                        v.estado_envio === 'ENTREGADO' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {v.estado_envio || 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      {new Date(v.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setVentaDetalle(v)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Ver detalle">
                          <Eye size={15} />
                        </button>
                        {v.estado === 'COMPLETADA' && (
                          <button onClick={() => anularVenta(v)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Anular">
                            <RotateCcw size={15} />
                          </button>
                        )}
                        {v.estado !== 'COMPLETADA' && (
                          <button onClick={() => eliminarVenta(v.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
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
              <h3 className="text-lg font-bold text-slate-900">Nueva venta</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Buscar cliente por DNI o teléfono</label>
                <div className="flex gap-2 mt-1">
                  <input
                    value={busquedaCli}
                    onChange={(e) => setBusquedaCli(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarPersona()}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    placeholder="Ingresa DNI o teléfono del cliente"
                  />
                  <button onClick={buscarPersona} disabled={buscandoPersona} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2">
                    {buscandoPersona && <Loader2 size={14} className="animate-spin" />}
                    Buscar
                  </button>
                </div>
                {personaSel && (
                  <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
                    <Check size={14} />
                    {personaSel.nombre} — {personaSel.dni}
                    {personaSel.telefono && <span className="text-emerald-600">· {personaSel.telefono}</span>}
                  </div>
                )}
                {mostrarNuevoCliente && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente no encontrado — Regístralo</p>
                    <input
                      value={nuevoCliForm.nombre}
                      onChange={(e) => setNuevoCliForm({ ...nuevoCliForm, nombre: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                      placeholder="Nombre completo"
                    />
                    <div className="flex gap-2">
                      <input
                        value={nuevoCliForm.dni}
                        onChange={(e) => setNuevoCliForm({ ...nuevoCliForm, dni: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        placeholder="DNI"
                      />
                      <input
                        value={nuevoCliForm.telefono}
                        onChange={(e) => setNuevoCliForm({ ...nuevoCliForm, telefono: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        placeholder="Teléfono"
                      />
                    </div>
                    <button onClick={crearNuevoCliente} disabled={creandoCliente} className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50">
                      {creandoCliente ? 'Registrando...' : 'Registrar cliente'}
                    </button>
                  </div>
                )}
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
                      disabled={p.stock_actual <= 0}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="font-medium text-slate-700">{p.nombre}</span>
                      <span className="text-xs text-slate-400">S/ {p.precio_venta.toFixed(2)} · Stock: {p.stock_actual}</span>
                    </button>
                  ))}
                </div>
              </div>

              {itemsVenta.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items de la venta</label>
                  <div className="mt-1 divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {itemsVenta.map((it, i) => (
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
              <button onClick={crearVenta} disabled={creando || !personaSel || itemsVenta.length === 0} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg disabled:opacity-50 transition-all">
                {creando ? 'Creando...' : 'Crear venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalDetalleVenta venta={ventaDetalle} onCerrar={() => setVentaDetalle(null)} />
    </div>
  )
}
