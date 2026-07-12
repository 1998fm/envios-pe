'use client'

import { useEffect, useState } from 'react'
import OnboardingTooltip from '@/components/OnboardingTooltip'

type Step = {
  target: string
  text: string
}

const DASHBOARD_STEPS: Step[] = [
  { target: '#dashboard-content', text: '¡Bienvenido soy Tori! Te guiaré por tu dashboard para que no te pierdas nada.' },
  { target: '#stats-portal', text: 'Aquí ves tu resumen: pedidos hoy, esta semana, ingresos. Todo en un vistazo.' },
  { target: '[data-tour="compartir"]', text: 'Este botón copia el link de tu formulario. Compártelo con tus clientes y los pedidos llegarán solos.' },
  { target: '[data-tour="filter-bar"]', text: 'Busca pedidos por nombre, DNI o teléfono. También filtra por estado o método de envío.' },
  { target: '[data-tour="exportar-shalom"]', text: 'Exporta tus pedidos empacados a Shalom con un clic. Se marcan como Enviado automáticamente.' },
  { target: '[data-tour="cambio-masivo"]', text: 'Cambia el estado de varios pedidos a la vez. Ej: pasar todos de Empacado a Enviado.' },
  { target: '[data-tour="generar-etiquetas"]', text: 'Imprime etiquetas con los datos del pedido para pegarlas en los paquetes.' },
  { target: '[data-tour="copiar-datos"]', text: 'Copia direcciones de pedidos Motorizado para enviarlas al repartidor.' },
  { target: '[data-tour="envio-list"]', text: 'Aquí aparecen todos tus pedidos, agrupados por fecha programada o registro.' },
  { target: '#dashboard-content', text: '¡Y eso es todo por ahora! Si necesitas ayuda, hazme clic —siempre estaré aquí.' },
]

const CARD_STEPS: Step[] = [
  { target: '[data-tour="envio-card"]', text: 'Cada pedido es una tarjeta. Toda la información del cliente está aquí.' },
  { target: '[data-tour="envio-card"] [data-tour="avatar"]', text: 'La inicial del cliente te ayuda a identificar los pedidos rápido.' },
  { target: '[data-tour="envio-card"] [data-tour="info"]', text: 'Nombre, DNI y teléfono visibles de un vistazo. No más buscar en chats.' },
  { target: '[data-tour="envio-card"] [data-tour="estado"]', text: 'Cambia el estado aquí: No Empacado → Empacado → Enviado. El color te guía.' },
  { target: '[data-tour="envio-card"] [data-tour="metodo"]', text: 'El método de envío que el cliente eligió: Motorizado, Shalom, etc.' },
  { target: '[data-tour="envio-card"] [data-tour="checkbox"]', text: 'Marca varios y usa acciones masivas. El borde de color indica el estado.' },
]

export default function DashboardOnboarding({ tieneEnvios }: { tieneEnvios: boolean }) {
  const [tourType, setTourType] = useState<'dashboard' | 'card' | null>(null)
  const [step, setStep] = useState(0)
  const [style, setStyle] = useState<React.CSSProperties | null>(null)

  // Iniciar dashboard tour
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

  // Iniciar card tour (tras dashboard tour, cuando hay pedidos)
  useEffect(() => {
    if (!tieneEnvios || tourType !== null) return
    const dashDone = localStorage.getItem('tori_dashboard_tour_done')
    const cardDone = localStorage.getItem('tori_card_tour_done')
    if (dashDone && !cardDone) {
      setTourType('card')
      setStep(0)
    }
  }, [tieneEnvios, tourType])

  // Posicionar tooltip cuando cambia step
  useEffect(() => {
    if (tourType === null) return

    const steps = tourType === 'dashboard' ? DASHBOARD_STEPS : CARD_STEPS
    const current = steps[step]
    if (!current) return

    // Limpiar highlight anterior
    document.querySelectorAll('.tour-highlight').forEach(el =>
      el.classList.remove('tour-highlight')
    )

    // Pequeño delay para asegurar DOM listo
    const timer = setTimeout(() => {
      // Encontrar target
      const target = document.querySelector(current.target) as HTMLElement | null
      if (!target) {
        // Si no encuentra el target, avanzar
        handleNext()
        return
      }

      // Highlight
      target.classList.add('tour-highlight')
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Posicionar tooltip
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
