'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/components/GoogleAnalytics'
import LogoTori from '@/components/LogoTori'

type PaymentPlan = 'pro' | 'basic'

export default function PaymentFlow({ initialPlan }: { initialPlan: PaymentPlan }) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1) // 1: selección, 2: pagando, 3: completado
  const [error, setError] = useState<string>('')
  const [redirect, setRedirect] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Verificar estado actual del plan al montar
  useEffect(() => {
    async function checkPlan() {
      try {
        const { data: { user} } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, pro_until')
          .eq('id', user.id)
          .single()

        // Si ya tiene plan activo, redirigir al dashboard
        if (profile.plan && profile.pro_until) {
          const planDate = new Date(profile.pro_until)
          const now = new Date()
          if (
            (profile.plan === 'pro' && now < planDate) ||
            profile.plan === 'business_plus'
          ) {
            router.push('/dashboard')
            return
          }
        }

        setStep(1)
      } catch (e) {
        setError('Error al verificar el plan')
        setStep(1)
      }
    }

    checkPlan()
  }, [router])

  // Manejar el pago
  async function handlePay(planType: PaymentPlan) {
    setIsProcessing(true)
    setError('')

    try {
      // Obtener usuario actual
      const { data: { user} } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Llamar al endpoint para crear sesión de pago
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planType,
        }),
      })

      const paymentData = await res.json()

      if (!paymentData.ok) {
        throw new Error(paymentData.error || 'Error al crear sesión de pago')
      }

      // Redirigir a MercadoPago
      window.location.href = paymentData.initPoint
    } catch (err: any) {
      setError(err.message || 'Error desconocido al procesar el pago')
      setIsProcessing(false)
    }
  }

  // Manejar éxito desde la URL
  useEffect(() => {
    // Verificar si venimos de la página de éxito
    const urlParams = new URLSearchParams(window.location.search)
    const plan = urlParams.get('plan')
    const success = urlParams.get('success') === 'true'

    if (success && plan) {
      // Llamar al endpoint de éxito para actualizar la BD
      fetch('/api/payment/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: plan,
          userId: (await supabase.auth.getUser())?.user?.id || '',
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            // Pequeño delay para que se vea el mensaje de éxito
            const timeout = setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
            return () => clearTimeout(timeout)
          } else {
            setError(data.error || 'Error al procesar el pago')
          }
        })
        .catch((e) => {
          setError('Error communicating with server')
        })
    }
  }, [router])

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-green-500" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5L2 22Z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h2>
          <p className="text-gray-600 mb-6">Tu plan ha sido activado correctamente</p>
          <p className="text-sm text-gray-500 mb-4">
            Tu plan {initialPlan === 'pro' ? 'Pro' : 'Basic'} está activo por 30 días
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-tori-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-tori-700 transition-colors"
          >
            Ir al panel
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => setError('')}
            className="bg-tori-600 text-white py-2 rounded-md"
          >
            Inténtalo de nuevo
          </button>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 py-4">
          <div className="max-w-2xl mx-auto px-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {initialPlan === 'pro' ? 'Plan Pro' : 'Plan Basic'}
            </h1>
            <p className="text-gray-500">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <div className="space-y-6">
            <div>
              <p className="text-gray-500">Plan Basic</p>
              <p className="text-sm text-gray-500">Envíos: 50/mes</p>
              <button
                onClick={() => handlePay('basic')}
                className="w-full bg-white rounded-xl border border-gray-300 p-3 hover:border-tori-600 transition-colors text-left">
                <div>
                  <span className="font-medium text-gray-900">Plan Basic</span>
                  <span className="text-xs text-gray-500">Envíos: 50/mes</span>
                </div>
                <svg
                  class="group-hover:text-tori-600 transition-colors w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 14H5M12 2L19 9l-5 5 5 5z"/>
                </svg>
              </button>
            </div>

            <div>
              <p className="text-gray-500">Plan Pro</p>
              <p className="text-sm text-gray-500">Envíos: 500/mes</p>
              <button
                onClick={() => handlePay('pro')}
                className="w-full bg-tori-600 text-white rounded-xl p-3 hover:bg-tori-700 transition-colors">
                <span className="font-medium text-white">Plan Pro</span>
                <span className="text-sm text-white-800">Envíos: 500/mes</span>
                <svg
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <path d="M12 2v4h10v8H12v4H9v8H2V2h10V2Z"/>
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-slate-200 text-gray-700 py-3 rounded-xl font-medium text-sm transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            {isProcessing ? 'Procesando...' : 'Continuar al pago'}
          </button>
        </main>
      </div>
    )
  }

  if (step === 2 && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">
          Serás redirigido a la pasarela de pago de MercadoPago
        </p>
        <p className="text-gray-500">
          Completa tu pago con tu tarjeta o cuenta bancaria
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => setError('')}
            className="bg-tori-600 text-white py-2 rounded-md"
          >
            Inténtalo de nuevo
          </button>
        </div>
      </div>
    )
  }

  return null
}