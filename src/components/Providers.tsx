'use client'

import { PlanesProvider } from '@/context/PlanesContext'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { OnboardingProvider } from '@/context/OnboardingContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <PlanesProvider><OnboardingProvider>{children}</OnboardingProvider></PlanesProvider>
    </ConfirmProvider>
  )
}
