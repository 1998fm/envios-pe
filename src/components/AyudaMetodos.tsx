'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import {
  Info,
  X,
  Bike,
  Building2,
  Package,
  Ship,
  Flower2,
  Plus,
  Store,
  ListChecks,
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
    icon: Bike,
    titulo: '1. Motorizado',
    queHace:
      'Reparto local en moto dentro de tu ciudad. El cliente elige "Motorizado" y su distrito.',
    ejemplo:
      'El cliente pide y selecciona su distrito; tú recargas la moto y lo entregas.',
    dato: 'Para que funcione necesitas marcar días de entrega en Logística y, en Pro/Business Plus, tarifas por distrito.',
  },
  {
    icon: Building2,
    titulo: '2. Shalom',
    queHace:
      'Envíos nacionales por la agencia Shalom. El cliente elige la agencia de destino a la que llega su paquete.',
    ejemplo:
      'El cliente en Chiclayo elige "Chiclayo" y tú despachas desde tu agencia de origen.',
    dato: 'Necesitas tener definida tu agencia de origen en la sección Empresa.',
  },
  {
    icon: Package,
    titulo: '3. Olva',
    queHace:
      'Envíos nacionales por la agencia Olva. El cliente indica la ciudad destino.',
    ejemplo: 'El cliente en Trujillo selecciona Olva y su distrito de destino.',
    dato: 'Igual que Shalom, pero usando el sistema de Olva para despachar.',
  },
  {
    icon: Ship,
    titulo: '4. Marvisur y Flores',
    queHace:
      'Otras agencias nacionales de transporte. Funcionan igual: el cliente elige destino.',
    ejemplo: 'Marvisur para la costa sur, Flores para despachos de flores por agencia.',
    dato: 'Puedes tener varias agencias activas a la vez.',
  },
  {
    icon: Plus,
    titulo: '5. Otro método',
    queHace:
      'Cualquier otra agencia o empresa de delivery que uses y no esté en la lista. Te pide escribir su nombre.',
    ejemplo: 'Activas "Otro método" y escribes "Cruz del Sur" → así se llama para tu cliente.',
    dato: 'Es ideal para agencias locales o regionales específicas.',
  },
  {
    icon: Store,
    titulo: '6. Recojo en tienda',
    queHace:
      'El cliente no recibe envío: pasa a recoger su pedido por tu local. Puedes mostrarle un mensaje.',
    ejemplo: '"Recoge tu pedido en nuestra tienda. Te esperamos."',
    dato: 'Perfecto para ventas por catálogo o clientes de tu zona.',
  },
]

const limitaciones = [
  {
    titulo: 'Plan Básico (gratis)',
    texto:
      'Puedes tener hasta un máximo de métodos activos (según tu plan). Prioriza los que más usas, porque al llegar al tope no podrás activar más sin quitar alguno.',
  },
  {
    titulo: 'Pro y Business Plus',
    texto:
      'No tienen límite de métodos: activas todos los que ofrezcas.',
  },
  {
    titulo: '¿Cómo se comportan entre sí?',
    texto:
      'Cada método es independiente y tiene sus propias reglas (días, hora de corte, tarifas). Un pedido de Shalom no usa las reglas de Motorizado, y al revés.',
  },
]

export default function AyudaMetodos({ className = '' }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="¿Cómo funcionan los métodos de envío?"
        aria-label="Ayuda de la sección Métodos"
        className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sm active:scale-95 transition-all ${className}`}
      >
        <Info size={14} />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Guía de los métodos de envío</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Los métodos que actives son los que tu cliente podrá elegir al hacer su pedido.
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
                    <b.icon size={17} className="shrink-0 text-amber-600" />
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

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center gap-2">
                  <ListChecks size={17} className="shrink-0 text-indigo-600" />
                  <h3 className="text-sm font-bold text-indigo-900">Límites y comportamiento</h3>
                </div>
                <div className="mt-3 space-y-2.5">
                  {limitaciones.map((c) => (
                    <div key={c.titulo} className="rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700">
                      <span className="font-semibold text-indigo-800">{c.titulo}: </span>
                      {c.texto}
                    </div>
                  ))}
                </div>
              </div>
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