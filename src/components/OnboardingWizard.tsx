'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
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
  1: { tip: 'Primero lo primero — tus datos. Así tus clientes te reconocerán cuando llenen el formulario.', icon: 'guide' },
  2: { tip: 'Activa los métodos de envío que usas. Si trabajas con varias agencias, enciéndelas todas.', icon: 'guide' },
  3: { tip: 'Define tus horarios para que Tori calcule automáticamente la fecha de entrega de cada pedido.', icon: 'guide' },
  4: { tip: 'Ponle precio a cada distrito donde entregues. Tus clientes verán el costo exacto sin preguntar.', icon: 'guide' },
}

export default function OnboardingWizard() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<ConfigState>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
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

    let result: { error?: string } = {}
    if (step === 1) result = await guardarPasoEmpresa(supabase, user.id, config)
    else if (step === 2) result = await guardarPasoMetodos(supabase, user.id, config)
    else if (step === 3) result = await guardarPasoLogistica(supabase, user.id, config)
    else if (step === 4) result = await guardarPasoTarifas(supabase, user.id, config)

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setSaving(false)
    if (step < 4) {
      setStep((s) => s + 1)
    } else {
      setStep(5)
    }
  }

  function saltar() {
    router.push('/dashboard')
  }

  function irAlDashboard() {
    router.push('/dashboard')
  }

  const totalSteps = 4
  const pasos = [
    { num: 1, label: 'Empresa' },
    { num: 2, label: 'Métodos' },
    { num: 3, label: 'Logística' },
    { num: 4, label: 'Tarifas' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoTori size={28} />
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              Tori
            </span>
          </div>
          <button
            onClick={saltar}
            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Configurar después
          </button>
        </div>
      </header>

      {/* PROGRESS */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
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
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isDone ? <Check size={12} /> : <span>{p.num}</span>}
                      <span className="hidden sm:inline">{p.label}</span>
                    </div>
                    {p.num < 4 && (
                      <div className={`w-4 sm:w-8 h-0.5 ${p.num < step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl">
          {step <= 4 && (
            <div className="grid lg:grid-cols-[1fr_2fr] gap-6 sm:gap-8 items-start">
              {/* Tori tip */}
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:flex flex-col items-center gap-4 sticky top-28 pt-4"
              >
                <ToriMascot variant={tips[step].icon} size={120} animate />
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed max-w-[220px]">
                  {tips[step].tip}
                </p>
              </motion.div>

              {/* Form */}
              <motion.div
                key={`form-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 sm:p-8"
              >
                <AnimatePresence mode="wait">
                  {step === 1 && <OnboardingStep1Empresa key="s1" config={config} upd={upd} />}
                  {step === 2 && <OnboardingStep2Metodos key="s2" config={config} upd={upd} />}
                  {step === 3 && <OnboardingStep3Logistica key="s3" config={config} upd={upd} />}
                  {step === 4 && <OnboardingStep4Tarifas key="s4" config={config} upd={upd} />}
                </AnimatePresence>

                {error && (
                  <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                    <X size={14} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-700 dark:hover:text-sky-300 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
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

          {/* STEP 5: ÉXITO */}
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-8 sm:p-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                  className="flex justify-center mb-6"
                >
                  <ToriMascot variant="happy" size={100} animate />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  ¡Todo listo{config.empresa ? `, ${config.empresa}` : ''}!
                </h2>
                <p className="mt-3 text-slate-500 dark:text-slate-400">
                  Tu negocio ya está configurado para recibir pedidos.
                </p>

                <div className="mt-8 space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl px-5 py-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Métodos activados</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {[config.metodoMotorizado, config.metodoShalom, config.metodoOlva, config.metodoMarvisur, config.metodoFlores, config.metodoOtro].filter(Boolean).length}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl px-5 py-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Distritos con tarifa</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {Object.entries(config.tarifas).filter(([, v]) => v !== '').length}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 rounded-xl px-5 py-3 flex items-center justify-between text-sm">
                    <span className="text-sky-700 dark:text-sky-300">Plan</span>
                    <span className="font-bold text-sky-700 dark:text-sky-300">Pro · 30 días gratis</span>
                  </div>
                </div>

                <button
                  onClick={irAlDashboard}
                  className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
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
