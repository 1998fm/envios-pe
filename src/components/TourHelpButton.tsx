'use client'

import { Info } from 'lucide-react'
import { useOnboarding } from '@/context/OnboardingContext'
import type { TourId } from '@/lib/tours'

type Props = {
  tourId: TourId
  className?: string
  label?: string
}

export default function TourHelpButton({ tourId, className = '', label = 'Ver guía' }: Props) {
  const { startTour } = useOnboarding()

  return (
    <button
      type="button"
      onClick={() => startTour(tourId)}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sm active:scale-95 transition-all ${className}`}
    >
      <Info size={14} />
    </button>
  )
}
