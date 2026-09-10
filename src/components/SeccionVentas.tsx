'use client'

import { useEffect, useState } from 'react'
import { Plus, Minus, Check, X, RotateCcw, Loader2, Eye, ScanBarcode, Lock, ArrowRight, Banknote, Smartphone, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import type { Venta, Producto } from '@/types/inventario'
import ModalDetalleVenta from '@/components/ModalDetalleVenta'
import EscannerVentas from '@/components/EscannerVentas'
import { useConfirm } from '@/components/ConfirmDialog'
import { useOnboarding } from '@/context/OnboardingContext'
import { tourDone, trayectoDone } from '@/lib/tours'
import TourHelpButton from '@/components/TourHelpButton'
import { openUpgrade, planNivel } from '@/lib/planGating'
import { beepOk, beepError } from '@/lib/beep'

type Props = { userId: string; plan?: string }

const ESTADOS = ['COMPLETADA', 'ANULADA', 'PENDIENTE'] as const

const METODOS_PAGO = [
  { key: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
  { key: 'YAPE_PLIN', label: 'Yape / Plin', icon: Smartphone },
  { key: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
] as const

export default function SeccionVentas({ userId, plan = 'basic' }: Props) {
  const confirmar = useConfirm()
  const { startTour } = useOnboarding()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNueva, setShowNueva] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cargandoMas, setCargandoMas] = useState(false)

  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null)

  const [busquedaCli, setBusquedaCli] = useState('')
  const [personaSel, setPersonaSel] = useState<{ id: string; nombre: string; dni: string; telefono?: string } | null>(null)
  const [buscandoPersona, setBuscandoPersona] = useState(false)
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false)
  const [nuevoCliForm, setNuevoCliForm] = useState({ dni: '', nombre: '', telefono: '' })
  const [creandoCliente, setCreandoCliente] = useState(false)

  const [productos, setProductos] = useState<Producto[]>([])
  const [busquedaProd, setBusquedaProd] = useState('')
  const [showEscanner, setShowEscanner] = useState(false)
  const [itemsVenta, setItemsVenta] = useState<{ producto_id: string; nombre: string; cantidad: string; precio: number }[]>([])
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'YAPE_PLIN' | 'TARJETA'>('EFECTIVO')
  const [pagoEstado, setPagoEstado] = useState<'COMPLETADA' | 'PENDIENTE'>('COMPLETADA')
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [creando, setCreando] = useState(false)

  async function cargarVentas(offset = 0, append = false) {
    const params = new URLSearchParams({ user_id: userId })
    if (filtroEstado) params.set('estado', filtroEstado)
    params.set('offset', String(offset))
    const res = await fetch(`/api/ventas?${params}`)
    const json = await res.json()
    if (res.ok) {
      setVentas((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []))
      setHasMore((json.offset + json.data.length) < json.total)
    }
    setLoading(false)
  }

  useEffect(() => { cargarVentas() }, [userId, filtroEstado])

  async function cargarMas() {
    setCargandoMas(true)
    await cargarVentas(ventas.length, true)
    setCargandoMas(false)
  }

  useEffect(() => {
    if (showNueva && trayectoDone() && !tourDone('modal-nueva-venta')) {
      const t = setTimeout(() => startTour('modal-nueva-venta'), 400)
      return () => clearTimeout(t)
    }
  }, [showNueva, startTour])

  useEffect(() => {
    if (ventaDetalle && trayectoDone() && !tourDone('modal-detalle-venta')) {
      const t = setTimeout(() => startTour('modal-detalle-venta'), 400)
      return () => clearTimeout(t)
    }
  }, [ventaDetalle, startTour])

  useEffect(() => {
    if (showNueva) {
      fetch(`/api/productos?user_id=${userId}&limit=1000`).then((r) => r.json()).then((j) => setProductos(j.data || []))
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
    const existe = itemsVenta.find((it) => it.producto_id === prod.id)
    if (existe) {
      setItemsVenta(itemsVenta.map((it) =>
        it.producto_id === prod.id ? { ...it, cantidad: String((Number(it.cantidad) || 0) + 1) } : it,
      ))
    } else {
      setItemsVenta([...itemsVenta, { producto_id: prod.id, nombre: prod.nombre, cantidad: '1', precio: prod.precio_venta }])
    }
  }

  function manejarCodigoEscaneado(codigo: string) {
    const codigoLimpio = codigo.trim()
    if (!codigoLimpio) return
    const prod = productos.find((p) => p.id === codigoLimpio || (p.sku && p.sku === codigoLimpio))
    if (!prod) {
      beepError()
      toast.error('Producto no encontrado con ese código')
      return
    }
    const existe = itemsVenta.find((it) => it.producto_id === prod.id)
    if (existe) {
      const nuevos = itemsVenta.map((it) =>
        it.producto_id === prod.id ? { ...it, cantidad: String((Number(it.cantidad) || 0) + 1) } : it,
      )
      setItemsVenta(nuevos)
    } else {
      agregarProducto(prod)
    }
    beepOk()
    toast.success(`${prod.nombre} agregado a la venta`)
  }

  function quitarProducto(idx: number) {
    setItemsVenta(itemsVenta.filter((_, i) => i !== idx))
  }

  function cambiarCantidad(idx: number, cant: string) {
    const nuevos = [...itemsVenta]
    nuevos[idx].cantidad = cant
    setItemsVenta(nuevos)
  }

  function cambiarPrecio(idx: number, precio: number) {
    const nuevos = [...itemsVenta]
    nuevos[idx].precio = Math.max(0, precio)
    setItemsVenta(nuevos)
  }

  const total = itemsVenta.reduce((sum, it) => sum + (Number(it.cantidad) || 0) * it.precio, 0)

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
        metodo_pago: metodoPago,
        ...(metodoPago !== 'TARJETA' ? { estado: pagoEstado } : {}),
        items: itemsVenta.map((it) => ({
          producto_id: it.producto_id,
          producto_nombre: it.nombre,
          cantidad: Math.max(1, Number(it.cantidad) || 1),
          precio_unitario: it.precio,
        })),
      }),
    })
    if (res.ok) {
      toast.success('Venta creada')
      cerrarNueva()
      cargarVentas()
    } else {
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Límite alcanzado')
        openUpgrade()
        setCreando(false)
        return
      }
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
    setMetodoPago('EFECTIVO')
    setPagoEstado('COMPLETADA')
    setPaso(1)
    setMostrarNuevoCliente(false)
    setNuevoCliForm({ dni: '', nombre: '', telefono: '' })
  }

  async function anularVenta(venta: Venta) {
    if (!(await confirmar({ message: '¿Estás seguro de anular esta venta? Se restaurará el stock.', danger: true, confirmLabel: 'Sí, anular' }))) return
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

  async function confirmarVenta(venta: Venta) {
    if (!(await confirmar({ message: '¿Confirmar que el pago con tarjeta fue recibido?', confirmLabel: 'Sí, confirmar' }))) return
    const res = await fetch(`/api/ventas/${venta.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'COMPLETADA' }),
    })
    if (res.ok) {
      toast.success('Venta completada')
      cargarVentas()
    } else {
      toast.error('Error al confirmar venta')
    }
  }

  async function eliminarVenta(id: string) {
    if (!(await confirmar({ message: '¿Eliminar esta venta definitivamente?', danger: true, confirmLabel: 'Sí, eliminar' }))) return
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
          data-tour="ventas-nueva"
          onClick={() => setShowNueva(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
        >
          <Plus size={16} /> Nueva venta
        </button>
        <div data-tour="ventas-filtros" className="flex gap-1">
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
              {e === 'COMPLETADA' ? 'Completadas' : e === 'PENDIENTE' ? 'Pendientes' : 'Anuladas'}
            </button>
          ))}
        </div>
      </div>

      {ventas.length === 0 && (
        <div data-tour="ventas-vacio" className="text-center py-16 text-slate-400">
          <p className="text-lg font-semibold text-slate-500">No hay ventas</p>
          <p className="text-sm mt-1">Registra tu primera venta</p>
        </div>
      )}

      {ventas.length > 0 && (
        <div data-tour="ventas-tabla" className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3 text-right">Productos</th>
                <th className="px-4 py-3 text-right">Total</th>
                {planNivel(plan) >= 1 && <th className="px-4 py-3 text-right">Ganancia</th>}
                <th className="px-4 py-3 text-center">Pago</th>
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
                  PENDIENTE: 'bg-amber-100 text-amber-700',
                }[v.estado]

                const costo = (v.items || []).reduce(
                  (sum, it) => sum + (it.costo_unitario ?? 0) * it.cantidad,
                  0
                )
                const ganancia = v.total - costo
                const pctGanancia = v.total > 0 ? (ganancia / v.total) * 100 : 0
                const pctText = `${pctGanancia >= 0 ? '' : ''}${pctGanancia.toFixed(0)}%`
                const gananciaText = `S/ ${ganancia.toFixed(2)}`

                return (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{v.persona_nombre}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{v.persona_dni}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{v.items?.length ?? 0} ítems</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">S/ {v.total.toFixed(2)}</td>
                    {planNivel(plan) >= 1 && (
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-emerald-600">{gananciaText}</span>
                        <span className="block text-[11px] text-slate-400">{pctText}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        v.metodo_pago === 'TARJETA' ? 'bg-indigo-100 text-indigo-700' :
                        v.metodo_pago === 'YAPE_PLIN' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {v.metodo_pago === 'EFECTIVO' ? 'Efectivo' : v.metodo_pago === 'YAPE_PLIN' ? 'Yape / Plin' : 'Tarjeta'}
                      </span>
                    </td>
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
                        v.estado_envio === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-700' :
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
                        <button data-tour="ventas-detalle" onClick={() => setVentaDetalle(v)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Ver detalle">
                          <Eye size={15} />
                        </button>
                        {v.estado === 'PENDIENTE' && (
                          <button onClick={() => confirmarVenta(v)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Marcar como completada">
                            <Check size={15} />
                          </button>
                        )}
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

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={cargarMas}
            disabled={cargandoMas}
            className="px-5 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {cargandoMas ? 'Cargando...' : 'Cargar más ventas'}
          </button>
        </div>
      )}

      {showNueva && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={cerrarNueva}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="shrink-0 p-5 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Nueva venta</h3>
                <TourHelpButton tourId="modal-nueva-venta" />
              </div>
              <div className="mt-4 flex items-center gap-1">
                {[
                  { n: 1, label: 'Cliente', listo: !!personaSel },
                  { n: 2, label: 'Productos', listo: itemsVenta.length > 0 },
                  { n: 3, label: 'Pago', listo: false },
                ].map((p, idx) => (
                  <div key={p.n} className="flex items-center">
                    <button
                      onClick={() => setPaso(p.n as 1 | 2 | 3)}
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        paso === p.n
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                          : p.listo
                          ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        paso === p.n ? 'bg-white/25' : 'bg-white/90'
                      }`}>
                        {p.listo && paso !== p.n ? <Check size={10} /> : p.n}
                      </span>
                      {p.label}
                    </button>
                    {idx < 2 && <span className="h-px w-4 bg-slate-200 mx-1" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 grid lg:grid-cols-[1fr_340px] overflow-hidden min-h-0">
              {/* ===== PASO 1: CLIENTE ===== */}
              {paso === 1 && (
                <div className="overflow-y-auto p-6 space-y-5" data-tour="nueva-venta-cliente">
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
                      <button
                        onClick={() => { setPersonaSel(null); setMostrarNuevoCliente(true) }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-2 shrink-0"
                      >
                        <Plus size={14} /> Registro rápido
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
                  <div className="flex justify-end">
                    <button
                      onClick={() => setPaso(2)}
                      disabled={!personaSel}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Continuar <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ===== PASO 2: PRODUCTOS ===== */}
              {paso === 2 && (
                <div className="overflow-y-auto p-6 space-y-5" data-tour="nueva-venta-productos">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agregar productos</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        value={busquedaProd}
                        onChange={(e) => setBusquedaProd(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        placeholder="Buscar producto..."
                      />
                      {planNivel(plan) >= 2 ? (
                        <button
                          onClick={() => setShowEscanner(true)}
                          title="Escanear código QR de producto"
                          className="shrink-0 px-3 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-2"
                        >
                          <ScanBarcode size={16} /> Escanear
                        </button>
                      ) : (
                        <button
                          onClick={openUpgrade}
                          title="Lector de QR — disponible en Business Plus"
                          className="shrink-0 px-3 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-sky-400 hover:text-sky-600 flex items-center gap-2 transition-all duration-150 cursor-pointer"
                        >
                          <Lock size={14} /> Escanear
                        </button>
                      )}
                    </div>
                    <div className="mt-2 max-h-72 overflow-y-auto space-y-1">
                      {productosFiltrados.length === 0 && (
                        <p className="text-sm text-slate-400 py-2">No hay productos que coincidan.</p>
                      )}
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
                  <div className="flex justify-end">
                    <button
                      onClick={() => setPaso(3)}
                      disabled={itemsVenta.length === 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Continuar <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ===== PASO 3: PAGO ===== */}
              {paso === 3 && (
                <div className="overflow-y-auto p-6 space-y-5" data-tour="nueva-venta-pago">
                  {itemsVenta.length === 0 ? (
                    <p className="text-sm text-slate-400">Primero agrega productos en el paso anterior.</p>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Método de pago</label>
                        <div className="mt-1 grid grid-cols-3 gap-2">
                          {METODOS_PAGO.map((m) => (
                            <button
                              key={m.key}
                              onClick={() => setMetodoPago(m.key)}
                              className={`px-3 py-3 rounded-xl text-sm font-semibold border transition-all flex flex-col items-center gap-1 ${
                                metodoPago === m.key
                                  ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/20'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400 hover:text-sky-700'
                              }`}
                            >
                              <m.icon size={18} />
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {metodoPago !== 'TARJETA' && (
                        <div data-tour="nueva-venta-pago-estado">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">¿El pago ya se realizó?</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setPagoEstado('COMPLETADA')}
                              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                pagoEstado === 'COMPLETADA'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                              }`}
                            >
                              <Check size={15} /> Sí, ya pagó
                            </button>
                            <button
                              onClick={() => setPagoEstado('PENDIENTE')}
                              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                pagoEstado === 'PENDIENTE'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400 hover:text-amber-700'
                              }`}
                            >
                              Pendiente
                            </button>
                          </div>
                          {pagoEstado === 'PENDIENTE' && (
                            <p className="mt-1.5 text-xs text-amber-600">
                              La venta se registrará como <strong>Pendiente</strong> hasta que confirmes el pago.
                            </p>
                          )}
                        </div>
                      )}
                      {metodoPago === 'TARJETA' && (
                        <p className="text-xs text-amber-600">
                          El pago con tarjeta se registrará como <strong>Pendiente</strong> hasta que se confirme el pago.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ===== RESUMEN (carrito) ===== */}
              <aside className="border-l border-slate-200 flex flex-col bg-slate-50/60 min-h-0">
                <div className="shrink-0 px-5 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resumen</span>
                    {itemsVenta.length > 0 && (
                      <span className="text-[11px] text-slate-400">{itemsVenta.length} íte{itemsVenta.length === 1 ? 'm' : 'ms'}</span>
                    )}
                  </div>
                  {!personaSel && (
                    <p className="mt-1 text-[11px] text-slate-400">Selecciona al cliente para poder crear la venta.</p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-5 pt-4 space-y-2 min-h-0" data-tour="nueva-venta-items">
                  {itemsVenta.length === 0 && (
                    <p className="text-sm text-slate-400">Todavía no agregas productos. Búscalos y tócalos en el paso Productos.</p>
                  )}
                  {itemsVenta.map((it, i) => (
                    <div key={i} className="rounded-xl bg-white border border-slate-200 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex-1 text-sm font-medium text-slate-700 truncate">{it.nombre}</span>
                        <button onClick={() => quitarProducto(i)} className="p-0.5 rounded text-slate-300 hover:text-red-500 transition-colors" title="Quitar">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => cambiarCantidad(i, String((Number(it.cantidad) || 1) - 1))}
                            disabled={Number(it.cantidad) <= 1}
                            className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            type="text"
                            value={it.cantidad}
                            onChange={(e) => cambiarCantidad(i, e.target.value)}
                            className="w-10 px-1 py-1 rounded-lg border border-slate-200 text-sm text-center"
                          />
                          <button
                            onClick={() => cambiarCantidad(i, String((Number(it.cantidad) || 0) + 1))}
                            className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            type="text"
                            value={it.precio}
                            onChange={(e) => cambiarPrecio(i, parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 rounded-lg border border-slate-200 text-sm text-right"
                          />
                          <span className="text-slate-600 font-mono text-xs w-16 text-right">
                            S/ {((Number(it.cantidad) || 0) * it.precio).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="shrink-0 border-t border-slate-200 p-5 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Total</span>
                    <span className="text-xl font-bold text-slate-900">S/ {total.toFixed(2)}</span>
                  </div>
                  <button
                    data-tour="nueva-venta-crear"
                    onClick={crearVenta}
                    disabled={creando || !personaSel || itemsVenta.length === 0}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {creando ? 'Creando...' : 'Crear venta'}
                  </button>
                  <button onClick={cerrarNueva} className="mt-2 w-full px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                    Cancelar
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      <EscannerVentas abierto={showEscanner && planNivel(plan) >= 2} onCerrar={() => setShowEscanner(false)} onDetectar={manejarCodigoEscaneado} />
      <ModalDetalleVenta venta={ventaDetalle} onCerrar={() => setVentaDetalle(null)} plan={plan} />
    </div>
  )
}
