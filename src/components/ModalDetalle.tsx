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
  User,
  Phone,
  Hash,
  Calendar,
  MapPin,
  Clock,
  Ruler,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ConfirmDialog'

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
  ENVIADO: 'bg-emerald-100 text-emerald-700',
}

const VENTA_ENVIO_STYLES: Record<string, string> = {
  ENVIADO: 'bg-emerald-100 text-emerald-700',
  EMPACADO: 'bg-amber-100 text-amber-700',
  ENTREGADO: 'bg-green-100 text-green-700',
  COMPLETADO: 'bg-emerald-100 text-emerald-700',
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </h3>
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
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [ventasCliente, setVentasCliente] = useState<VentaConItems[]>([])
  const [loadingVentas, setLoadingVentas] = useState(false)
  const [marcandoEnvio, setMarcandoEnvio] = useState(false)

  useEffect(() => {
    if (envio?.dni || envio?.telefono) {
      cargarVentasCliente()
    }
  }, [envio?.id])

  if (!envio) return null

  const current = envio
  const fechaInicial = fechaProgramada || current.fecha_programada?.split('T')[0] || ''

  async function cargarVentasCliente() {
    setLoadingVentas(true)

    let ventas: any[] = []

    // 1) Buscar por persona_dni (directo desde supabase — ventas tiene RLS)
    if (current.dni) {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('persona_dni', current.dni)
        .eq('estado', 'COMPLETADA')
        .neq('estado_envio', 'COMPLETADO')
        .order('created_at', { ascending: false })

      if (!error && data) {
        ventas = data
      }
    }

    // 2) Si no encontró por DNI y el envío tiene teléfono, buscar persona por API y luego ventas por persona_id
    if (ventas.length === 0 && current.telefono) {
      const res = await fetch(`/api/personas?user_id=${current.user_id}&busqueda=${current.telefono}`)
      const json = await res.json()
      if (json.data?.id) {
        const { data, error } = await supabase
          .from('ventas')
          .select('*')
          .eq('persona_id', json.data.id)
          .eq('estado', 'COMPLETADA')
          .neq('estado_envio', 'COMPLETADO')
          .order('created_at', { ascending: false })

        if (!error && data) {
          ventas = data
        }
      }
    }

    if (ventas.length === 0) {
      setLoadingVentas(false)
      return
    }

    const ventasConItems: VentaConItems[] = []
    for (const venta of ventas) {
      const { data: itemsData } = await supabase
        .from('venta_items')
        .select('*')
        .eq('venta_id', venta.id)

      const items: VentaItemInfo[] = (itemsData || []).map((item: any) => ({
        id: item.id,
        venta_id: item.venta_id,
        producto_nombre: item.producto_nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }))

      ventasConItems.push({
        id: venta.id,
        estado: venta.estado,
        estado_envio: venta.estado_envio || 'PENDIENTE',
        total: venta.total,
        persona_nombre: venta.persona_nombre,
        items,
      })
    }

    setVentasCliente(ventasConItems)
    setLoadingVentas(false)
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

  const ventasPendientes = ventasCliente.filter((v) => v.estado_envio !== 'EMPACADO' && v.estado_envio !== 'COMPLETADO')
  const totalProductosPendientes = ventasPendientes.reduce(
    (sum, v) => sum + v.items.length,
    0
  )

  const estadoEnvioStyle =
    ESTADO_ENVIO_STYLES[current.estado] || ESTADO_ENVIO_STYLES.NO_EMPACADO

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Detalle del pedido
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Información del envío seleccionado.
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* CLIENTE */}
          <section>
            <SectionTitle>Cliente</SectionTitle>
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-lg font-extrabold text-white">
                {envio.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
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
          </section>

          {/* INFORMACIÓN DEL ENVÍO */}
          <section>
            <SectionTitle>Envío</SectionTitle>
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
              <InfoTile
                icon={Package}
                label="Estado"
                value={
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${estadoEnvioStyle}`}
                  >
                    {envio.estado}
                  </span>
                }
              />
              <InfoTile icon={Ruler} label="Tamaño" value={envio.tamano || '—'} />
              <InfoTile
                icon={Clock}
                label="Registrado"
                value={new Date(envio.fecha_registro).toLocaleDateString('es-PE')}
              />
            </div>
          </section>

          {/* FECHA PROGRAMADA */}
          <section>
            <SectionTitle>Fecha programada</SectionTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={fechaInicial}
                  onChange={(e) => setFechaProgramada(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
              </div>
              <button
                onClick={guardarFecha}
                disabled={guardando || !fechaProgramada || fechaProgramada === current.fecha_programada?.split('T')[0]}
                className="shrink-0 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-40"
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
          </section>

          {/* DESTINO */}
          <section>
            <SectionTitle>Destino</SectionTitle>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
              <MapPin size={18} className="mt-0.5 shrink-0 text-sky-600" />
              <div className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
                {envio.detalle}
              </div>
            </div>
          </section>

          {/* PRODUCTOS DEL CLIENTE */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <SectionTitle>Productos del cliente</SectionTitle>
              {totalProductosPendientes > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  {totalProductosPendientes} por validar
                </span>
              )}
            </div>

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
          </section>
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
