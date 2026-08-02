'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getTour, markTourDone, type TourId } from '@/lib/tours'
import OnboardingTooltip from '@/components/OnboardingTooltip'

type FinishMode = 'completado' | 'saltado'

type OnboardingContextValue = {
  startTour: (id: TourId, onFinish?: (mode: FinishMode) => void) => void
  stopTour: () => void
  isActive: (id: TourId) => boolean
  active: TourId | null
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<TourId | null>(null)
  const [step, setStep] = useState(0)
  const [style, setStyle] = useState<React.CSSProperties | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onFinishRef = useRef<((mode: FinishMode) => void) | null>(null)
  const finishModeRef = useRef<FinishMode>('completado')

  const startTour = useCallback((id: TourId, onFinish?: (mode: FinishMode) => void) => {
    onFinishRef.current = onFinish ?? null
    setActive((prev) => (prev === id ? prev : id))
    setStep(0)
  }, [])

  const stopTour = useCallback(() => {
    setActive(null)
    setStep(0)
    setStyle(null)
  }, [])

  const finishTour = useCallback((id: TourId) => {
    markTourDone(id)
    stopTour()
    const cb = onFinishRef.current
    onFinishRef.current = null
    cb?.(finishModeRef.current)
  }, [stopTour])

  useEffect(() => {
    if (!active) return
    const tour = getTour(active)
    if (!tour) {
      finishTour(active)
      return
    }

    const current = tour.steps[Math.min(step, tour.steps.length - 1)]
    if (!current) {
      finishTour(active)
      return
    }

    try {
      document.querySelectorAll('.tour-highlight').forEach((el) =>
        el.classList.remove('tour-highlight')
      )
    } catch {
      finishTour(active)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        const target = document.querySelector(current.target) as HTMLElement | null
        if (!target) {
          if (step === 0) {
            finishTour(active)
            return
          }
          setStep((s) => s + 1)
          return
        }

        target.classList.add('tour-highlight')
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })

        requestAnimationFrame(() => {
          try {
            const rect = target.getBoundingClientRect()
            const gap = 12
            const tw = 320
            const th = 200

            let top = rect.bottom + gap
            let left = Math.max(
              12,
              Math.min(rect.left + rect.width / 2 - tw / 2, window.innerWidth - tw - 12)
            )

            if (top + th > window.innerHeight) {
              top = Math.max(12, rect.top - gap - th)
            }

            setStyle({ top, left, position: 'fixed', zIndex: 50 })
          } catch {
            finishTour(active)
          }
        })
      } catch {
        finishTour(active)
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, step, stopTour, finishTour])

  useEffect(() => {
    return () => {
      document.querySelectorAll('.tour-highlight').forEach((el) =>
        el.classList.remove('tour-highlight')
      )
    }
  }, [])

  function handleNext() {
    if (!active) return
    const tour = getTour(active)
    if (!tour) return
    if (step >= tour.steps.length - 1) {
      finishModeRef.current = 'completado'
      finishTour(active)
      return
    }
    setStep((s) => s + 1)
  }

  function handleSkip() {
    if (!active) return
    finishModeRef.current = 'saltado'
    finishTour(active)
  }

  useEffect(() => {
    document.querySelectorAll('.tour-highlight').forEach((el) =>
      el.classList.remove('tour-highlight')
    )
    setStyle(null)
  }, [active])

   const tour = active ? getTour(active) : null
  const isActive = useCallback((id: TourId) => active === id, [active])
  const safeStep = tour ? Math.min(step, Math.max(tour.steps.length - 1, 0)) : 0

  return (
    <OnboardingContext.Provider value={{ startTour, stopTour, isActive, active }}>
      {children}
      {active && tour && (
        <>
          <style>{`
            .tour-highlight {
              animation: tour-pulse 1.5s ease-in-out infinite;
            }
            @keyframes tour-pulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.5); }
              50% { box-shadow: 0 0 0 10px rgba(56, 189, 248, 0.15); }
            }
          `}</style>
          {style && tour.steps[safeStep] && (
            <OnboardingTooltip
              titulo={tour.titulo}
              text={tour.steps[safeStep].text}
              step={safeStep + 1}
              totalSteps={tour.steps.length}
              onNext={handleNext}
              onSkip={handleSkip}
              style={style}
            />
          )}
        </>
      )}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding debe usarse dentro de OnboardingProvider')
  return ctx
}
