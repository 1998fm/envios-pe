'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, X, Copy, CheckCheck } from 'lucide-react'
import confetti from 'canvas-confetti'
import LogoTori from '@/components/LogoTori'
import ToriMascot from '@/components/ToriMascot'
import OnboardingStep1Empresa from '@/components/OnboardingStep1Empresa'
import OnboardingStep2Metodos from '@/components/OnboardingStep2Metodos'
import OnboardingStep3Logistica from '@/components/OnboardingStep3Logistica'
import OnboardingStep4Tarifas from '@/components/OnboardingStep4Tarifas'
import {
  guardarPasoEmpresa,
  guardarPasoMetodos,
  guardarPasoLogistica,
  guardarPasoTarifas,
} from '@/lib/onboardingGuardar'
import type { ConfigState } from '@/types/config'

const initialConfig: ConfigState = {
  vistaConfig: 'EMPRESA',
  empresa: '',
  telefonoEmpresa: '',
  direccionEmpresa: '',
  nuevoOrigen: '',
  logoFile: null,
  logoUrl: '',
  redirectUrl: '',
  redirectMessage: '',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  webUrl: '',
  whatsappUrl: '',
  metodoMotorizado: true,
  metodoShalom: true,
  metodoOlva: false,
  metodoMarvisur: false,
  metodoFlores: false,
  metodoOtro: false,
  nombreMetodoOtro: '',
  metodoRecojo: false,
  mensajeRecojo: 'Recoge tu pedido en nuestra tienda. Te esperamos!',
  logisticaMotoDias: ['MONDAY'],
  logisticaMotoHoraCorte: '18:00',
  logisticaMotoUsaHoraCorte: false,
  logisticaMotoLimitar: false,
  logisticaMotoCupo: 0,
  logisticaAgenciasDias: ['MONDAY'],
  logisticaAgenciasHoraCorte: '18:00',
  logisticaAgenciasUsaHoraCorte: false,
  logisticaAgenciasLimitar: false,
  logisticaAgenciasCupo: 0,
  tarifas: {},
}

const tips: Record<number, { tip: string; icon: 'onboard' | 'guide' | 'happy' }> = {
  1: { tip: 'Así te verán tus clientes cuando pidan. Un nombre claro y un logo ayudan a que confíen en ti.', icon: 'guide' },
  2: { tip: 'Activa solo los métodos que usas. Si más adelante agregas uno nuevo, puedes volver a configurarlo.', icon: 'guide' },
  3: { tip: 'Con esto Tori calcula automáticamente cuándo llegará cada pedido. ¡Tú solo preocúpate de vender!', icon: 'guide' },
  4: { tip: 'Pon el precio justo por distrito. Tus clientes verán el costo exacto sin tener que preguntarte.', icon: 'guide' },
}

