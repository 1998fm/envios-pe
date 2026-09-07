'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import {
  Info,
  X,
  DollarSign,
  MapPin,
  ListChecks,
  Plus,
  Sparkles,
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
    icon: DollarSign,
    titulo: '1. ¿Qué es la tarifa por distrito?',
    queHace:
      'Es el monto que le cobras a tu cliente por el reparto motorizado según el distrito de destino. El cliente ve el total en vivo al elegir su distrito.',
    ejemplo:
      'Cobras S/ 8 en Miraflores → el cliente elige Miraflores y ve "Envío: S/ 8.00" antes de confirmar.',
    dato: 'Solo aplica en plan Pro/Business Plus. En Básico, Motorizado no muestra precio por distrito.',
  },
  {
    icon: MapPin,
    titulo: '2. Lima: lista oficial',
    queHace:
      'Usamos la lista oficial de distritos de Lima Metropolitana. Tú asignas un precio a cada distrito donde repartes.',
    ejemplo: 'Miraflores S/ 8, Barranco S/ 8, San Isidro S/ 8, surco S/ 10, ...',
    dato: 'Los distritos que dejes sin precio no muestran monto automático en el formulario.',
  },
  {
    icon: Sparkles,
    titulo: '3. Precio único para todos (Lima)',
    queHace:
      'Si cobras lo mismo en toda Lima, escribe una sola cifra y presiona "Aplicar a todos": se llena cada distrito con ese monto.',
    ejemplo: 'Tarifa única de S/ 10 → todos los distritos de Lima quedan en S/ 10.',
    dato: 'Después puedes corregir distritos puntuales que quieras cobrar distinto.',
  },
  {
    icon: Plus,
    titulo: '4. Provincia: agregas tus distritos',
    queHace:
      'Cuando repartes en provincia, escribes manualmente cada distrito y su precio. En tu formulario solo aparecerán esos distritos.',
    ejemplo: 'Agregas "Cajamarca" S/ 15 y "El Porvenir" S/ 20 → tu cliente solo puede elegir motorizado hacia esas zonas.',
    dato: 'Si no agregas un solo distrito, Motorizado no aparecerá para tus clientes (no hay destinos configurados).',
  },
]

const pasoTarifa = [
  'Tienes una mueblería en Lima y cobras S/ 12 de reparto en cualquier distrito.',
  'En Tarifas eliges "Lima" y en "Precio único para todos" escribes 12 y presionas "Aplicar a todos".',
  'Pero en Miraflores quieres cobrar S/ 10 a tus vecinos: buscas Miraflores y le pones 10.',
  'Resultado: el cliente de Comas ve S/ 12 y el de Miraflores ve S/ 10 al elegir su distrito.',
]

export default function AyudaTarifas({ className = '' }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="¿Cómo configuro mis tarifas?"
        aria-label="Ayuda de la sección Tarifas"
        className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sm active:scale-95 transition-all ${className}`}
      >
        <Info size={14} />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Guía de tarifas de Motorizado</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Define cuánto cobras por el reparto en cada distrito. El cliente lo ve al instante.
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
                    <b.icon size={17} className="shrink-0 text-emerald-600" />
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

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <ListChecks size={17} className="shrink-0 text-emerald-600" />
                  <h3 className="text-sm font-bold text-emerald-900">Caso completo, paso a paso</h3>
                </div>
                <ol className="mt-3 space-y-2.5">
                  {pasoTarifa.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Para que las tarifas funcionen, el cliente necesita un método Motorizado con días de
                entrega configurados en Logística.
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-end border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setAbierto(false)}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20"
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