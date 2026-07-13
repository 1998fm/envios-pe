import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tori.pe"

export const metadata: Metadata = {
  title: {
    default: 'Tori — Organiza tus envíos desde un solo lugar',
    template: '%s | Tori',
  },
  description:
    'Tori convierte los mensajes de WhatsApp de tus clientes en pedidos ordenados. Dashboard, formulario público y control logístico para negocios peruanos.',
  keywords: [
    'gestión de envíos',
    'organizar pedidos WhatsApp',
    'sistema de envíos Perú',
    'logística para emprendedores',
    'dashboard de pedidos',
    'formulario de pedidos online',
    'control de entregas',
    'Tori',
    'envios.pe',
  ],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Tori — Organiza tus envíos desde un solo lugar',
    description:
      'Tus clientes llenan un formulario y todo aparece ordenado en tu dashboard. Sin chats perdidos, sin hojas sueltas.',
    url: siteUrl,
    siteName: 'Tori',
    locale: 'es_PE',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Tori — tu ayudante fiel para gestionar envíos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tori — Organiza tus envíos desde un solo lugar',
    description:
      'Tus clientes llenan un formulario y todo aparece ordenado en tu dashboard. Sin chats perdidos.',
    images: [`${siteUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Tori',
  url: siteUrl,
  operatingSystem: 'Web',
  applicationCategory: 'BusinessApplication',
  description:
    'Sistema que convierte los datos que tus clientes te envían por WhatsApp en pedidos organizados automáticamente.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Básico',
      price: '0',
      priceCurrency: 'PEN',
      description: 'Después del trial de 30 días Pro gratis',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '29.90',
      priceCurrency: 'PEN',
      priceUnit: '/mes',
      description: 'Pedidos ilimitados, todos los métodos, Dashboard completo',
    },
  ],
  author: {
    '@type': 'Organization',
    name: 'Tori',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50">

        <GoogleAnalytics />

        {children}

        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={3000}
        />

      </body>
    </html>
  );
}
