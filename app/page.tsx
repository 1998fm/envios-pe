import LandingPage from '@/components/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tori — Envíos, stock y ventas en un solo lugar',
  description:
    'Tori reúne tus pedidos, inventario, ventas y compras en un dashboard simple. Tus clientes piden por tu formulario con tu marca y todo llega ordenado para que solo despaches. 30 días Pro gratis, sin tarjeta.',
}

export default function Home() {
  return <LandingPage />
}
