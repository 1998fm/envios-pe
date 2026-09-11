'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import type { Envio } from '@/types/envio'
import {
  Package,
  Truck,
  Check,
  X,
  Loader2,
  Phone,
  Hash,
  Calendar,
  MapPin,
  Clock,
  Ruler,
  Trash2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ConfirmDialog'
import TourHelpButton from '@/components/TourHelpButton'

type Props = {
  envio: Envio | null
  onCerrar: () => void
  onUpdate?: (envio: Envio) => void
  onDelete?: (id: string) => void
}

type VentaItemInfo = {
  id: string
  venta_id: string
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

type VentaConItems = {
  id: string
  estado: string
  estado_envio: string
  total: number
  persona_nombre: string
  items: VentaItemInfo[]
}

const ESTADO_ENVIO_STYLES: Record<string, string> = {
  NO_EMPACADO: 'bg-slate-100 text-slate-600',
  EMPACADO: 'bg-amber-100 text-amber-700',
  EN_OBSERVACION: 'bg-purple-100 text-purple-700',
  ENVIADO: 'bg-emerald-100 text-emerald-700',
}

const ESTADO_ENVIO_LABEL: Record<string, string> = {
  NO_EMPACADO: 'No Empacado',
  EMPACADO: 'Empacado',
  EN_OBSERVACION: 'En Observación',
  ENVIADO: 'Enviado',
}

const ESTADO_ENVIO_BAR: Record<string, string> = {
  NO_EMPACADO: 'bg-red-400',
  EMPACADO: 'bg-amber-400',
  EN_OBSERVACION: 'bg-purple-400',
  ENVIADO: 'bg-emerald-400',
}

const VENTA_ENVIO_STYLES: Record<string, string> = {
  ENVIADO: 'bg-emerald-100 text-emerald-700',
  EMPACADO: 'bg-amber-100 text-amber-700',
  ENTREGADO: 'bg-green-100 text-green-700',
  COMPLETADO: 'bg-emerald-100 text-emerald-700',
}

function Card({
  title,
  icon: Icon,
  right,
  children,
  className = '',
}: {
  title: string
  icon: LucideIcon
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3.5">
      <div className="mb-1 flex items-center gap-1.5 text-slate-400">
        <Icon size={13} />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  )
}

export default function ModalDetalle({ envio, onCerrar, onUpdate, onDelete }: Props) {
  const supabase = createClient()
  const confirmar = useConfirm()
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [observacion, setObservacion] = useState('')
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [ventasCliente, setVentasCliente] = useState<VentaConItems[]>([])
  const [loadingVentas, setLoadingVentas] = useState(false)
  const [marcandoEnvio, setMarcandoEnvio] = useState(false)
  const [cobrandoVentas, setCobrandoVentas] = useState(false)

  useEffect(() => {
    if (envio?.dni || envio?.telefono) {
      cargarVentasCliente()
    }
  }, [envio?.id])

  useEffect(() => {
    setObservacion(envio?.observaciones ?? '')
  }, [envio?.observaciones])

  if (!envio) return null

  const current = envio
  const fechaInicial = fechaProgramada || current.fecha_programada?.split('T')[0] || ''

  async function cargarVentasCliente() {
    setLoadingVentas(true)

    let idsVentas: string[] = []
    let ventas: any[] = []

    // 1) Ventas ya vinculadas directamente a este envío (relación confiable)
    const { data: porEnvio, error: errEnvio } = await supabase
      .from('ventas')
      .select('*')
      .eq('envio_id', current.id)
      .in('estado', ['COMPLETADA', 'PENDIENTE'])
      .not('estado_envio', 'eq', 'COMPLETADO')
      .order('created_at', { ascending: false })

    if (!errEnvio && porEnvio && porEnvio.length > 0) {
      ventas = porEnvio
    } else {
      // 2) Respaldo para datos sin vincular (ventas creadas antes de esta mejora):
      //    localizar la persona por DNI o teléfono (ruta normalizada y exacta)
      const busqueda = current.dni?.trim() || current.telefono?.trim()
      if (busqueda) {
        const res = await fetch(`/api/personas?user_id=${current.user_id}&busqueda=${encodeURIComponent(busqueda)}`)
        const json = await res.json()
        if (json.data?.id) {
          const { data } = await supabase
            .from('ventas')
            .select('*')
            .eq('persona_id', json.data.id)
            .in('estado', ['COMPLETADA', 'PENDIENTE'])
            .not('estado_envio', 'eq', 'COMPLETADO')
            .order('created_at', { ascending: false })
          // Solo ventas que NO estén ya asignadas a otro envío (evita mezclar
          // productos de pedidos distintos del mismo cliente)
          ventas = (data || []).filter(
            (v: any) =>
              v.envio_id === null ||
              v.envio_id === undefined ||
              v.envio_id === current.id
          )
        }
      }
    }

    // Deduplicar si algún flujo devolvió la misma venta dos veces
    idsVentas = [...new Set(ventas.map((v: any) => v.id))]

    if (idsVentas.length === 0) {
      setVentasCliente([])
      setLoadingVentas(false)
      return
    }

    const { data: itemsData } = await supabase
      .from('venta_items')
      .select('*')
      .in('venta_id', idsVentas)

    const itemsPorVenta = new Map<string, VentaItemInfo[]>()
    for (const item of itemsData || []) {
      const lista = itemsPorVenta.get(item.venta_id) || []
      lista.push({
        id: item.id,
        venta_id: item.venta_id,
        producto_nombre: item.producto_nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      })
      itemsPorVenta.set(item.venta_id, lista)
    }

    const ventasConItems: VentaConItems[] = ventas.map((venta: any) => ({
      id: venta.id,
      estado: venta.estado,
      estado_envio: venta.estado_envio || 'PENDIENTE',
      total: venta.total,
      persona_nombre: venta.persona_nombre,
      items: itemsPorVenta.get(venta.id) || [],
    }))

    setVentasCliente(ventasConItems)
    setLoadingVentas(false)
  }

  async function cobrarVentasPendientes() {
    const idsPendientes = ventasCliente.filter((v) => v.estado === 'PENDIENTE').map((v) => v.id)
    if (idsPendientes.length === 0) return
    if (!(await confirmar({ message: `¿Registrar el cobro de las ${idsPendientes.length} venta(s) pendiente(s) de este pedido?`, confirmLabel: 'Sí, cobrar' }))) return
    setCobrandoVentas(true)
    const { error } = await supabase
      .from('ventas')
      .update({ estado: 'COMPLETADA' })
      .in('id', idsPendientes)
    if (error) {
      toast.error('Error al registrar el cobro')
    } else {
      toast.success('Ventas marcadas como cobradas')
      cargarVentasCliente()
    }
    setCobrandoVentas(false)
  }

  async function validarContenido() {
    if (!(await confirmar({ message: '¿Está seguro que todo lo listado ha sido empacado?', confirmLabel: 'Sí, validar' }))) return
    setMarcandoEnvio(true)

    const ids = ventasCliente.map((v) => v.id)

    const { error } = await supabase
      .from('ventas')
      .update({ estado_envio: 'EMPACADO', envio_id: current.id })
      .in('id', ids)

    if (error) {
      toast.error('Error al validar el contenido')
    } else {
      toast.success('Contenido del pedido validado')
      cargarVentasCliente()
    }
    setMarcandoEnvio(false)
  }

  async function guardarFecha() {
    if (!fechaProgramada || fechaProgramada === current.fecha_programada?.split('T')[0]) return
    setGuardando(true)
    setMensaje('')
    const nuevaFecha = new Date(fechaProgramada + 'T12:00:00').toISOString()
    const { error } = await supabase
      .from('envios')
      .update({ fecha_programada: nuevaFecha })
      .eq('id', current.id)
    if (error) {
      setMensaje('Error al guardar: ' + error.message)
    } else {
      setMensaje('✅ Fecha actualizada')
      onUpdate?.({ ...current, fecha_programada: nuevaFecha } as Envio)
    }
    setGuardando(false)
  }

  async function guardarObservacion() {
    const texto = observacion.trim()
    if (!texto || texto === (current.observaciones || '').trim()) return
    setGuardando(true)
    const { error } = await supabase
      .from('envios')
      .update({ observaciones: texto })
      .eq('id', current.id)
    if (error) {
      toast.error('Error al guardar: ' + error.message)
    } else {
      toast.success('Observación guardada')
      onUpdate?.({ ...current, observaciones: texto } as Envio)
    }
    setGuardando(false)
  }

  async function limpiarObservacion() {
    if (!(await confirmar({ message: '¿Quitar la observación de este pedido?', confirmLabel: 'Sí, quitar' }))) return
    setGuardando(true)
    const { error } = await supabase
      .from('envios')
      .update({ observaciones: null })
      .eq('id', current.id)
    if (error) {
      toast.error('Error al quitar: ' + error.message)
    } else {
      toast.success('Observación eliminada')
      setObservacion('')
      onUpdate?.({ ...current, observaciones: null } as Envio)
    }
    setGuardando(false)
  }

  async function eliminarEnvio() {
    const { error } = await supabase
      .from('envios')
      .delete()
      .eq('id', current.id)
    if (!error) {
      onDelete?.(current.id)
      onCerrar()
    }
    setConfirmandoEliminar(false)
  }

  function formatMoney(n: number | null | undefined) {
    if (n == null) return 'S/ 0.00'
    return 'S/ ' + Number(n).toFixed(2)
  }

  function formatFechaCorta(s?: string | null) {
    if (!s) return '—'
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00') : new Date(s)
    if (isNaN(fecha.getTime())) return '—'
    return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
  }

  const ventasPendientes = ventasCliente.filter((v) => v.estado_envio !== 'EMPACADO' && v.estado_envio !== 'COMPLETADO')
  const totalProductosPendientes = ventasPendientes.reduce(
    (sum, v) => sum + v.items.length,
    0
  )

  const ventasPorCobrar = ventasCliente.filter((v) => v.estado === 'PENDIENTE')
  const totalPorCobrar = ventasPorCobrar.reduce((sum, v) => sum + Number(v.total || 0), 0)

  // Timeline del pedido: paso según el estado del envío y sus ventas vinculadas
  const ventasValidados = ventasCliente.some(
    (v) => v.estado_envio === 'EMPACADO' || v.estado_envio === 'COMPLETADO' || v.estado_envio === 'ENVIADO'
  )
  const ordenEstados = ['NO_EMPACADO', 'EN_OBSERVACION', 'EMPACADO', 'ENVIADO']
  const pasoActual = ordenEstados.indexOf(current.estado)
  const pasosTimeline = [
    { etiqueta: 'Recibido', descripcion: 'Pedido registrado', fecha: formatFechaCorta(current.fecha_registro) },
    { etiqueta: 'Validado', descripcion: 'Contenido verificado', fecha: ventasValidados ? 'Validado' : undefined, completado: ventasValidados },
    { etiqueta: 'Empacado', descripcion: 'Listo para envío', fecha: current.estado === 'EMPACADO' ? 'En proceso' : undefined, completado: current.estado === 'ENVIADO' },
    { etiqueta: 'Enviado', descripcion: 'En camino al destino', fecha: current.estado === 'ENVIADO' ? formatFechaCorta(current.fecha_registro) : undefined, completado: current.estado === 'ENVIADO' },
  ]

  const estadoEnvioStyle =
    ESTADO_ENVIO_STYLES[current.estado] || ESTADO_ENVIO_STYLES.NO_EMPACADO

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Barra superior de color según el estado */}
        <div className={`h-1 w-full shrink-0 ${ESTADO_ENVIO_BAR[current.estado] || 'bg-slate-300'}`} />

        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-lg font-extrabold text-white">
              {envio.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Detalle del pedido
              </p>
              <p className="truncate text-lg font-bold text-slate-900">{envio.nombre}</p>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-slate-500">
                {envio.dni && (
                  <span className="flex items-center gap-1">
                    <Hash size={13} /> {envio.dni}
                  </span>
                )}
                {envio.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} /> {envio.telefono}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              data-tour="detalle-envio-estado"
              className={`inline-block rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${estadoEnvioStyle}`}
            >
              {ESTADO_ENVIO_LABEL[envio.estado] || envio.estado}
            </span>
            <TourHelpButton tourId="modal-detalle-envio" />
            <button
              onClick={onCerrar}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-6 py-5">
          {/* INFORMACIÓN DEL PEDIDO */}
          <Card title="Información del pedido" icon={Package}>
            <div className="grid grid-cols-2 gap-3">
              <InfoTile
                icon={Truck}
                label="Método"
                value={
                  <span>
                    {envio.metodo}
                    {envio.nombre_metodo && (
                      <span className="ml-1.5 text-xs font-normal text-slate-400">
                        · {envio.nombre_metodo}
                      </span>
                    )}
                  </span>
                }
              />
              <InfoTile icon={Ruler} label="Tamaño" value={envio.tamano || '—'} />
              {envio.cantidad_productos != null && (
                <InfoTile
                  icon={Package}
                  label="Prendas"
                  value={`${envio.cantidad_productos} ${envio.cantidad_productos === 1 ? 'prenda' : 'prendas'}`}
                />
              )}
              <InfoTile
                icon={Clock}
                label="Registrado"
                value={new Date(envio.fecha_registro).toLocaleDateString('es-PE')}
              />
            </div>
            <div
              data-tour="detalle-envio-fecha"
              className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4"
            >
              <div className="relative flex-1">
                <Calendar
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={fechaInicial}
                  onChange={(e) => setFechaProgramada(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
              </div>
              <button
                onClick={guardarFecha}
                disabled={guardando || !fechaProgramada || fechaProgramada === current.fecha_programada?.split('T')[0]}
                className="shrink-0 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-40"
              >
                {guardando ? '...' : 'Guardar'}
              </button>
            </div>
            {mensaje && (
              <p
                className={`mt-1.5 text-xs font-semibold ${
                  mensaje.includes('Error') ? 'text-red-500' : 'text-emerald-600'
                }`}
              >
                {mensaje}
              </p>
            )}
          </Card>

          {/* TIMELINE DEL PEDIDO */}
          <Card title="Estado del pedido" icon={Clock}>
            <ol className="relative space-y-4 pl-1">
              {pasosTimeline.map((paso, idx) => {
                const activo = idx === pasoActual || (paso.completado && idx < pasoActual + 1)
                const completo = paso.completado || (pasoActual >= 0 && idx < pasoActual)
                const esActual = idx === pasoActual
                return (
                  <li key={paso.etiqueta} className="relative flex gap-3">
                    {idx < pasosTimeline.length - 1 && (
                      <span
                        className={`absolute left-[13px] top-7 h-full w-0.5 ${
                          completo ? 'bg-emerald-300' : 'bg-slate-200'
                        }`}
                      />
                    )}
                    <span
                      className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        completo
                          ? 'bg-emerald-500 text-white'
                          : esActual
                          ? 'bg-sky-500 text-white ring-4 ring-sky-100'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {completo ? <Check size={13} /> : idx + 1}
                    </span>
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={`text-sm font-semibold ${
                            esActual ? 'text-slate-900' : completo ? 'text-slate-700' : 'text-slate-400'
                          }`}
                        >
                          {paso.etiqueta}
                        </p>
                        {paso.fecha && (
                          <span className="shrink-0 text-[11px] font-medium text-slate-400">
                            {paso.fecha}
                          </span>
                        )}
                      </div>
                      {paso.descripcion && (
                        <p className="text-[11px] text-slate-400">{paso.descripcion}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </Card>

          {/* DESTINO */}
          <Card title="Destino" icon={MapPin}>
            <div className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
              {envio.detalle}
            </div>
          </Card>

          {/* OBSERVACIÓN */}
          <div data-tour="detalle-envio-observacion">
            <Card title="Observación / incidentes" icon={AlertCircle}>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={3}
                placeholder="Registra cualquier incidente: dato faltante, dirección incompleta, paquete con inconvenientes, etc."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                {observacion.trim() ? (
                  <button
                    onClick={limpiarObservacion}
                    disabled={guardando}
                    className="rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-50"
                  >
                    Quitar
                  </button>
                ) : null}
                <button
                  onClick={guardarObservacion}
                  disabled={guardando || !observacion.trim() || observacion.trim() === (current.observaciones || '').trim()}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-40"
                >
                  {guardando ? 'Guardando...' : (current.observaciones ? 'Actualizar observación' : 'Guardar observación')}
                </button>
              </div>
              {current.observaciones && (
                <p className="mt-2 text-[11px] text-slate-400">
                  Este pedido tiene una observación registrada. Edítala y presiona guardar para actualizarla.
                </p>
              )}
            </Card>
          </div>

          {/* PRODUCTOS DEL CLIENTE */}
          <Card
            title="Productos del cliente"
            icon={Package}
            right={
              totalProductosPendientes > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  {totalProductosPendientes} por validar
                </span>
              ) : undefined
            }
          >

            {loadingVentas ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 size={18} className="mr-2 animate-spin" />
                Cargando productos...
              </div>
            ) : ventasCliente.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                <Package size={20} />
                No se encontraron ventas para este cliente
              </div>
            ) : (
              <div className="space-y-3">
                {ventasCliente.map((venta) => {
                  const ventaEnvioStyle =
                    VENTA_ENVIO_STYLES[venta.estado_envio] || 'bg-slate-100 text-slate-500'
                  return (
                    <div
                      key={venta.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                        <span className="text-sm font-semibold text-slate-700">
                          Venta #{venta.id.slice(0, 8)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ventaEnvioStyle}`}
                        >
                          {venta.estado_envio || 'PENDIENTE'}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-50">
                        {venta.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">
                                {item.producto_nombre}
                              </p>
                              <p className="text-xs text-slate-400">
                                x{item.cantidad} · {formatMoney(item.precio_unitario)}
                              </p>
                            </div>
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                              <Package size={12} /> {item.cantidad} u
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 px-4 py-2.5 text-right text-sm font-bold text-slate-900">
                        Total: {formatMoney(venta.total)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {ventasCliente.length > 0 && ventasPendientes.length > 0 && (
              <button
                onClick={validarContenido}
                disabled={marcandoEnvio}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
              >
                {marcandoEnvio ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Validar contenido del pedido
              </button>
            )}
          </Card>

          {/* COBRO DEL PEDIDO */}
          {ventasPorCobrar.length > 0 && (
            <Card
              title="Cobro del pedido"
              icon={Check}
              right={
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  {ventasPorCobrar.length} pendiente(s)
                </span>
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  Total por cobrar:{' '}
                  <span className="font-bold text-slate-900">{formatMoney(totalPorCobrar)}</span>
                </div>
                <button
                  onClick={cobrarVentasPendientes}
                  disabled={cobrandoVentas}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
                >
                  {cobrandoVentas ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {cobrandoVentas ? 'Registrando...' : 'Registrar pago'}
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          {confirmandoEliminar ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-red-600">¿Eliminar este pedido?</span>
              <button
                onClick={eliminarEnvio}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setConfirmandoEliminar(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmandoEliminar(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 transition-colors hover:text-red-600"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          )}
          <button
            onClick={onCerrar}
            className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/20"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
