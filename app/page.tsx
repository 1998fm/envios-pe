import LandingPage from '@/components/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tori — Organiza los pedidos de tu emprendimiento',
  description:
    'Tus clientes piden desde un formulario con tu logo y tú ves todos los pedidos en un solo lugar: qué falta despachar, qué cobrar y qué comprar. Empieza gratis, sin tarjeta.',
}

export default function Home() {
  return <LandingPage />
}
