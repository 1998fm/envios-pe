'use client'

import { useState } from 'react'
import type { Venta } from '@/types/inventario'
import ModalDetalleDocumento from '@/components/ModalDetalleDocumento'
import { Lock, FileText, Loader2 } from 'lucide-react'
import { openUpgrade, planNivel } from '@/lib/planGating'
import { toast } from 'sonner'

type Props = {
  venta: Venta | null
  onCerrar: () => void
  plan?: string
  userId: string
  ruc?: string
}

export default function ModalDetalleVenta({ venta, onCerrar, plan = 'basic', userId, ruc = '' }: Props) {
  const [showFacturacion, setShowFacturacion] = useState(false)
  const [tipoDoc, setTipoDoc] = useState<'01' | '03'>('03')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string; comprobante_id?: string } | null>(null)

  if (!venta) return null

  const badge = {
    COMPLETADA: 'bg-emerald-100 text-emerald-700',
    ANULADA: 'bg-red-100 text-red-700',
    PENDIENTE: 'bg-amber-100 text-amber-700',
  }[venta.estado]

  const costo = (venta.items || []).reduce(
    (sum, it) => sum + (it.costo_unitario ?? 0) * it.cantidad,
    0
  )
  const ganancia = venta.total - costo
  const pctGanancia = venta.total > 0 ? (ganancia / venta.total) * 100 : 0

  async function emitirComprobante() {
    if (!venta) return
    setEnviando(true)
    setResultado(null)

    const toriFacturaUrl = process.env.NEXT_PUBLIC_TORI_FACTURA_URL || 'http://localhost:3001'

    if (!ruc) {
      setResultado({
        ok: false,
        mensaje: 'Configura tu RUC en Configuracion > Empresa para facturar',
      })
      setEnviando(false)
      return
    }

    try {
      const res = await fetch(`${toriFacturaUrl}/api/recibir-venta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ruc': ruc,
        },
        body: JSON.stringify({
          tori_venta_id: venta.id,
          cliente: {
            nombre: venta.persona_nombre,
            dni_ruc: venta.persona_dni,
            tipo_doc: venta.persona_dni?.length === 11 ? '6' : '1',
          },
          items: (venta.items || []).map(item => ({
            descripcion: item.producto_nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
          })),
          tipo_documento: tipoDoc,
          metodo_pago: venta.metodo_pago === 'TARJETA' ? 'Credito' : 'Contado',
        }),
      })

      const data = await res.json()

      if (data.ok) {
        setResultado({
          ok: true,
          mensaje: data.mensaje || 'Comprobante emitido exitosamente',
          comprobante_id: data.comprobante_id,
        })
        toast.success('Comprobante emitido')
      } else {
        setResultado({
          ok: false,
          mensaje: data.error || 'Error al emitir comprobante',
        })
        toast.error(data.error || 'Error al emitir comprobante')
      }
    } catch (error) {
      setResultado({
        ok: false,
        mensaje: 'Error de conexion con Tori Factura',
      })
      toast.error('Error de conexion')
    }

    setEnviando(false)
  }

  const tiles = (
    <>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">DNI</p>
        <p className="font-semibold text-slate-900 text-sm">{venta.persona_dni || '—'}</p>
      </div>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Estado</p>
        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>
          {venta.estado}
        </span>
      </div>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Pago</p>
        <p className="font-semibold text-slate-900 text-sm">
          {venta.metodo_pago === 'EFECTIVO' ? 'Efectivo' : venta.metodo_pago === 'YAPE_PLIN' ? 'Yape / Plin' : 'Tarjeta'}
        </p>
      </div>
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Total</p>
        <p className="font-bold text-slate-900 text-lg">S/ {venta.total.toFixed(2)}</p>
      </div>
      {planNivel(plan) >= 1 ? (
        <div className="bg-slate-50 rounded-2xl p-3">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Ganancia</p>
          <p className="font-bold text-emerald-600 text-lg">S/ {ganancia.toFixed(2)}</p>
          <p className="text-[11px] text-slate-400">{pctGanancia.toFixed(0)}% de la venta</p>
        </div>
      ) : (
        <button
          onClick={openUpgrade}
          className="bg-slate-50 rounded-2xl p-3 text-left border border-dashed border-slate-300 hover:border-sky-300 transition-colors"
        >
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Ganancia</p>
          <p className="font-bold text-slate-400 text-lg flex items-center gap-2">
            <Lock size={16} />
            Ver planes
          </p>
        </button>
      )}
      <div className="bg-slate-50 rounded-2xl p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Fecha</p>
        <p className="font-semibold text-slate-900 text-sm">
          {new Date(venta.created_at).toLocaleString('es-PE')}
        </p>
      </div>
    </>
  )

  return (
    <>
      <ModalDetalleDocumento
        titulo="Detalle de venta"
        entidadLabel="Cliente"
        entidadNombre={venta.persona_nombre}
        tiles={tiles}
        items={venta.items}
        onCerrar={onCerrar}
        tourId="modal-detalle-venta"
        footer={
          venta.estado === 'COMPLETADA' ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowFacturacion(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:shadow-lg hover:shadow-emerald-500/20 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <FileText size={16} />
                Emitir Comprobante
              </button>
              <button
                onClick={onCerrar}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                Cerrar
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Modal de Facturacion */}
      {showFacturacion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {!resultado ? (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Emitir Comprobante</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo de documento</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setTipoDoc('03')}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                          tipoDoc === '03'
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'
                        }`}
                      >
                        Boleta de Venta
                      </button>
                      <button
                        onClick={() => setTipoDoc('01')}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                          tipoDoc === '01'
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'
                        }`}
                      >
                        Factura
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {tipoDoc === '01' 
                        ? 'Factura: para empresas con RUC (documento tributario formal)'
                        : 'Boleta: para personas con DNI (venta al detal)'}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Cliente:</span>
                      <span className="font-medium text-slate-900">{venta.persona_nombre}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-slate-500">Documento:</span>
                      <span className="font-medium text-slate-900">{venta.persona_dni || 'Sin documento'}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-slate-500">Total:</span>
                      <span className="font-bold text-slate-900">S/ {venta.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowFacturacion(false)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={emitirComprobante}
                    disabled={enviando}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {enviando ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Emitir Ahora'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={`text-center py-6 ${resultado.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    resultado.ok ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {resultado.ok ? (
                      <FileText size={32} />
                    ) : (
                      <span className="text-32xl">✕</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {resultado.ok ? 'Comprobante Emitido' : 'Error'}
                  </h3>
                  <p className="text-sm text-slate-500">{resultado.mensaje}</p>
                  {resultado.comprobante_id && (
                    <p className="text-xs text-slate-400 mt-2">ID: {resultado.comprobante_id}</p>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setResultado(null)
                      setShowFacturacion(false)
                      onCerrar()
                    }}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
