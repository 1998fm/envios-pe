import LandingPage from '@/components/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vende por WhatsApp. Recibe tus pedidos en orden.',
  description:
    'Comparte tu formulario y recibe tus pedidos organizados en un solo panel. Prueba Plus por 14 días sin tarjeta y después continúa en Básico gratis.',
}

export default function Home() {
  return <LandingPage />
}
