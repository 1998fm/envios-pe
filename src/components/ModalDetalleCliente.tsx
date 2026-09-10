'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { X, Phone, Copy, Check, ShoppingCart, Truck, CalendarDays, Banknote, Package, Wallet } from 'lucide-react'
import { toast } from 'sonner'

type VentaItem = {
  id: string
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

type VentaDetalle = {
  id: string
  persona_id: string
  persona_nombre: string
  total: number
  estado: 'COMPLETADA' | 'ANULADA' | 'PENDIENTE'
  metodo_pago: string
  created_at: string
  items?: VentaItem[]
}

type EnvioDetalle = {
  id: string
  nombre: string
  metodo: string
  nombre_metodo?: string | null
  destino: string
  direccion: string
  estado: string
  fecha_registro: string
  fecha_programada: string
}

type DetalleCliente = {
  id: string
  nombre: string
  dni: string | null
  telefono: string | null
  ventas: VentaDetalle[]
  envíos: EnvioDetalle[]
  totalVentas: number
  ultimoRegistro: string | null
}

const METODO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  YAPE_PLIN: 'Yape / Plin',
  TARJETA: 'Tarjeta',
}

const VENTA_ESTADO_STYLES: Record<string, string> = {
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  PENDIENTE: 'bg-amber-100 text-amber-700',
  ANULADA: 'bg-red-100 text-red-600',
}

const VENTA_ESTADO_LABEL: Record<string, string> = {
  COMPLETADA: 'Completada',
  PENDIENTE: 'Pendiente',
  ANULADA: 'Anulada',
}

const ENVIO_ESTADO_STYLES: Record<string, string> = {
  NO_EMPACADO: 'bg-slate-100 text-slate-600',
  EMPACADO: 'bg-amber-100 text-amber-700',
  EN_OBSERVACION: 'bg-purple-100 text-purple-700',
  ENVIADO: 'bg-emerald-100 text-emerald-700',
}

const ENVIO_ESTADO_LABEL: Record<string, string> = {
  NO_EMPACADO: 'No Empacado',
  EMPACADO: 'Empacado',
  ENVIADO: 'Enviado',
}

function InfoTile({ icon: Icon, label, value }: { icon: any; label: string; value: ReactNode }) {
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

function formatFecha(fecha: string | null | undefined) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatHora(fecha: string | null | undefined) {
  if (!fecha) return ''
  try {
    return new Date(fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function ModalDetalleCliente({
  userId,
  clienteId,
  ids,
  onClose,
}: {
  userId: string
  clienteId: string
  ids: string[]
  onClose: () => void
}) {
  const [detalle, setDetalle] = useState<DetalleCliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [ultimoCopiado, setUltimoCopiado] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    setLoading(true)
    const idsParam = ids.join(',')
    fetch(`/api/clientes/${clienteId}?user_id=${encodeURIComponent(userId)}&ids=${encodeURIComponent(idsParam)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!activo) return
        if (json.data) setDetalle(json.data)
      })
      .catch(() => {
        if (activo) toast.error('No se pudo cargar el detalle del cliente')
      })
      .finally(() => {
        if (activo) setLoading(false)
      })
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

  async function copiarTelefono(tel: string | null) {
    if (!tel) return
    try {
      await navigator.clipboard.writeText(tel)
      setUltimoCopiado(tel)
      toast.success('Teléfono copiado')
      setTimeout(() => setUltimoCopiado(null), 1500)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center text-lg font-bold text-sky-700 shrink-0">
              {(detalle?.nombre || '?').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900 truncate">{detalle?.nombre || 'Cliente'}</h3>
              <p className="text-xs text-slate-500">{loading ? 'Cargando...' : `${detalle?.ventas?.length ?? 0} ventas · ${detalle?.envíos?.length ?? 0} envíos`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16 text-slate-400 text-sm">Cargando historial...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Datos del cliente */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <InfoTile icon={Phone} label="Teléfono" value={
                detalle?.telefono ? (
                  <span className="flex items-center gap-1.5">
                    {detalle.telefono}
                    <button
                      onClick={() => copiarTelefono(detalle.telefono)}
                      className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Copiar teléfono"
                    >
                      {ultimoCopiado === detalle.telefono ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </span>
                ) : (
                  '—'
                )
              } />
              <InfoTile icon={Wallet} label="DNI" value={detalle?.dni || '—'} />
              <InfoTile icon={Banknote} label="Total comprado" value={detalle && detalle.totalVentas > 0 ? `S/ ${detalle.totalVentas.toFixed(2)}` : '—'} />
            </div>

            {/* Historial de ventas */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <ShoppingCart size={15} className="text-sky-600" />
                <h4 className="text-sm font-bold text-slate-900">Historial de ventas</h4>
                <span className="ml-auto text-xs font-semibold text-slate-400">{detalle?.ventas?.length ?? 0}</span>
              </div>
              {!detalle?.ventas?.length ? (
                <p className="px-4 py-6 text-sm text-slate-400 text-center">Este cliente aún no tiene ventas registradas.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {detalle.ventas.map((v) => (
                    <div key={v.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">S/ {Number(v.total).toFixed(2)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${VENTA_ESTADO_STYLES[v.estado] || 'bg-slate-100 text-slate-500'}`}>
                          {VENTA_ESTADO_LABEL[v.estado] || v.estado}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Banknote size={11} /> {METODO_PAGO_LABEL[v.metodo_pago] || v.metodo_pago}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
                          <CalendarDays size={11} /> {formatFecha(v.created_at)} {formatHora(v.created_at)}
                        </span>
                      </div>
                      {v.items && v.items.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {v.items.map((it) => (
                            <span key={it.id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-slate-600">
                              <Package size={11} className="text-slate-400" />
                              {it.producto_nombre}
                              <span className="text-slate-400">×{it.cantidad}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Historial de envíos */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <Truck size={15} className="text-sky-600" />
                <h4 className="text-sm font-bold text-slate-900">Historial de envíos</h4>
                <span className="ml-auto text-xs font-semibold text-slate-400">{detalle?.envíos?.length ?? 0}</span>
              </div>
              {!detalle?.envíos?.length ? (
                <p className="px-4 py-6 text-sm text-slate-400 text-center">Este cliente aún no tiene envíos.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {detalle.envíos.map((e) => (
                    <div key={e.id} className="px-4 py-3 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">{e.destino}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ENVIO_ESTADO_STYLES[e.estado] || 'bg-slate-100 text-slate-500'}`}>
                          {ENVIO_ESTADO_LABEL[e.estado] || e.estado}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
                          <Truck size={11} /> {e.nombre_metodo || e.metodo}
                        </span>
                      </div>
                      {e.direccion && <p className="text-xs text-slate-500">{e.direccion}</p>}
                      <p className="text-[11px] text-slate-400">
                        Registrado: {formatFecha(e.fecha_registro)} · Programado: {formatFecha(e.fecha_programada)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
