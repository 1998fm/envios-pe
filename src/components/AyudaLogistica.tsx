'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import {
  Info,
  X,
  CalendarDays,
  Clock,
  CalendarClock,
  Layers,
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
    icon: CalendarDays,
    titulo: '1. ¿Qué días atiendes?',
    queHace:
      'Marcas los días de la semana en los que haces entregas. Tori programa cada pedido SOLO en esos días; los que no marcas se saltan.',
    ejemplo:
      'Si atiendes Lunes a Viernes y el pedido llegó el sábado, se programa para el LUNES siguiente (el sábado y domingo se saltan).',
    dato: 'Si no marcas ningún día, Motorizado deja de aparecer en el formulario de tus clientes.',
  },
  {
    icon: Clock,
    titulo: '2. Hora de corte',
    queHace:
      'Define la hora límite del día. Si el cliente pide DESPUÉS de esa hora, su pedido se programa un día más tarde.',
    ejemplo:
      'Corte a las 5:00pm. Pedido a las 3pm → se entrega mañana. Pedido a las 7pm → se entrega pasado mañana.',
    dato: 'No importa cuántos días atiendas a la semana: pasar la hora de corte siempre agrega 1 día.',
  },
  {
    icon: CalendarClock,
    titulo: '3. Días de anticipación mínima',
    queHace:
      'Cuántos días antes deben pedir tus clientes. Es el tiempo mínimo que necesitas para preparar el pedido.',
    ejemplo:
      'Con anticipación 1, el pedido de hoy mínimo se entrega mañana. Con anticipación 2, mínimo se entrega en 2 días.',
    dato: 'La hora de corte actúa como una anticipación extra: si el pedido llega después, se suma 1 día a TU anticipación.',
  },
  {
    icon: Layers,
    titulo: '4. Limitar envíos por día (cupo)',
    queHace:
      'Un máximo de pedidos por día. Si el día se llena, los siguientes se mueven al próximo día en que atiendes.',
    ejemplo:
      'Cupo de 5 y el jueves ya tiene 5 pedidos → el pedido 6 se programa para el viernes (o al siguiente día que atiendas con espacio).',
    dato: 'Cupo en 0 significa SIN límite: acepta todos los pedidos que quieras cada día.',
  },
]

const combinados = [
  {
    titulo: 'Caso A: días + hora de corte',
    texto:
      'Lunes a Sábado, corte 5pm. Pedido del lunes a las 3pm → martes (antes del corte, +1 día). Pedido del lunes a las 7pm → miércoles (pasó el corte, +2 días).',
  },
  {
    titulo: 'Caso B: fin de semana + hora de corte',
    texto:
      'Lunes a Viernes, corte 5pm. Pedido del viernes a las 6pm: pasó el corte Y el sábado/domingo no se atiende → se entrega el LUNES siguiente.',
  },
  {
    titulo: 'Caso C: cupo lleno',
    texto:
      'Lunes a Sábado, cupo 10. El jueves ya llegó a 10 pedidos → el pedido 11 va al viernes. Si el viernes también se llena, el siguiente va al sábado.',
  },
  {
    titulo: 'Caso D: todo a la vez',
    texto:
      'Lun-Sáb, corte 5pm, anticipación 2, cupo 5. Pedido del lunes a las 4pm → base +2 días = miércoles; si no llegó a 5, se programa el miércoles. Pedido del lunes a las 6pm → base +3 días = jueves; si el jueves está lleno, salta al viernes.',
  },
]

export default function AyudaLogistica({ className = '' }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="¿Cómo funciona la logística?"
        aria-label="Ayuda de la sección logística"
        className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sm active:scale-95 transition-all ${className}`}
      >
        <Info size={14} />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Cómo funciona la logística</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Aquí decides en qué días y a qué hora puedes entregar. Tori calcula solo la fecha de cada pedido.
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

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center gap-2">
                  <ListChecks size={17} className="shrink-0 text-indigo-600" />
                  <h3 className="text-sm font-bold text-indigo-900">Filtros combinados: ¿qué pasa con todo junto?</h3>
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

              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Esto se configura por método: Motorizado y Agencias tienen sus propios días, hora de corte, anticipación
                y cupo. Un pedido de Shalom no se ve afectado por las reglas de Motorizado, y al revés.
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