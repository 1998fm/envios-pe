'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

import { Store, Package } from 'lucide-react'
import FormHeader from '@/components/FormHeader'
import PersonalDataSection from '@/components/PersonalDataSection'
import ShippingMethodCards from '@/components/ShippingMethodCards'
import ConditionalFields from '@/components/ConditionalFields'
import SubmitButton from '@/components/SubmitButton'
import ErrorBanner from '@/components/ErrorBanner'
import SocialLinks from '@/components/SocialLinks'
import SuccessScreen from '@/components/SuccessScreen'
import { useAgenciasShalom } from '@/lib/hooks/useAgenciasShalom'
import provinciasOlva from '@/data/provincias-olva.json'
import distritosMoto from '@/data/distritos-moto.json'
import { existeEnLista } from '@/lib/listaValida'

type Props = {
  userId: string
  isPro?: boolean
  isBusinessPlus?: boolean
  logoUrl?: string
  redirectMessage?: string
  redirectMessageImage?: string
  redirectUrl?: string
  instagramUrl?: string
  facebookUrl?: string
  tiktokUrl?: string
  webUrl?: string
  whatsappUrl?: string
  metodoMotorizado?: boolean
  metodoShalom?: boolean
  metodoOlva?: boolean
  metodoMarvisur?: boolean
  metodoFlores?: boolean
  metodoOtro?: boolean
  nombreMetodoOtro?: string
  metodoRecojo?: boolean
  mensajeRecojo?: string
  solicitarCantidadProductos?: boolean
  mostrarEscogerFecha?: boolean
  formularioDeshabilitado?: boolean
  cerrarFormularioMensaje?: string
}

type MetodoDisponible = { value: string; label: string }

// ============================================================
// Llave de idempotencia ("ticket"): se genera una vez por sesión
// del formulario y sobrevive recargas de la página. El servidor
// la usa para garantizar que N reintentos = 1 solo pedido.
// Se libera cuando el cliente ve la pantalla de éxito.
// ============================================================
function generarUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function leerOcrearLlave(userId: string): string {
  const storageKey = `tori_form_idem_${userId}`
  try {
    const guardada = sessionStorage.getItem(storageKey)
    if (guardada) return guardada
  } catch {}
  const nueva = generarUuid()
  try {
    sessionStorage.setItem(storageKey, nueva)
  } catch {}
  return nueva
}

function liberarLlave(userId: string) {
  try {
    sessionStorage.removeItem(`tori_form_idem_${userId}`)
  } catch {}
}

