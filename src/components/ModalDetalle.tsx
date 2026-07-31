'use client'

import { useState, useEffect } from 'react'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import type { Envio } from '@/types/envio'
import { Package, Truck, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
  enviado: boolean
}

type VentaConItems = {
  id: string
  estado: string
  estado_envio: string
  total: number
  persona_nombre: string
  items: VentaItemInfo[]
}

export default function ModalDetalle({ envio, onCerrar, onUpdate, onDelete }: Props) {
  const supabase = createClient()
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [ventasCliente, setVentasCliente] = useState<VentaConItems[]>([])
  const [loadingVentas, setLoadingVentas] = useState(false)
  const [marcandoEnvio, setMarcandoEnvio] = useState(false)

  useEffect(() => {
    if (envio?.dni) {
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

      const { data: envioItems } = await supabase
        .from('envio_items')
        .select('venta_item_id')
        .eq('envio_id', current.id)

      const enviadoIds = new Set((envioItems || []).map((ei: any) => ei.venta_item_id))

      const items: VentaItemInfo[] = (itemsData || []).map((item: any) => ({
        id: item.id,
        venta_id: item.venta_id,
        producto_nombre: item.producto_nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        enviado: enviadoIds.has(item.id),
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

  async function toggleEnvioItem(ventaItemId: string, enviado: boolean) {
    if (enviado) return
    setMarcandoEnvio(true)

    const { error } = await supabase
      .from('envio_items')
      .upsert({
        envio_id: current.id,
        venta_item_id: ventaItemId,
        cantidad: 1,
      })

    if (error) {
      toast.error('Error al marcar producto')
    } else {
      toast.success('Producto marcado para este envío')
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

  const totalProductosSinEnviar = ventasCliente.reduce(
    (sum, v) => sum + v.items.filter((i) => !i.enviado).length,
    0
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="border-b border-slate-100 px-4 sm:px-8 py-3 sm:py-4 shrink-0">
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Detalle del pedido
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Información completa del envío seleccionado.
          </p>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
              Cliente
            </div>
            <div className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {envio.nombre}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Documento', value: envio.dni },
              { label: 'Teléfono', value: envio.telefono },
              { label: 'Método', value: envio.metodo },
              { label: 'Estado', value: envio.estado },
              { label: 'Tamaño', value: envio.tamano },
              { label: 'Registro', value: new Date(envio.fecha_registro).toLocaleString('es-PE') },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-2xl p-3">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                  {item.label}
                </p>
                <p className="font-semibold text-slate-900 text-sm">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
              Fecha programada
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fechaInicial}
                onChange={(e) => setFechaProgramada(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={guardarFecha}
                disabled={guardando || !fechaProgramada || fechaProgramada === current.fecha_programada?.split('T')[0]}
                className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white disabled:opacity-40 hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200 shrink-0"
              >
                {guardando ? '...' : 'Guardar'}
              </button>
            </div>
            {mensaje && (
              <p className={`mt-1.5 text-xs font-semibold ${mensaje.includes('Error') ? 'text-red-500' : 'text-emerald-600'}`}>
                {mensaje}
              </p>
            )}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
              Destino
            </p>
            <div className="text-slate-800 leading-relaxed whitespace-pre-line text-sm">
              {envio.detalle}
            </div>
          </div>

          {/* PRODUCTOS DEL CLIENTE */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-sky-600" />
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Productos comprados por el cliente
              </p>
              {totalProductosSinEnviar > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {totalProductosSinEnviar} sin enviar
                </span>
              )}
            </div>

            {loadingVentas ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 size={16} className="animate-spin mr-2" />
                Cargando productos...
              </div>
            ) : ventasCliente.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No se encontraron ventas para este cliente
              </p>
            ) : (
              <div className="space-y-3">
                {ventasCliente.map((venta) => (
                  <div key={venta.id} className="bg-white rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500">
                        Venta #{venta.id.slice(0, 8)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        venta.estado_envio === 'ENVIADO'
                          ? 'bg-emerald-100 text-emerald-700'
                          : venta.estado_envio === 'EMPACADO'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {venta.estado_envio || 'PENDIENTE'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {venta.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="flex-1 text-slate-700 truncate">
                            {item.producto_nombre}
                          </span>
                          <span className="text-slate-400 text-xs">
                            x{item.cantidad} · {formatMoney(item.precio_unitario)}
                          </span>
                          {item.enviado ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                              <Check size={10} /> Enviado
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleEnvioItem(item.id, false)}
                              disabled={marcandoEnvio}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors flex items-center gap-1"
                            >
                              <Truck size={10} /> Marcar envío
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-right text-xs text-slate-400 font-mono">
                      Total: {formatMoney(venta.total)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 p-3 sm:p-4 flex items-center justify-between shrink-0 bg-white rounded-b-[28px]">
          {confirmandoEliminar ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-semibold">¿Eliminar este pedido?</span>
              <button
                onClick={eliminarEnvio}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setConfirmandoEliminar(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmandoEliminar(true)}
              className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
            >
              Eliminar
            </button>
          )}
          <button
            onClick={onCerrar}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-lg hover:shadow-sky-500/20 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}