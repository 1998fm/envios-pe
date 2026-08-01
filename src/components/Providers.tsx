'use client'

import { ConfirmProvider } from '@/components/ConfirmDialog'
import { OnboardingProvider } from '@/context/OnboardingContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <OnboardingProvider>{children}</OnboardingProvider>
    </ConfirmProvider>
  )
}
