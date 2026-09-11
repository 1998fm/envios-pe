'use client'

import { useState } from 'react'
import { Package, Truck, Search, X, Loader2, Check, MapPin, Info, ChevronDown, ChevronUp } from 'lucide-react'

type TrackingItem = {
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

type TrackingVenta = {
  id: string
  codigo: string | null
  estado: string | null
  total: number | null
  created_at: string | null
  items: TrackingItem[]
}

type TrackingEnvio = {
  id: string
  codigo: string | null
  nombre: string | null
  estado: string
  metodo: string | null
  nombre_metodo: string | null
  destino: string | null
  direccion: string | null
  detalle: string | null
  fecha_registro: string | null
  fecha_programada: string | null
  ventas: TrackingVenta[]
}

const ESTADOS_ACTIVOS = ['NO_EMPACADO', 'EMPACADO', 'EN_OBSERVACION']

const ESTADO_LABEL: Record<string, string> = {
  NO_EMPACADO: 'No Empacado',
  EMPACADO: 'Empacado',
  EN_OBSERVACION: 'En Observación',
  ENVIADO: 'Enviado',
}

const ESTADO_STYLE: Record<string, string> = {
  NO_EMPACADO: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  EMPACADO: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  EN_OBSERVACION: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
  ENVIADO: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
}

function formatearFecha(s?: string | null) {
  if (!s) return '—'
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00') : new Date(s)
  if (isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dinero(n: number | null | undefined) {
  if (n == null) return '—'
  return 'S/ ' + Number(n).toFixed(2)
}

function StepperEnvio({ estado }: { estado: string }) {
  const pasos = [
    { etiqueta: 'Recibido', completo: true },
    {
      etiqueta: 'Validado',
      completo: ['EMPACADO', 'ENVIADO'].includes(estado),
    },
    {
      etiqueta: 'Empacado',
      completo: ['EMPACADO', 'ENVIADO'].includes(estado),
    },
    {
      etiqueta: 'Enviado',
      completo: estado === 'ENVIADO',
    },
  ]
  const orden = ['NO_EMPACADO', 'EN_OBSERVACION', 'EMPACADO', 'ENVIADO']
  const pasoActual = estado === 'ENVIADO' ? -1 : Math.max(orden.indexOf(estado), 0)

  return (
    <div className="flex items-start">
      {pasos.map((paso, idx) => {
        const esActual = idx === pasoActual
        return (
          <div key={paso.etiqueta} className="relative flex flex-1 flex-col items-center text-center">
            {idx > 0 && (
              <span
                className={`absolute right-1/2 top-3 h-0.5 w-full ${
                  pasos[idx - 1].completo ? 'bg-emerald-400' : 'bg-slate-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                paso.completo
                  ? 'bg-emerald-500 text-white'
                  : esActual
                  ? 'bg-sky-500 text-white ring-4 ring-sky-200'
                  : 'bg-white text-slate-400 ring-1 ring-slate-200'
              }`}
            >
              {paso.completo ? <Check size={12} strokeWidth={3} /> : idx + 1}
            </span>
            <p
              className={`mt-1 text-[10px] font-bold ${
                esActual ? 'text-sky-700' : paso.completo ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              {paso.etiqueta}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default function TrackingBox({
  userId,
  onCerrar,
}: {
  userId: string
  onCerrar: () => void
}) {
  const [dni, setDni] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [envios, setEnvios] = useState<TrackingEnvio[] | null>(null)
  const [error, setError] = useState('')
  const [desplegados, setDesplegados] = useState<Record<string, boolean>>({})

  async function buscar() {
    if (!dni.trim()) {
      setError('Ingresa tu DNI para consultar tu pedido.')
      return
    }
    setError('')
    setBuscando(true)
    try {
      const params = new URLSearchParams({ user_id: userId, dni: dni.trim() })
      const res = await fetch(`/api/tracking?${params.toString()}`)
      const json = await res.json()
      setEnvios(json.data ?? [])
    } catch {
      setError('No se pudo consultar tu pedido. Intenta nuevamente.')
    } finally {
      setBuscando(false)
    }
  }

  const activos = (envios || []).filter((e) => ESTADOS_ACTIVOS.includes(e.estado))
  const historial = (envios || []).filter((e) => e.estado === 'ENVIADO')
  const activoActual = activos[0] || null

  function toggle(id: string) {
    setDesplegados((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Head :: buscador */}
        <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Rastrear mi pedido
                </p>
                <p className="text-lg font-bold text-slate-900">¿Cómo va mi pedido?</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Ingresa tu DNI para ver el estado de tus pedidos en este local.
          </p>

          <div className="mt-4 space-y-3">
            <input
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              placeholder="Tu DNI"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
            <button
              type="button"
              onClick={buscar}
              disabled={buscando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-50"
            >
              {buscando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {buscando ? 'Buscando...' : 'Ver mi pedido'}
            </button>
            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
          </div>
        </div>

        {/* Body :: resultado */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-6 py-5">
          {buscando ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin" /> Consultando tus pedidos...
            </div>
          ) : envios === null ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-slate-400">
              <Truck size={28} className="opacity-60" />
              <p className="text-sm">
                Aún no has consultado. Escribe tus datos arriba
                <br />
                y te mostraremos el estado de tu pedido.
              </p>
            </div>
          ) : envios.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
              <Info size={20} />
              No encontramos pedidos con esos datos en este local.
            </div>
          ) : (
            <>
              {/* PEDIDO ACTUAL */}
              {activoActual ? (
                <div className="overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-sky-50/60 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      <p className="text-sm font-bold text-slate-900">Tu pedido en proceso</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        ESTADO_STYLE[activoActual.estado] || 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {ESTADO_LABEL[activoActual.estado] || activoActual.estado}
                    </span>
                  </div>

                  <div className="space-y-4 px-5 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-lg font-bold text-slate-900">
                        {activoActual.nombre || 'Tu pedido'}
                        {activoActual.codigo && (
                          <span className="ml-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 align-middle ring-1 ring-slate-200">
                            {activoActual.codigo}
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">
                        {formatearFecha(activoActual.fecha_registro)}
                      </p>
                    </div>

                    <StepperEnvio estado={activoActual.estado} />

                    {activoActual.fecha_programada && (
                      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500 ring-1 ring-inset ring-slate-100">
                        <Package size={13} className="shrink-0 text-sky-500" />
                        Entrega programada:{' '}
                        <span className="font-bold text-slate-800">
                          {formatearFecha(activoActual.fecha_programada)}
                        </span>
                      </div>
                    )}

                    <span
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-400"
                    >
                      <MapPin size={13} className="shrink-0" />
                      {activoActual.detalle || activoActual.direccion || activoActual.destino || '—'}
                    </span>

                    {activoActual.ventas.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-white">
                        {activoActual.ventas.map((venta, vi) => (
                          <div
                            key={venta.id}
                            className={vi > 0 ? 'border-t border-slate-100' : ''}
                          >
                            <div className="flex items-center justify-between px-4 py-2">
                              <p className="text-xs font-bold text-slate-700">
                                {venta.codigo ? `Venta ${venta.codigo}` : 'Venta'}
                              </p>
                              <p className="text-xs font-bold text-slate-900">
                                {dinero(venta.total)}
                              </p>
                            </div>
                            <div className="divide-y divide-slate-50 px-4 pb-2">
                              {venta.items.map((item, ii) => (
                                <div
                                  key={ii}
                                  className="flex items-center justify-between gap-3 py-1.5 text-sm"
                                >
                                  <span className="text-slate-700">{item.producto_nombre}</span>
                                  <span className="text-xs text-slate-400">
                                    x{item.cantidad} · {dinero(item.precio_unitario)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <Package size={16} className="shrink-0 text-slate-400" />
                  Ahora mismo no tienes pedidos en proceso.
                </div>
              )}

              {/* HISTORIAL */}
              {historial.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Historial de pedidos enviados
                  </p>
                  <div className="space-y-2">
                    {historial.map((e) => {
                      const abierto = !!desplegados[e.id]
                      const totalPedido = e.ventas.reduce(
                        (a, v) => a + Number(v.total || 0),
                        0
                      )
                      return (
                        <div
                          key={e.id}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => toggle(e.id)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {e.nombre || 'Pedido'}
                                {e.codigo && (
                                  <span className="ml-2 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 align-middle">
                                    {e.codigo}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatearFecha(e.fecha_registro)} · {dinero(totalPedido)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  ESTADO_STYLE[e.estado] || 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {ESTADO_LABEL[e.estado] || e.estado}
                              </span>
                              {abierto ? (
                                <ChevronUp size={16} className="text-slate-400" />
                              ) : (
                                <ChevronDown size={16} className="text-slate-400" />
                              )}
                            </div>
                          </button>

                          {abierto && (
                            <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                              <p className="text-xs text-slate-500">
                                Enviado con {e.metodo || '—'}
                                {e.nombre_metodo ? ` · ${e.nombre_metodo}` : ''} ·{' '}
                                {formatearFecha(e.fecha_registro)}
                              </p>
                              {e.ventas.length > 0 ? (
                                <div className="space-y-3">
                                  {e.ventas.map((venta) => (
                                    <div key={venta.id}>
                                      <div className="flex items-center justify-between pb-1">
                                        <p className="text-xs font-bold text-slate-700">
                                          {venta.codigo ? `Venta ${venta.codigo}` : 'Venta'}
                                        </p>
                                        <p className="text-xs font-bold text-slate-900">
                                          {dinero(venta.total)}
                                        </p>
                                      </div>
                                      <div className="divide-y divide-slate-50">
                                        {venta.items.map((item, ii) => (
                                          <div
                                            key={ii}
                                            className="flex items-center justify-between gap-3 py-1 text-sm"
                                          >
                                            <span className="text-slate-700">
                                              {item.producto_nombre}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                              x{item.cantidad} · {dinero(item.precio_unitario)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">Sin detalle de productos.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}