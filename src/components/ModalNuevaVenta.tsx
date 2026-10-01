'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Check,
  Search,
  Plus,
  ScanBarcode,
  Lock,
  Loader2,
  UserRound,
  Package,
  Trash2,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import type { Producto } from '@/types/inventario'
import EscannerVentas from '@/components/EscannerVentas'
import TourHelpButton from '@/components/TourHelpButton'
import { useOnboarding } from '@/context/OnboardingContext'
import { openUpgrade, planNivel } from '@/lib/planGating'
import { buscar } from '@/lib/buscar'
import { beepOk, beepError } from '@/lib/beep'
import { fmtSoles, parsearNumero } from '@/lib/format'
import { tourDone, trayectoDone } from '@/lib/tours'

type Props = {
  abierto: boolean
  onCerrar: () => void
  onCreada: () => void
  userId: string
  plan?: string
}

type ItemVenta = {
  producto_id: string
  nombre: string
  cantidad: string
  precio: number
}

const METODOS_PAGO = [
  { key: 'EFECTIVO', label: 'Efectivo' },
  { key: 'YAPE_PLIN', label: 'Yape / Plin' },
  { key: 'TARJETA', label: 'Tarjeta' },
] as const

export default function ModalNuevaVenta({ abierto, onCerrar, onCreada, userId, plan = 'basic' }: Props) {
  const { startTour } = useOnboarding()

  const [busquedaCli, setBusquedaCli] = useState('')
  const [personaSel, setPersonaSel] = useState<{ id: string; nombre: string; dni: string; telefono?: string } | null>(null)
  const [buscandoPersona, setBuscandoPersona] = useState(false)
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false)
  const [nuevoCliForm, setNuevoCliForm] = useState({ dni: '', nombre: '', telefono: '' })
  const [creandoCliente, setCreandoCliente] = useState(false)

  const [productos, setProductos] = useState<Producto[]>([])
  const [busquedaProd, setBusquedaProd] = useState('')
  const [showEscanner, setShowEscanner] = useState(false)
  const [itemsVenta, setItemsVenta] = useState<ItemVenta[]>([])
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'YAPE_PLIN' | 'TARJETA'>('EFECTIVO')
  const [pagoEstado, setPagoEstado] = useState<'COMPLETADA' | 'PENDIENTE'>('COMPLETADA')
  const [pagoParcial, setPagoParcial] = useState(false)
  const [montoPagado, setMontoPagado] = useState('')
  const [creando, setCreando] = useState(false)

  const total = itemsVenta.reduce((sum, it) => sum + (Number(it.cantidad) || 0) * it.precio, 0)
  const puedeCrear = Boolean(personaSel) && itemsVenta.length > 0 && !creando

  // Un contador de pasos hace que la cabecera del modal diga en qué parte vas,
  // en vez de dejar a la persona adivinando cuánto falta.
  const paso = !personaSel ? 1 : itemsVenta.length === 0 ? 2 : 3

  /* ------------------------------------------------------------------ */
  /* Carga de datos                                                      */
  /* ------------------------------------------------------------------ */

  function cargarProductos() {
    return fetch(`/api/productos?user_id=${userId}&limit=1000`)
      .then((r) => r.json())
      .then((j) => setProductos(j.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    if (abierto) cargarProductos()
  }, [abierto, userId])

  // Mientras el modal está abierto, el stock puede cambiar desde otra pestaña
  // (una compra, otra venta, un ajuste). Sin esto, lo que se ve puede ya no
  // ser lo que hay y el POST falla por 409.
  useEffect(() => {
    if (!abierto || !userId) return
    const supabase = createClient()
    const canal = supabase
      .channel('productos-venta-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, cargarProductos)
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  }, [abierto, userId])

  useEffect(() => {
    if (abierto && trayectoDone() && !tourDone('modal-nueva-venta')) {
      const t = setTimeout(() => startTour('modal-nueva-venta'), 400)
      return () => clearTimeout(t)
    }
  }, [abierto, startTour])

  // Cerrar con Escape, como cualquier modal.
  useEffect(() => {
    if (!abierto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abierto, onCerrar])

  /* ------------------------------------------------------------------ */
  /* Cliente                                                             */
  /* ------------------------------------------------------------------ */

  async function buscarPersona() {
    if (busquedaCli.trim().length < 3) return
    setBuscandoPersona(true)
    setMostrarNuevoCliente(false)

    const res = await fetch(`/api/personas?user_id=${userId}&busqueda=${encodeURIComponent(busquedaCli.trim())}`)
    const json = await res.json()
    if (json.data) {
      setPersonaSel({ id: json.data.id, nombre: json.data.nombre, dni: json.data.dni, telefono: json.data.telefono })
      setNuevoCliForm({ dni: '', nombre: '', telefono: '' })
    } else {
      setPersonaSel(null)
      setMostrarNuevoCliente(true)
      const largo = busquedaCli.trim()
      setNuevoCliForm({ dni: largo.length === 8 ? largo : '', nombre: '', telefono: largo.length > 8 ? largo : '' })
    }
    setBuscandoPersona(false)
  }

  async function crearNuevoCliente() {
    if (!nuevoCliForm.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setCreandoCliente(true)
    const res = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        dni: nuevoCliForm.dni || null,
        nombre: nuevoCliForm.nombre.trim(),
        telefono: nuevoCliForm.telefono || null,
      }),
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

  /* ------------------------------------------------------------------ */
  /* Items                                                               */
  /* ------------------------------------------------------------------ */

  function agregarProducto(prod: Producto) {
    const existe = itemsVenta.find((it) => it.producto_id === prod.id)
    if (existe) {
      setItemsVenta(
        itemsVenta.map((it) =>
          it.producto_id === prod.id ? { ...it, cantidad: String((Number(it.cantidad) || 0) + 1) } : it
        )
      )
    } else {
      setItemsVenta([...itemsVenta, { producto_id: prod.id, nombre: prod.nombre, cantidad: '1', precio: prod.precio_venta }])
    }
  }

  function manejarCodigoEscaneado(codigo: string) {
    const limpio = codigo.trim()
    if (!limpio) return
    const prod = productos.find((p) => p.id === limpio || (p.sku && p.sku === limpio))
    if (!prod) {
      beepError()
      toast.error('Producto no encontrado con ese código')
      return
    }
    const existe = itemsVenta.find((it) => it.producto_id === prod.id)
    if (existe) {
      setItemsVenta(
        itemsVenta.map((it) =>
          it.producto_id === prod.id ? { ...it, cantidad: String((Number(it.cantidad) || 0) + 1) } : it
        )
      )
    } else {
      agregarProducto(prod)
    }
    beepOk()
    toast.success(`${prod.nombre} agregado a la venta`)
  }

  function cambiarCantidad(idx: number, cant: string) {
    const nuevos = [...itemsVenta]
    nuevos[idx] = { ...nuevos[idx], cantidad: cant }
    setItemsVenta(nuevos)
  }

  function cambiarPrecio(idx: number, texto: string) {
    const n = parsearNumero(texto)
    const nuevos = [...itemsVenta]
    // Mientras escribe se guarda lo que hay (puede ser "" a medio teclear);
    // si no hay dígitos, se deja el precio tal como estaba.
    nuevos[idx] = { ...nuevos[idx], precio: n == null ? nuevos[idx].precio : Math.max(0, n) }
    setItemsVenta(nuevos)
  }

  // El motor ordena por relevancia, así que el producto que más encaja queda
  // arriba en vez de aparecer por orden alfabético.
  const productosFiltrados = buscar(productos, busquedaProd, (p) => [p.nombre, p.sku, p.descripcion], (p) => p.nombre)

  /* ------------------------------------------------------------------ */
  /* Crear                                                               */
  /* ------------------------------------------------------------------ */

  function resetear() {
    setPersonaSel(null)
    setBusquedaCli('')
    setItemsVenta([])
    setBusquedaProd('')
    setMetodoPago('EFECTIVO')
    setPagoEstado('COMPLETADA')
    setPagoParcial(false)
    setMontoPagado('')
    setMostrarNuevoCliente(false)
    setNuevoCliForm({ dni: '', nombre: '', telefono: '' })
  }

  function cerrar() {
    resetear()
    onCerrar()
  }

  async function crearVenta() {
    if (!personaSel) return
    if (itemsVenta.length === 0) return
    setCreando(true)

    // - TARJETA: siempre Pendiente (el cargo todavía no se ha acreditado).
    // - EFECTIVO/YAPE "Sí, ya pagó": Completada con el total.
    // - EFECTIVO/YAPE Pendiente: si abonó una parte, se guarda lo pagado y la
    //   venta queda Pendiente con la diferencia como deuda.
    let estadoFinal: 'COMPLETADA' | 'PENDIENTE' = 'PENDIENTE'
    let montoPagadoFinal = 0

    if (metodoPago === 'TARJETA') {
      estadoFinal = 'PENDIENTE'
    } else if (pagoEstado === 'COMPLETADA') {
      estadoFinal = 'COMPLETADA'
      montoPagadoFinal = total
    } else if (pagoParcial) {
      const pagado = Math.min(Math.max(parsearNumero(montoPagado) ?? 0, 0), total)
      montoPagadoFinal = pagado
      estadoFinal = pagado >= total ? 'COMPLETADA' : 'PENDIENTE'
    }

    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        persona_id: personaSel.id,
        persona_nombre: personaSel.nombre,
        persona_dni: personaSel.dni,
        persona_telefono: personaSel.telefono || null,
        metodo_pago: metodoPago,
        ...(metodoPago !== 'TARJETA' ? { estado: estadoFinal } : {}),
        monto_pagado: montoPagadoFinal,
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
      resetear()
      onCreada()
      onCerrar()
      setCreando(false)
      return
    }

    if (res.status === 403) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Llegaste al límite de tu plan')
      openUpgrade()
      setCreando(false)
      return
    }

    const texto = await res.text()
    const data = (() => {
      try {
        return JSON.parse(texto)
      } catch {
        return {}
      }
    })()
    toast.error(data.error || texto || 'Error al crear venta')

    // 409 = stock insuficiente. El stock mostrado puede estar viejo: refresco.
    if (res.status === 409) cargarProductos()
    setCreando(false)
  }

  /* ------------------------------------------------------------------ */

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={cerrar}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
            role="dialog"
            aria-modal="true"
            aria-label="Nueva venta"
          >
            {/* Cabecera */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-tori-700 to-tori-600 px-6 py-5">
              <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[1.5px] text-tori-200">
                    Paso {paso} de 3
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-white">Nueva venta</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <TourHelpButton tourId="modal-nueva-venta" className="border-white/25 bg-white/10 text-white hover:bg-white/20" />
                  <button
                    onClick={cerrar}
                    aria-label="Cerrar"
                    className="grid h-9 w-9 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Progreso: tres puntos, el activo crece */}
              <div className="relative mt-4 flex gap-1.5" aria-hidden>
                {[1, 2, 3].map((p) => (
                  <div
                    key={p}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      p <= paso ? 'bg-white' : 'bg-white/25'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Cuerpo */}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* ---- Cliente ---- */}
              <section data-tour="nueva-venta-cliente">
                <EtiquetaPaso icono={UserRound} n={1} titulo="¿Quién te compra?" />
                <div className="mt-2.5 flex gap-2">
                  <div className="relative flex-1">
                    <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={busquedaCli}
                      onChange={(e) => setBusquedaCli(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && buscarPersona()}
                      placeholder="DNI o teléfono del cliente"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-tori-400 focus:bg-white focus:ring-[3px] focus:ring-tori-400/15"
                    />
                  </div>
                  <button
                    onClick={buscarPersona}
                    disabled={buscandoPersona || busquedaCli.trim().length < 3}
                    className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-tori-600 px-4 text-sm font-bold text-white transition-all hover:bg-tori-700 disabled:opacity-40"
                  >
                    {buscandoPersona ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                    <span className="hidden sm:inline">Buscar</span>
                  </button>
                </div>

                {personaSel ? (
                  <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-success-200 bg-success-50 px-3.5 py-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-success-500 text-white">
                      <Check size={15} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-bold text-success-700">{personaSel.nombre}</span>
                    {personaSel.dni && <span className="shrink-0 text-xs text-success-600">{personaSel.dni}</span>}
                    {personaSel.telefono && <span className="shrink-0 text-xs text-success-600">{personaSel.telefono}</span>}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-400">
                    {busquedaCli.trim().length > 0 && busquedaCli.trim().length < 3
                      ? 'Escribe al menos 3 dígitos para buscar.'
                      : 'Busca por DNI o teléfono. Si no está registrado, lo creas aquí mismo.'}
                  </p>
                )}

                <AnimatePresence>
                  {mostrarNuevoCliente && !personaSel && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                          No lo encontré — regístralo
                        </p>
                        <input
                          value={nuevoCliForm.nombre}
                          onChange={(e) => setNuevoCliForm({ ...nuevoCliForm, nombre: e.target.value })}
                          placeholder="Nombre completo"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-tori-400"
                        />
                        <div className="grid grid-cols-2 gap-2.5">
                          <input
                            value={nuevoCliForm.dni}
                            onChange={(e) => setNuevoCliForm({ ...nuevoCliForm, dni: e.target.value })}
                            placeholder="DNI"
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-tori-400"
                          />
                          <input
                            value={nuevoCliForm.telefono}
                            onChange={(e) => setNuevoCliForm({ ...nuevoCliForm, telefono: e.target.value })}
                            placeholder="Teléfono"
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-tori-400"
                          />
                        </div>
                        <button
                          onClick={crearNuevoCliente}
                          disabled={creandoCliente}
                          className="h-10 w-full rounded-xl bg-tori-600 text-sm font-bold text-white transition-colors hover:bg-tori-700 disabled:opacity-50"
                        >
                          {creandoCliente ? 'Registrando...' : 'Registrar cliente'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* ---- Productos ---- */}
              <section data-tour="nueva-venta-productos">
                <EtiquetaPaso icono={Package} n={2} titulo="¿Qué lleva?" />
                <div className="mt-2.5 flex gap-2">
                  <div className="relative flex-1">
                    <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={busquedaProd}
                      onChange={(e) => setBusquedaProd(e.target.value)}
                      placeholder="Buscar producto por nombre o SKU"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-tori-400 focus:bg-white focus:ring-[3px] focus:ring-tori-400/15"
                    />
                  </div>
                  {planNivel(plan) >= 2 ? (
                    <button
                      onClick={() => setShowEscanner(true)}
                      title="Escanear código QR del producto"
                      className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      <ScanBarcode size={16} />
                      <span className="hidden sm:inline">Escanear</span>
                    </button>
                  ) : (
                    <button
                      onClick={openUpgrade}
                      title="Lector de QR — disponible en Business Plus"
                      className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-bold text-slate-400 transition-colors hover:border-tori-400 hover:text-tori-600"
                    >
                      <Lock size={15} />
                      <span className="hidden sm:inline">Escanear</span>
                    </button>
                  )}
                </div>

                {productosFiltrados.length > 0 && (
                  <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
                    {productosFiltrados.slice(0, 40).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => agregarProducto(p)}
                        disabled={p.stock_actual <= 0}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-tori-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{p.nombre}</span>
                        {p.sku && <span className="shrink-0 font-mono text-[10px] text-slate-400">{p.sku}</span>}
                        <span className="shrink-0 text-xs font-semibold text-slate-500">
                          {fmtSoles(p.precio_venta)}
                        </span>
                        <span
                          className={`shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
                            p.stock_actual <= 0 ? 'bg-error-50 text-error-600' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.stock_actual}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {busquedaProd && productosFiltrados.length === 0 && (
                  <p className="mt-2 text-[11px] text-slate-400">Ningún producto coincide con “{busquedaProd}”.</p>
                )}
              </section>

              {/* ---- Items ---- */}
              {itemsVenta.length > 0 && (
                <section data-tour="nueva-venta-items">
                  <EtiquetaPaso icono={Package} n={3} titulo={`${itemsVenta.length} ${itemsVenta.length === 1 ? 'producto' : 'productos'}`} />
                  <div className="mt-2.5 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                    {itemsVenta.map((it, i) => (
                      <div key={it.producto_id} className="flex items-center gap-2 px-3 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{it.nombre}</span>
                        <input
                          inputMode="numeric"
                          value={it.cantidad}
                          onChange={(e) => cambiarCantidad(i, e.target.value)}
                          aria-label={`Cantidad de ${it.nombre}`}
                          className="h-9 w-14 shrink-0 rounded-lg border border-slate-200 text-center text-sm font-bold outline-none focus:border-tori-400"
                        />
                        <span className="shrink-0 text-xs text-slate-300">×</span>
                        <div className="relative shrink-0">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">S/</span>
                          <input
                            inputMode="decimal"
                            value={String(it.precio)}
                            onChange={(e) => cambiarPrecio(i, e.target.value)}
                            aria-label={`Precio de ${it.nombre}`}
                            className="h-9 w-24 rounded-lg border border-slate-200 pl-6 pr-2 text-right text-sm font-bold outline-none focus:border-tori-400"
                          />
                        </div>
                        <span className="w-20 shrink-0 text-right text-sm font-extrabold tabular-nums text-slate-900">
                          {fmtSoles((Number(it.cantidad) || 0) * it.precio)}
                        </span>
                        <button
                          onClick={() => setItemsVenta(itemsVenta.filter((_, x) => x !== i))}
                          aria-label={`Quitar ${it.nombre}`}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-error-50 hover:text-error-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ---- Pago ---- */}
              {itemsVenta.length > 0 && (
                <section data-tour="nueva-venta-pago">
                  <EtiquetaPaso icono={CreditCard} titulo="¿Cómo paga?" />
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {METODOS_PAGO.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setMetodoPago(m.key)}
                        className={`h-11 rounded-xl text-sm font-bold transition-all ${
                          metodoPago === m.key
                            ? 'bg-tori-600 text-white shadow-md shadow-tori-600/25'
                            : 'border border-slate-200 bg-white text-slate-600 hover:border-tori-300 hover:text-tori-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {metodoPago !== 'TARJETA' ? (
                    <div className="mt-3" data-tour="nueva-venta-pago-estado">
                      <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        ¿Ya te pagó?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setPagoEstado('COMPLETADA')
                            setPagoParcial(false)
                            setMontoPagado('')
                          }}
                          className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-all ${
                            pagoEstado === 'COMPLETADA'
                              ? 'bg-success-600 text-white shadow-md shadow-success-500/25'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-success-300'
                          }`}
                        >
                          <Check size={15} /> Sí, ya pagó
                        </button>
                        <button
                          onClick={() => setPagoEstado('PENDIENTE')}
                          className={`flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                            pagoEstado === 'PENDIENTE'
                              ? 'bg-warning-500 text-white shadow-md shadow-warning-500/25'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-warning-300'
                          }`}
                        >
                          Pendiente
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-warning-50 px-3 py-2.5 text-[11px] leading-relaxed text-warning-700">
                      <AlertTriangle size={13} className="mt-px shrink-0" />
                      Con tarjeta la venta se registra como <b>Pendiente</b> hasta que confirmes el
                      cobro.
                    </p>
                  )}

                  {pagoEstado === 'PENDIENTE' && metodoPago !== 'TARJETA' && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5" data-tour="nueva-venta-pago-parcial">
                      <label className="flex cursor-pointer items-center gap-2.5 select-none">
                        <input
                          type="checkbox"
                          checked={pagoParcial}
                          onChange={(e) => setPagoParcial(e.target.checked)}
                          className="h-4 w-4 accent-tori-600"
                        />
                        <span className="text-sm font-semibold text-slate-700">Me pagó solo una parte</span>
                      </label>
                      {pagoParcial && (
                        <div className="mt-3">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                            ¿Cuánto pagó?
                          </label>
                          <div className="relative mt-1.5">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">S/</span>
                            <input
                              inputMode="decimal"
                              value={montoPagado}
                              onChange={(e) => setMontoPagado(e.target.value)}
                              placeholder={total.toFixed(2)}
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-right text-lg font-extrabold tabular-nums text-slate-900 outline-none focus:border-tori-400"
                            />
                          </div>
                          {(() => {
                            const pagado = Math.min(Math.max(parsearNumero(montoPagado) ?? 0, 0), total)
                            const debe = total - pagado
                            return (
                              <div className="mt-2.5 grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-success-50 px-3 py-2">
                                  <p className="text-[10px] uppercase tracking-wider text-success-600">Pagado</p>
                                  <p className="text-sm font-extrabold tabular-nums text-success-700">{fmtSoles(pagado)}</p>
                                </div>
                                <div className={`rounded-xl px-3 py-2 ${debe > 0 ? 'bg-warning-50' : 'bg-slate-100'}`}>
                                  <p className={`text-[10px] uppercase tracking-wider ${debe > 0 ? 'text-warning-600' : 'text-slate-500'}`}>
                                    Debe
                                  </p>
                                  <p className={`text-sm font-extrabold tabular-nums ${debe > 0 ? 'text-warning-700' : 'text-slate-600'}`}>
                                    {fmtSoles(debe)}
                                  </p>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Pie: total siempre visible */}
            <div className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
              <div className="mb-3 flex items-end justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total</span>
                <span
                  className={`text-3xl font-black leading-none tabular-nums tracking-tight transition-colors ${
                    itemsVenta.length > 0 ? 'text-tori-700' : 'text-slate-300'
                  }`}
                >
                  {fmtSoles(total)}
                </span>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={cerrar}
                  className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  data-tour="nueva-venta-crear"
                  onClick={crearVenta}
                  disabled={!puedeCrear}
                  className="flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-tori-600 to-tori-700 text-sm font-extrabold text-white shadow-lg shadow-tori-600/30 transition-all hover:shadow-xl hover:shadow-tori-600/40 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                >
                  {creando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Crear venta
                    </>
                  )}
                </button>
              </div>
              {!puedeCrear && !creando && (
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  {personaSel ? 'Agrega al menos un producto' : 'Selecciona un cliente para continuar'}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  /* ------------------------------------------------------------------ */
}

/* ------------------------------------------------------------------ */

function EtiquetaPaso({ icono: Icono, n, titulo }: { icono: typeof UserRound; n?: number; titulo: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-tori-50 text-tori-600">
        <Icono size={13} />
      </span>
      {n != null && (
        <span className="text-[10px] font-black tabular-nums text-tori-400">{n}.</span>
      )}
      <span className="text-[13px] font-extrabold text-slate-800">{titulo}</span>
    </div>
  )
}
