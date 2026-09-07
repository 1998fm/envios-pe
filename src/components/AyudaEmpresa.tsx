'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import {
  Info,
  X,
  Building,
  Phone,
  MapPin,
  Building2,
  Image,
  MessageCircle,
  Link2,
  Globe,
  Lightbulb,
} from 'lucide-react'

type AyudaBloque = {
  icon: ComponentType<{ size?: number; className?: string }>
  titulo: string
  queHace: string
  ejemplo: string
  dato: string
}

const bloques: AyudaBloque[] = [
  {
    icon: Building,
    titulo: '1. Nombre del negocio',
    queHace:
      'Es el nombre de tu marca. Aparece en la cabecera del formulario que ven tus clientes y en tus pedidos.',
    ejemplo: 'Escribes "Moda Chic Perú" y así lo verá tu cliente al hacer el pedido.',
    dato: 'Si lo dejas vacío, la página muestra tu enlace público (slug) en su lugar.',
  },
  {
    icon: Phone,
    titulo: '2. Teléfono',
    queHace:
      'Tu línea de contacto. Se muestra en el formulario para que el cliente pueda ubicarte.',
    ejemplo: '"987 654 321" aparece como dato de contacto junto al formulario.',
    dato: 'Ponlo en formato peruano: 9xx xxx xxx.',
  },
  {
    icon: MapPin,
    titulo: '3. Dirección (opcional)',
    queHace:
      'La ubicación de tu local. Sirve de referencia cuando el cliente elige "Recojo en tienda".',
    ejemplo: '"Av. Larco 123, Miraflores" se muestra como referencia de recojo.',
    dato: 'Es opcional: si no escribes nada, simplemente se omite.',
  },
  {
    icon: Building2,
    titulo: '4. Agencia de origen (Shalom)',
    queHace:
      'El punto desde donde salen tus envíos nacionales. Cada pedido que llega por Shalom sale de esta agencia.',
    ejemplo:
      'Tienes tienda en San Juan de Lurigancho → buscas "San Juan de Lurigancho" y la eliges de la lista.',
    dato: 'Debe elegirse de la lista oficial de agencias: si solo la escribes, no se guarda y aparece un error.',
  },
  {
    icon: Image,
    titulo: '5. Logo del negocio (Pro+)',
    queHace:
      'Tu logotipo en la cabecera del formulario que ven tus clientes. Le da presencia a tu marca.',
    ejemplo: 'Subes tu logo en PNG/JPG y Tori lo comprime solo a WebP para que cargue rápido.',
    dato: 'Disponible en Pro y Business Plus.',
  },
  {
    icon: MessageCircle,
    titulo: '6. Mensaje de éxito',
    queHace:
      'El texto e imagen que verá el cliente justo después de hacer su pedido, antes de la redirección.',
    ejemplo: '"¡Gracias por tu compra! Te contactaremos para coordinar la entrega."',
    dato: 'Puedes acompañarlo de una imagen (logo o portada) para hacerlo más atractivo.',
  },
  {
    icon: Link2,
    titulo: '7. URL de redirección (Pro+)',
    queHace:
      'La página a la que envías al cliente unos segundos después de confirmar su pedido.',
    ejemplo: '"https://mipagina.com/gracias" → el cliente llega ahí tras hacer el pedido.',
    dato: 'Si lo dejas vacío, solo se muestra el mensaje de éxito sin redirección.',
  },
  {
    icon: Globe,
    titulo: '8. Redes sociales (Business Plus)',
    queHace:
      'Iconos clicables en el formulario: Instagram, Facebook, TikTok, página web y WhatsApp.',
    ejemplo: 'Pones "https://instagram.com/moda.chic" y aparece el icono de Instagram en el formulario.',
    dato: 'Solo disponible en el plan Business Plus.',
  },
]

export default function AyudaEmpresa({ className = '' }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="¿Cómo completo mis datos?"
        aria-label="Ayuda de la sección Empresa"
        className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sm active:scale-95 transition-all ${className}`}
      >
        <Info size={14} />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Guía de la sección Empresa</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Todo lo que pongas aquí se muestra en el formulario que ven tus clientes.
                </p>
              </div>
              <button
                onClick={() => setAbierto(false)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {bloques.map((b) => (
                <div key={b.titulo} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <b.icon size={17} className="shrink-0 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-900">{b.titulo}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{b.queHace}</p>
                  <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Ejemplo: </span>
                    {b.ejemplo}
                  </div>
                  <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">
                    <Lightbulb size={13} className="mt-0.5 shrink-0" />
                    <span>{b.dato}</span>
                  </div>
                </div>
              ))}

              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Algunos campos dependen de tu plan: Logo y URL de redirección son de Pro, y las Redes
                sociales de Business Plus. Si no los ves, revisa tu plan en la barra superior.
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-end border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setAbierto(false)}
                className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}