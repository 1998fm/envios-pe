'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

import { Store } from 'lucide-react'
import FormHeader from '@/components/FormHeader'
import PersonalDataSection from '@/components/PersonalDataSection'
import ShippingMethodCards from '@/components/ShippingMethodCards'
import ConditionalFields from '@/components/ConditionalFields'
import SubmitButton from '@/components/SubmitButton'
import ErrorBanner from '@/components/ErrorBanner'
import SocialLinks from '@/components/SocialLinks'
import SuccessScreen from '@/components/SuccessScreen'

type Props = {
  userId: string
  logoUrl?: string
  redirectMessage?: string
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
}

type MetodoDisponible = { value: string; label: string }

export default function PublicForm({
  userId,
  logoUrl,
  redirectMessage,
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
}: Props) {
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')

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

  const [escogerDia, setEscogerDia] = useState(false)
  const [fechasDisponibles, setFechasDisponibles] = useState<string[]>([])
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [cargandoFechas, setCargandoFechas] = useState(false)

  async function activarEscogerDia() {
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
  }

  function desactivarEscogerDia() {
    setEscogerDia(false)
    setFechasDisponibles([])
    setFechaSeleccionada('')
  }

  useEffect(() => {
    if (metodo !== 'MOTORIZADO') {
      desactivarEscogerDia()
    }
  }, [metodo])

  function formatearFecha(fechaStr: string): string {
    const [y, m, d] = fechaStr.split('-').map(Number)
    const fecha = new Date(y, m - 1, d)
    return fecha.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

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
    if (enviado && redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = redirectUrl
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [enviado, redirectUrl])

  const handleSubmit = useCallback(async () => {
    setError('')
    setLoading(true)

    if (!nombre.trim()) {
      setError('Ingresa tu nombre.')
      setLoading(false)
      return
    }

    if (!dni.trim()) {
      setError('Ingresa tu documento.')
      setLoading(false)
      return
    }

    if (telefono.trim().length < 9) {
      setError('Ingresa un teléfono válido.')
      setLoading(false)
      return
    }

    if (metodo === 'SHALOM' && !agencia) {
      setError('Selecciona una agencia.')
      setLoading(false)
      return
    }

    if (['OLVA', 'MARVISUR', 'FLORES', 'OTRO'].includes(metodo) && (!provincia || !direccion)) {
      setError('Completa los datos de envío.')
      setLoading(false)
      return
    }

    if (metodo === 'MOTORIZADO' && (!distrito || !direccion)) {
      setError('Completa los datos de envío.')
      setLoading(false)
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

    const res = await fetch('/api/envios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        nombre,
        dni,
        telefono,
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
        ...(fechaSeleccionada ? { fecha_programada: new Date(fechaSeleccionada + 'T12:00:00').toISOString() } : {}),
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const errorData = await res.json()
      console.log(errorData)
      setError('Ocurrió un error al registrar el pedido.')
      return
    }

    const resultado = await res.json()
    console.log('Fecha recibida:', resultado.envio.fecha_programada)
    setFechaProgramada(resultado.envio.fecha_programada)
    setEnviado(true)
  }, [nombre, dni, telefono, metodo, agencia, provincia, distrito, direccion, referencia, userId, nombreOtro, fechaSeleccionada])

  if (enviado) {
    return (
      <div className="max-w-xl mx-auto mt-6 sm:mt-10 px-3 sm:px-4">
        <SuccessScreen
          logoUrl={logoUrl}
          redirectMessage={redirectMessage}
          redirectUrl={redirectUrl}
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
          <FormHeader logoUrl={logoUrl} />

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

          {metodo === 'MOTORIZADO' && (
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

          <ErrorBanner error={error} />

          <SubmitButton loading={loading} onClick={handleSubmit} />

          <SocialLinks
            instagramUrl={instagramUrl}
            facebookUrl={facebookUrl}
            tiktokUrl={tiktokUrl}
            webUrl={webUrl}
            whatsappUrl={whatsappUrl}
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
