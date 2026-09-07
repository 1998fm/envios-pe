'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import { Info, X, CalendarClock, PackageCheck, ListChecks, Lightbulb } from 'lucide-react'

type AyudaBloque = {
  icon: ComponentType<{ size?: number; className?: string }>
  titulo: string
  queHace: string
  ejemplo: string
  dato: string
}

const bloques: AyudaBloque[] = [
  {
    icon: CalendarClock,
    titulo: '1. Mostrar "Escoger día de entrega"',
    queHace:
      'Deja que el cliente elija la fecha en la que recibirá su pedido de motorizado, entre las disponibles según tus días de entrega.',
    ejemplo:
      'El cliente no puede recibir el miércoles y elige el jueves. Si está oculta, se le asigna automáticamente el primer día disponible.',
    dato: 'Solo aplica al método Motorizado y en plan Pro+. En Básico no se muestran fechas.',
  },
  {
    icon: PackageCheck,
    titulo: '2. Solicitar cantidad de productos',
    queHace:
      'Pregunta cuántas prendas, cajas o paquetes incluye el pedido. El dato queda registrado junto con tu pedido.',
    ejemplo: 'El cliente escribe "Cantidad: 3" y aparece en el detalle del pedido al despacharlo.',
    dato: 'Actívalo si despachas por bultos y necesitas saber cuántos; desactívalo si no te sirve el dato.',
  },
]

export default function AyudaLogisticaOpciones({ className = '' }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="¿Cómo funcionan las opciones del formulario?"
        aria-label="Ayuda de opciones del formulario"
        className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sm active:scale-95 transition-all ${className}`}
      >
        <Info size={14} />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Opciones del formulario</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Opciones que cambian lo que el cliente ve en su formulario de pedido.
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
                    <b.icon size={17} className="shrink-0 text-slate-700" />
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

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <ListChecks size={17} className="shrink-0 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">Resumen práctico</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Ambas opciones son independientes. Combínalas según cómo trabajas: si entregas solo
                  ciertos días, activa el día de entrega; si preparas por cantidad, usa la cantidad de
                  productos.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setAbierto(false)}
                className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-slate-500/20"
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