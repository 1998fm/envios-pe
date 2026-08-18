'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Loader2, AlertCircle, ScanBarcode, Keyboard } from 'lucide-react'

type Props = {
  abierto: boolean
  onCerrar: () => void
  onDetectar: (codigo: string) => void
}

const ELEMENT_ID = 'escanner-ventas-camara'

export default function EscannerVentas({ abierto, onCerrar, onDetectar }: Props) {
  const [estado, setEstado] = useState<'arrancando' | 'activo' | 'error'>('arrancando')
  const [mensajeError, setMensajeError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [manual, setManual] = useState('')
  const ultimoCodigoRef = useRef('')
  const ultimoTiempoRef = useRef(0)
  const onDetectarRef = useRef(onDetectar)
  onDetectarRef.current = onDetectar

  useEffect(() => {
    if (!abierto) return

    let cancelado = false
    let scanner: Html5Qrcode | null = null

    setEstado('arrancando')
    setMensajeError('')

    async function iniciar() {
      try {
        scanner = new Html5Qrcode(ELEMENT_ID)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (ancho, alto) => {
              const lado = Math.min(ancho, alto) * 0.95
              return { width: lado, height: lado }
            },
          },
          (decodedText) => {
            if (cancelado) return
            const ahora = Date.now()
            if (decodedText === ultimoCodigoRef.current && ahora - ultimoTiempoRef.current < 2500) return
            ultimoCodigoRef.current = decodedText
            ultimoTiempoRef.current = ahora
            onDetectarRef.current(decodedText)
          },
          () => {},
        )
        if (!cancelado) setEstado('activo')
      } catch (err) {
        console.error('Error al iniciar la cámara:', err)
        if (!cancelado) {
          setEstado('error')
          setMensajeError('No se pudo acceder a la cámara. Verifica los permisos o usa el escáner USB / ingreso manual.')
        }
      }
    }

    iniciar()

    const t = setTimeout(() => inputRef.current?.focus(), 400)

    return () => {
      cancelado = true
      clearTimeout(t)
      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scanner!.clear()
            } catch {
              // ignore
            }
          })
      }
      scannerRef.current = null
    }
  }, [abierto])

  if (!abierto) return null

  function procesarManual() {
    const codigo = manual.trim()
    if (!codigo) return
    setManual('')
    inputRef.current?.focus()
    onDetectar(codigo)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanBarcode size={18} className="text-sky-600" />
            <h3 className="text-lg font-bold text-slate-900">Escanear productos</h3>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-h-[420px] mx-auto w-full">
            <div id={ELEMENT_ID} className="w-full h-full" />
            {estado === 'arrancando' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 gap-2 bg-black/60">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm font-medium">Iniciando cámara...</p>
              </div>
            )}
            {estado === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2 bg-black/60 p-4 text-center">
                <AlertCircle size={28} className="text-amber-400" />
                <p className="text-sm font-medium">{mensajeError}</p>
              </div>
            )}
            {estado === 'activo' && (
              <p className="absolute bottom-2 left-0 right-0 text-center text-[11px] text-white/80 bg-black/40 py-1">
                Apunta a la etiqueta con el código QR del producto
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Keyboard size={13} /> Escáner USB o ingreso manual
            </label>
            <div className="flex gap-2 mt-1">
              <input
                ref={inputRef}
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && procesarManual()}
                placeholder="Escanea con tu lector USB o escribe el SKU"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
              <button onClick={procesarManual} className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 shrink-0">
                Agregar
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Si usas un lector USB, solo apúntalo al código: ingresa el código y presiona Enter automáticamente.</p>
          </div>
        </div>
      </div>
    </div>
  )
}