function formatearFecha(fechaStr: string): string {
  const [y, m, d] = fechaStr.split('-').map(Number)
  const fecha = new Date(y, m - 1, d)
  return fecha.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function PublicForm({
  userId,
  isPro = false,
  isBusinessPlus = false,
  logoUrl,
  redirectMessage,
  redirectMessageImage,
  redirectUrl,
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  webUrl,
  whatsappUrl,
  metodoMotorizado,
  metodoShalom,
  metodoOlva,
  metodoMarvisur,
  metodoFlores,
  metodoOtro,
  nombreMetodoOtro,
  metodoRecojo,
  mensajeRecojo,
  solicitarCantidadProductos = false,
  mostrarEscogerFecha = true,
  formularioDeshabilitado = false,
  cerrarFormularioMensaje = '',
}: Props) {
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [error, setError] = useState('')
  const enviandoRef = useRef(false)
  const [idempotencyKey] = useState(() => leerOcrearLlave(userId))

  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cantidadProductos, setCantidadProductos] = useState('')

  const nombreOtro = nombreMetodoOtro ?? ''

  const metodosDisponibles = useMemo<MetodoDisponible[]>(() => {
    const all: (MetodoDisponible | null)[] = [
      metodoMotorizado ? { value: 'MOTORIZADO', label: 'Motorizado' } : null,
      metodoShalom ? { value: 'SHALOM', label: 'Shalom' } : null,
      metodoOlva ? { value: 'OLVA', label: 'Olva' } : null,
      metodoMarvisur ? { value: 'MARVISUR', label: 'Marvisur' } : null,
      metodoFlores ? { value: 'FLORES', label: 'Flores' } : null,
      metodoOtro && nombreOtro.trim()
        ? { value: 'OTRO', label: nombreOtro }
        : null,
      metodoRecojo ? { value: 'RECOJO', label: 'Recojo en tienda' } : null,
    ]
    return all.filter((item): item is MetodoDisponible => item !== null)
  }, [metodoMotorizado, metodoShalom, metodoOlva, metodoMarvisur, metodoFlores, metodoOtro, nombreOtro, metodoRecojo])

  const [metodo, setMetodo] = useState(
    metodosDisponibles.length > 0 ? metodosDisponibles[0].value : ''
  )
  const [agencia, setAgencia] = useState('')
  const [provincia, setProvincia] = useState('')
  const [distrito, setDistrito] = useState('')
  const [tarifaMotorizado, setTarifaMotorizado] = useState<number | null>(null)
  const [cargandoTarifa, setCargandoTarifa] = useState(false)
  const [direccion, setDireccion] = useState('')
  const [referencia, setReferencia] = useState('')

  const { agencias: agenciasShalom } = useAgenciasShalom()

  const [escogerDia, setEscogerDia] = useState(false)
  const [fechasDisponibles, setFechasDisponibles] = useState<string[]>([])
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [cargandoFechas, setCargandoFechas] = useState(false)

  const activarEscogerDia = useCallback(async () => {
    setEscogerDia(true)
    setCargandoFechas(true)
    try {
      const res = await fetch(`/api/logistica/moto?userId=${userId}`)
      const data = await res.json()
      setFechasDisponibles(data.fechasDisponibles ?? [])
    } catch {
      setFechasDisponibles([])
    }
    setCargandoFechas(false)
  }, [userId])

  const desactivarEscogerDia = useCallback(() => {
    setEscogerDia(false)
    setFechasDisponibles([])
    setFechaSeleccionada('')
  }, [])

  useEffect(() => {
    if (metodo !== 'MOTORIZADO') {
      desactivarEscogerDia()
    }
  }, [metodo, desactivarEscogerDia])

  const handleDistritoChange = useCallback(async (nuevoDistrito: string) => {
    setDistrito(nuevoDistrito)

    if (!nuevoDistrito) {
      setTarifaMotorizado(null)
      return
    }

    setCargandoTarifa(true)

    try {
      const res = await fetch(
        `/api/tarifa-moto?userId=${userId}&distrito=${encodeURIComponent(nuevoDistrito)}`
      )
      const data = await res.json()
      setTarifaMotorizado(data.precio)
    } catch {
      setTarifaMotorizado(null)
    }

    setCargandoTarifa(false)
  }, [userId])

  useEffect(() => {
    if (enviado && isPro && redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = redirectUrl
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [enviado, redirectUrl, isPro])

  const handleSubmit = useCallback(async () => {
    if (enviandoRef.current || loading) return
    enviandoRef.current = true
    setError('')
    setLoading(true)

    if (!nombre.trim()) {
      setError('Ingresa tu nombre.')
      setLoading(false)
      enviandoRef.current = false
      return
    }

    if (!dni.trim()) {
      setError('Ingresa tu documento.')
      setLoading(false)
      enviandoRef.current = false
      return
    }

    if (telefono.trim().length < 9) {
      setError('Ingresa un teléfono válido.')
      setLoading(false)
      enviandoRef.current = false
      return
    }

    if (solicitarCantidadProductos && (!cantidadProductos.trim() || Number(cantidadProductos) < 1)) {
      setError('Indica la cantidad de prendas a recibir (mínimo 1).')
      setLoading(false)
      enviandoRef.current = false
      return
    }

    if (metodo === 'SHALOM' && !existeEnLista(agenciasShalom, agencia)) {
      setError('Selecciona una agencia Shalom de la lista.')
      setLoading(false)
      enviandoRef.current = false
      return
    }

    if (
      ['OLVA', 'MARVISUR', 'FLORES', 'OTRO'].includes(metodo) &&
      (!existeEnLista(provinciasOlva, provincia) || !direccion)
    ) {
      setError('Selecciona una provincia de la lista y completa la dirección.')
      setLoading(false)
      enviandoRef.current = false
      return
    }

    if (metodo === 'MOTORIZADO' && (!existeEnLista(distritosMoto, distrito) || !direccion)) {
      setError('Selecciona un distrito de la lista y completa la dirección.')
      setLoading(false)
      enviandoRef.current = false
      return
    }

    let detalle = ''
    if (metodo === 'RECOJO') detalle = mensajeRecojo || 'Recojo en tienda'
    if (metodo === 'SHALOM') detalle = agencia
    if (['OLVA', 'MARVISUR', 'FLORES', 'OTRO'].includes(metodo)) {
      detalle = `Provincia: ${provincia}\nDirección: ${direccion}\nReferencia: ${referencia}`
    }
    if (metodo === 'MOTORIZADO') {
      detalle = `Distrito: ${distrito}\nDirección: ${direccion}\nReferencia: ${referencia}`
    }

    try {
      const res = await fetch('/api/envios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          nombre,
          dni,
          telefono,
          ...(solicitarCantidadProductos && cantidadProductos.trim()
            ? { cantidad_productos: Number(cantidadProductos) }
            : {}),
          metodo,
          nombre_metodo: metodo === 'OTRO' ? nombreOtro : null,
          destino:
            metodo === 'SHALOM'
              ? agencia
              : ['OLVA', 'MARVISUR', 'FLORES', 'OTRO'].includes(metodo)
              ? provincia
              : metodo === 'RECOJO'
              ? 'RECOJO'
              : distrito,
          direccion,
          referencia,
          detalle,
          observaciones: '',
          idempotency_key: idempotencyKey,
          ...(isPro && fechaSeleccionada ? { fecha_programada: new Date(fechaSeleccionada + 'T12:00:00').toISOString() } : {}),
        }),
      })

      if (!res.ok) {
        setError('Ocurrió un error al registrar el pedido. Inténtalo de nuevo.')
        return
      }

      const resultado = await res.json()
      setFechaProgramada(resultado.envio.fecha_programada)
      setEnviado(true)
      // El cliente ya vio la confirmación: liberar el ticket para
      // que un próximo pedido en esta sesión sea uno nuevo.
      liberarLlave(userId)
    } catch {
      setError('No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(false)
      enviandoRef.current = false
    }
  }, [nombre, dni, telefono, cantidadProductos, metodo, agencia, provincia, distrito, direccion, referencia, userId, nombreOtro, fechaSeleccionada, isPro, idempotencyKey, agenciasShalom, solicitarCantidadProductos])

  if (formularioDeshabilitado) {
    return (
      <div className="max-w-xl mx-auto mt-6 sm:mt-10 px-3 sm:px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600" />
          <div className="flex flex-col items-center gap-4">
            {isPro && logoUrl && (
              <div className="flex justify-center">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="max-h-20 object-contain"
                />
              </div>
            )}
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Package size={24} className="text-slate-500" />
            </div>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
              {cerrarFormularioMensaje || 'En este momento no estamos recibiendo pedidos. ¡Gracias por tu comprensión!'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="max-w-xl mx-auto mt-6 sm:mt-10 px-3 sm:px-4">
        <SuccessScreen
          logoUrl={isPro ? logoUrl : undefined}
          redirectMessage={isPro ? redirectMessage : undefined}
          redirectMessageImage={isPro ? redirectMessageImage : undefined}
          redirectUrl={isPro ? redirectUrl : undefined}
          fechaProgramada={fechaProgramada}
        />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto mt-4 sm:mt-6 px-3 sm:px-4">
      <div className="
        bg-white 
        rounded-2xl shadow-xl 
        border border-slate-100 
        p-4 sm:p-8
        relative overflow-hidden
        animate-fade-in-up
      ">
        <div className="
          absolute top-0 left-0 right-0 h-1.5
          bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600
        " />

        <div className="space-y-6 mt-2">
          <FormHeader logoUrl={isPro ? logoUrl : undefined} />

          <PersonalDataSection
            nombre={nombre}
            setNombre={setNombre}
            dni={dni}
            setDni={setDni}
            telefono={telefono}
            setTelefono={setTelefono}
          />

          <ShippingMethodCards
            metodos={metodosDisponibles}
            selected={metodo}
            onSelect={setMetodo}
          />

          {metodo === 'RECOJO' ? (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shrink-0">
                  <Store size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Recojo en tienda</p>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                    {mensajeRecojo || 'Recoge tu pedido en nuestra tienda. Te esperamos!'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ConditionalFields
              metodo={metodo}
              agenciasShalom={agenciasShalom}
              agencia={agencia}
              setAgencia={setAgencia}
              provincia={provincia}
              setProvincia={setProvincia}
              distrito={distrito}
              setDistrito={handleDistritoChange}
              direccion={direccion}
              setDireccion={setDireccion}
              referencia={referencia}
              setReferencia={setReferencia}
              tarifaMotorizado={tarifaMotorizado}
              cargandoTarifa={cargandoTarifa}
            />
          )}

          {metodo === 'MOTORIZADO' && isPro && mostrarEscogerFecha && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-600 ">
                <input
                  type="checkbox"
                  checked={escogerDia}
                  onChange={(e) => {
                    if (e.target.checked) {
                      activarEscogerDia()
                    } else {
                      desactivarEscogerDia()
                    }
                  }}
                  className="w-4 h-4 accent-sky-500 rounded"
                />
                Escoger día de entrega
              </label>

              {escogerDia && (
                <div className="ml-6">
                  {cargandoFechas ? (
                    <p className="text-xs text-slate-400">Cargando fechas...</p>
                  ) : fechasDisponibles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {fechasDisponibles.map((fechaStr) => {
                        const seleccionada = fechaSeleccionada === fechaStr
                        return (
                          <button
                            key={fechaStr}
                            type="button"
                            onClick={() => setFechaSeleccionada(fechaStr)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                              seleccionada
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-white  border-slate-200  text-slate-600  hover:border-sky-400'
                            }`}
                          >
                            {formatearFecha(fechaStr)}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No hay fechas disponibles.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {solicitarCantidadProductos && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <label className="block font-semibold text-slate-900 mb-2 text-sm">
                Cantidad de prendas a recibir
              </label>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={cantidadProductos}
                onChange={(e) => setCantidadProductos(e.target.value)}
                placeholder="Ej: 3"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400"
              />
            </div>
          )}

          <ErrorBanner error={error} />

          <SubmitButton loading={loading} onClick={handleSubmit} />

          <SocialLinks
            instagramUrl={isBusinessPlus ? instagramUrl : undefined}
            facebookUrl={isBusinessPlus ? facebookUrl : undefined}
            tiktokUrl={isBusinessPlus ? tiktokUrl : undefined}
            webUrl={isBusinessPlus ? webUrl : undefined}
            whatsappUrl={isBusinessPlus ? whatsappUrl : undefined}
          />
        </div>
      </div>

      <div className="mt-6 text-center">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-slate-400  hover:text-sky-600 :text-sky-400 transition-colors"
        >
          <img
            src="/images/tori/tori-logo.webp"
            alt="Tori"
            className="w-5 h-5 object-contain opacity-60"
          />
          Quiero usar Tori en mi emprendimiento
        </a>
      </div>
    </div>
  )
}
