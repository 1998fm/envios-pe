'use client'

import { useEffect, useState } from 'react'
import OnboardingTooltip from '@/components/OnboardingTooltip'

type Step = {
  target: string
  text: string
}

const DASHBOARD_STEPS: Step[] = [
  { target: '#dashboard-content', text: '¡Hola! Soy Tori. Bienvenido a tu dashboard. Aquí gestionas todos tus envíos y pedidos. Te daré un paseo rápido.' },
  { target: '[data-tour="topbar"]', text: 'Esta es la barra principal. Aquí ves el nombre de tu negocio y compartes tu formulario con clientes para que lleguen pedidos solos.' },
  { target: '[data-tour="filter-bar"]', text: 'Busca pedidos por nombre o DNI, y filtra por estado o método de envío. Así encuentras lo que necesitas al instante.' },
  { target: '[data-tour="actions"]', text: 'Acciones rápidas: exporta a Shalom, cambia estados masivamente, imprime etiquetas o copia direcciones para repartidores.' },
  { target: '[data-tour="envio-list"]', text: 'Todos tus pedidos aparecen aquí, agrupados por fecha. Cada tarjeta muestra nombre, DNI, estado y método. Puedes cambiar el estado con un clic.' },
  { target: '#dashboard-content', text: '¡Eso es todo! Si necesitas ayuda, haz clic en el botón de ayuda (?) abajo a la derecha para verme de nuevo. ¡A vender!' },
]

const CARD_STEPS: Step[] = [
  { target: '[data-tour="envio-card"]', text: 'Cada pedido es una tarjeta con toda la info del cliente.' },
  { target: '[data-tour="envio-card"] [data-tour="estado"]', text: 'Cambia el estado aquí: No Empacado → Empacado → Enviado. El color te guía.' },
  { target: '[data-tour="envio-card"] [data-tour="checkbox"]', text: 'Marca varios pedidos y usa acciones masivas arriba.' },
]

export default function DashboardOnboarding({ tieneEnvios }: { tieneEnvios: boolean }) {
  const [tourType, setTourType] = useState<'dashboard' | 'card' | null>(null)
  const [step, setStep] = useState(0)
  const [style, setStyle] = useState<React.CSSProperties | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('tour') === 'start') {
      localStorage.removeItem('tori_dashboard_tour_done')
      localStorage.removeItem('tori_card_tour_done')
      window.history.replaceState({}, '', window.location.pathname)
      setTourType('dashboard')
      setStep(0)
      return
    }

    if (!localStorage.getItem('tori_dashboard_tour_done')) {
      setTourType('dashboard')
      setStep(0)
    }
  }, [])

  useEffect(() => {
    if (!tieneEnvios || tourType !== null) return
    const dashDone = localStorage.getItem('tori_dashboard_tour_done')
    const cardDone = localStorage.getItem('tori_card_tour_done')
    if (dashDone && !cardDone) {
      setTourType('card')
      setStep(0)
    }
  }, [tieneEnvios, tourType])

  useEffect(() => {
    if (tourType === null) return

    const steps = tourType === 'dashboard' ? DASHBOARD_STEPS : CARD_STEPS
    const current = steps[step]
    if (!current) return

    document.querySelectorAll('.tour-highlight').forEach(el =>
      el.classList.remove('tour-highlight')
    )

    const timer = setTimeout(() => {
      const target = document.querySelector(current.target) as HTMLElement | null
      if (!target) {
        setStyle({ top: window.innerHeight - 220, left: 12, position: 'fixed', zIndex: 50 })
        return
      }

      target.classList.add('tour-highlight')
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })

      requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect()
        const gap = 12
        const tw = 320
        const th = 200

        let top = rect.bottom + gap
        let left = Math.max(12, Math.min(rect.left + rect.width / 2 - tw / 2, window.innerWidth - tw - 12))

        if (top + th > window.innerHeight) {
          top = Math.max(12, rect.top - gap - th)
        }

        setStyle({ top, left, position: 'fixed', zIndex: 50 })
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [tourType, step])

  function handleNext() {
    const steps = tourType === 'dashboard' ? DASHBOARD_STEPS : CARD_STEPS
    if (step >= steps.length - 1) {
      handleSkip()
      return
    }
    setStep(s => s + 1)
  }

  function handleSkip() {
    document.querySelectorAll('.tour-highlight').forEach(el =>
      el.classList.remove('tour-highlight')
    )
    const key = tourType === 'dashboard' ? 'tori_dashboard_tour_done' : 'tori_card_tour_done'
    localStorage.setItem(key, 'true')
    setTourType(null)
    setStyle(null)
  }

  if (tourType === null) return null

  const steps = tourType === 'dashboard' ? DASHBOARD_STEPS : CARD_STEPS

  return (
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
      {style && (
        <OnboardingTooltip
          text={steps[step].text}
          step={step + 1}
          totalSteps={steps.length}
          onNext={handleNext}
          onSkip={handleSkip}
          style={style}
        />
      )}
    </>
  )
}
