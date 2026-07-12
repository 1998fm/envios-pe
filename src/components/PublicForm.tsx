'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

import ThemeToggle from '@/components/ThemeToggle'
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
    ]
    return all.filter((item): item is MetodoDisponible => item !== null)
  }, [metodoMotorizado, metodoShalom, metodoOlva, metodoMarvisur, metodoFlores, metodoOtro, nombreOtro])

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

  const handleDistritoChange = useCallback(async (nuevoDistrito: string) => {
    setDistrito(nuevoDistrito)

    if (!nuevoDistrito) {
      setTarifaMotorizado(null)
      return
    }

    setCargandoTarifa(true)

    try {
      const res = await fetch(
        `/api/tarifa-moto?distrito=${encodeURIComponent(nuevoDistrito)}`
      )
      const data = await res.json()
      setTarifaMotorizado(data.precio)
    } catch {
      setTarifaMotorizado(null)
    }

    setCargandoTarifa(false)
  }, [])

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
            : distrito,
        direccion,
        referencia,
        detalle,
        observaciones: '',
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
  }, [nombre, dni, telefono, metodo, agencia, provincia, distrito, direccion, referencia, userId, nombreOtro])

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
        bg-white dark:bg-slate-800/95
        rounded-2xl shadow-xl dark:shadow-slate-900/50
        border border-slate-100 dark:border-slate-700/50
        p-4 sm:p-8
        relative overflow-hidden
        animate-fade-in-up
      ">
        <div className="
          absolute top-0 left-0 right-0 h-1.5
          bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600
        " />

        <ThemeToggle />

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
          className="inline-flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
        >
          <img
            src="/images/tori/tori-logo.png"
            alt="Tori"
            className="w-5 h-5 object-contain opacity-60"
          />
          Quiero usar Tori en mi emprendimiento
        </a>
      </div>
    </div>
  )
}