export default function OnboardingWizard() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<ConfigState>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [slugEmpresa, setSlugEmpresa] = useState('')

  const firedConfetti = useRef(false)

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/register')
    }
  }
  useEffect(() => { checkAuth() }, [])

  useEffect(() => {
    if (step === 5 && !firedConfetti.current) {
      firedConfetti.current = true
      const duration = 2000
      const end = Date.now() + duration
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#0ea5e9', '#3b82f6', '#4f46e5'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#0ea5e9', '#3b82f6', '#4f46e5'],
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()

      // Obtener slug del negocio
      supabase.from('profiles').select('slug').eq('id', config.empresa ? undefined : undefined).then(({ data }) => {
        // Lo intentamos después del guardado
      })
    }
  }, [step])

  // Cargar slug al llegar al paso 5
  useEffect(() => {
    if (step === 5) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from('profiles').select('slug').eq('id', user.id).single().then(({ data }) => {
            if (data?.slug) setSlugEmpresa(data.slug)
          })
        }
      })
    }
  }, [step])

  function upd<K extends keyof ConfigState>(key: K, value: ConfigState[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSiguiente() {
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sesión expirada'); setSaving(false); return }

    let result: { error?: string; slug?: string } = {}
    if (step === 1) result = await guardarPasoEmpresa(supabase, user.id, config)
    else if (step === 2) result = await guardarPasoMetodos(supabase, user.id, config)
    else if (step === 3) result = await guardarPasoLogistica(supabase, user.id, config)
    else if (step === 4) result = await guardarPasoTarifas(supabase, user.id, config)

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    if ((result as any).slug) setSlugEmpresa((result as any).slug)

    setSaving(false)
    if (step < 4) {
      setStep((s) => s + 1)
    } else {
      setStep(5)
    }
  }

  function irAlDashboard() {
    localStorage.removeItem('tori_dashboard_tour_done')
    localStorage.removeItem('tori_card_tour_done')
    router.push('/dashboard')
  }

  function saltar() {
    localStorage.removeItem('tori_dashboard_tour_done')
    localStorage.removeItem('tori_card_tour_done')
    router.push('/dashboard')
  }

  async function copiarLink() {
    const link = `${window.location.origin}/f/${slugEmpresa}`
    await navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const totalSteps = 4
  const pasos = [
    { num: 1, label: 'Tu negocio' },
    { num: 2, label: 'Métodos' },
    { num: 3, label: 'Horarios' },
    { num: 4, label: 'Precios' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoTori size={28} />
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              Tori
            </span>
          </div>
          <button
            onClick={saltar}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Configurar después
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          {step <= 4 && (
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {pasos.map((p) => {
                const isActive = p.num === step
                const isDone = p.num < step
                return (
                  <div key={p.num} className="flex items-center gap-1 sm:gap-2">
                    <div
                      className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow'
                          : isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isDone ? <Check size={12} /> : <span>{p.num}</span>}
                      <span className="hidden sm:inline">{p.label}</span>
                    </div>
                    {p.num < 4 && (
                      <div className={`w-4 sm:w-8 h-0.5 ${p.num < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl">
          {step <= 4 && (
            <div className="grid lg:grid-cols-[1fr_2fr] gap-6 sm:gap-8 items-start">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:flex flex-col items-center gap-4 sticky top-28 pt-4"
              >
                <ToriMascot variant={tips[step].icon} size={120} animate />
                <p className="text-sm text-slate-500 text-center leading-relaxed max-w-[220px]">
                  {tips[step].tip}
                </p>
              </motion.div>

              <motion.div
                key={`form-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8"
              >
                {/* Tips en mobile */}
                <div className="lg:hidden flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl">
                  <ToriMascot variant={tips[step].icon} size={40} animate />
                  <p className="text-xs text-slate-500 leading-relaxed">{tips[step].tip}</p>
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 && <OnboardingStep1Empresa key="s1" config={config} upd={upd} />}
                  {step === 2 && <OnboardingStep2Metodos key="s2" config={config} upd={upd} />}
                  {step === 3 && <OnboardingStep3Logistica key="s3" config={config} upd={upd} />}
                  {step === 4 && <OnboardingStep4Tarifas key="s4" config={config} upd={upd} />}
                </AnimatePresence>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                    <X size={14} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:border-sky-500 hover:text-sky-700 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={16} />
                    Atrás
                  </button>

                  <button
                    onClick={handleSiguiente}
                    disabled={saving || (step === 1 && !config.empresa)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Guardando...' : step < 4 ? 'Siguiente' : 'Finalizar'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                  className="flex justify-center mb-6"
                >
                  <ToriMascot variant="happy" size={100} animate />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  ¡Todo listo{config.empresa ? `, ${config.empresa}` : ''}!
                </h2>
                <p className="mt-3 text-slate-500">
                  Tu negocio ya está configurado para recibir pedidos.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="bg-slate-50 rounded-xl px-5 py-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Métodos activados</span>
                    <span className="font-bold text-slate-900">
                      {[config.metodoMotorizado, config.metodoShalom, config.metodoOlva, config.metodoMarvisur, config.metodoFlores, config.metodoOtro, config.metodoRecojo].filter(Boolean).length}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-5 py-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Distritos con tarifa</span>
                    <span className="font-bold text-slate-900">
                      {Object.entries(config.tarifas).filter(([, v]) => v !== '').length}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl px-5 py-3 flex items-center justify-between text-sm">
                    <span className="text-sky-700">Plan</span>
                    <span className="font-bold text-sky-700">Pro · 30 días gratis</span>
                  </div>
                </div>

                {slugEmpresa && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl">
                    <p className="text-sm font-semibold text-sky-800 mb-2">Comparte tu formulario</p>
                    <p className="text-xs text-sky-600 mb-3">Envía este link a tus clientes para que reciban pedidos:</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`${window.location.origin}/f/${slugEmpresa}`}
                        className="flex-1 bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono truncate"
                      />
                      <button
                        onClick={copiarLink}
                        className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
                      >
                        {copiado ? <CheckCheck size={14} /> : <Copy size={14} />}
                        {copiado ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={irAlDashboard}
                  className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
                >
                  Ir a mi dashboard
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
