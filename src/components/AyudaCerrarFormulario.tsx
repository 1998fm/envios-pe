'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import {
  Info,
  X,
  Power,
  Clock,
  CalendarX,
  MessageSquare,
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
    icon: Power,
    titulo: '1. ¿Qué hace este botón?',
    queHace:
      'Apaga el formulario de tu link. Tus clientes ya no pueden hacer pedidos y solo ven el mensaje que les escribas.',
    ejemplo:
      'Lo activas, marcas una condición de cierre y un cliente que entre a tu link verá tu mensaje en vez del formulario.',
    dato: 'Active el botón SOLO no cierra nada: necesita que se cumpla una condición de cierre (hora de corte o días de la semana).',
  },
  {
    icon: Clock,
    titulo: '2. Cierre por hora de corte',
    queHace:
      'Si en la sección LOGÍSTICA activaste una hora de corte en Motorizado o en Agencias, el formulario se cierra automáticamente al pasar esa hora y vuelve a abrir al día siguiente. Funciona todos los días, incluso fines de semana.',
    ejemplo:
      'Corte de Motorizado a las 5pm. Un cliente que entra a las 6pm ve "cerrado"; otro que entra a las 9am del día siguiente ya puede pedir.',
    dato: 'Si quitas la hora de corte en logística, este cierre por hora también desaparece (necesitas tener al menos una activa: Motorizado o Agencias).',
  },
  {
    icon: CalendarX,
    titulo: '3. Cerrar días específicos',
    queHace:
      'Marcas días exactos de la semana: esos días el formulario queda cerrado TODO el día y se repite cada semana.',
    ejemplo:
      'Marcas "Domingo" → cada domingo está cerrado y el lunes abre. Marcas "Lunes" y "Martes" → esos dos días cerrados todas las semanas.',
    dato: 'Se usa junto con la hora de corte: alcanza con que se cumpla UNA de las condiciones para que el formulario esté cerrado.',
  },
  {
    icon: MessageSquare,
    titulo: '4. Mensaje para tus clientes',
    queHace:
      'Es lo único que verán tus clientes mientras el formulario esté cerrado. Puedes avisar cuándo vuelves.',
    ejemplo: '"Estamos en mantenimiento, regresamos el lunes. ¡Gracias por tu paciencia!" escribe la fecha para que no se queden sin info.',
    dato: 'El mensaje se muestra solamente cuando el formulario está cerrado; si las condiciones no se cumplen, se ve el formulario normal.',
  },
]

const combinados = [
  {
    titulo: 'Caso A: solo el botón',
    texto:
      'Activas "Deshabilitar el formulario" pero NO marcaste hora de corte ni días → el formulario sigue abierto como siempre. El botón por sí solo no cierra.',
  },
  {
    titulo: 'Caso B: solo hora de corte',
    texto:
      'Corte en Motorizado a las 5pm → cada día a las 5pm el formulario se cierra y abre de nuevo al día siguiente llevando 00:00 (aunque sea fin de semana). Sábado 10am está abierto, sábado 6pm cerrado.',
  },
  {
    titulo: 'Caso C: solo días específicos',
    texto:
      'Marcas "Domingo" → el domingo entero está cerrado (todo el día), aunque ese día no pase ninguna hora de corte. El lunes abre normal.',
  },
  {
    titulo: 'Caso D: días + hora de corte juntos',
    texto:
      'Domingos marcados + corte a las 5pm → el formulario está cerrado cada domingo todo el día y además de lunes a sábado desde las 5pm. Basta que se cumpla UNA condición: día marcado O ya pasó la hora.',
  },
]

export default function AyudaCerrarFormulario({ className = '' }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="¿Cómo funciona deshabilitar el formulario?"
        aria-label="Ayuda de deshabilitar el formulario"
        className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 hover:shadow-sm active:scale-95 transition-all ${className}`}
      >
        <Info size={14} />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Deshabilitar el formulario</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Cierra tu link a los pedidos por hora de corte, por días de la semana o por ambos.
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
                    <b.icon size={17} className="shrink-0 text-rose-600" />
                    <h3 className="text-sm font-bold text-slate-900">{b.titulo}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{b.queHace}</p>
                  <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Ejemplo: </span>
                    {b.ejemplo}
                  </div>
                  <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
                    <Lightbulb size={13} className="mt-0.5 shrink-0" />
                    <span>{b.dato}</span>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center gap-2">
                  <ListChecks size={17} className="shrink-0 text-indigo-600" />
                  <h3 className="text-sm font-bold text-indigo-900">¿Qué pasa si los combino?</h3>
                </div>
                <div className="mt-3 space-y-2.5">
                  {combinados.map((c) => (
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
                className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/20"
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