import LandingPage from '@/components/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vender por WhatsApp debería darte más ventas, no más desorden — Tori',
  description:
    'Tori es el compañero de negocio de los emprendedores que venden por WhatsApp. Organiza tus pedidos, ventas, inventario y envíos para perder menos tiempo ordenando y tener más tiempo para vender. 30 días gratis, sin tarjeta.',
}

export default function Home() {
  return <LandingPage />
}
