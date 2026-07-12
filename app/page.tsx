import LandingPage from '@/components/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tori — Tu ayudante fiel para gestionar envíos',
  description:
    'Tori organiza tus envíos en un solo lugar. Crea tu formulario de pedidos, recibe solicitudes de clientes y gestiona todo desde un dashboard moderno. El mejor amigo de tu negocio.',
}

export default function Home() {
  return <LandingPage />
}
