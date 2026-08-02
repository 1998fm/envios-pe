import LandingPage from '@/components/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Deja de perder pedidos en WhatsApp — Tori',
  description:
    'Tus clientes piden desde un formulario con tu logo y cada pedido llega ordenado: qué despachar, qué cobrar y qué comprar. Sin chats revueltos ni Excel. 30 días Pro gratis, sin tarjeta.',
}

export default function Home() {
  return <LandingPage />
}
