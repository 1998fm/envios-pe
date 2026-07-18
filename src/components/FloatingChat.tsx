'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, MessageCircle, ArrowLeft, HelpCircle } from 'lucide-react'
import ToriMascot from '@/components/ToriMascot'

type FAQ = {
  q: string
  a: string
}

const FAQS: FAQ[] = [
  {
    q: '¿Cómo comparto mi formulario con clientes?',
    a: 'Tienes un formulario público donde tus clientes llenan sus datos y ven el costo exacto según su distrito. Puedes personalizar el mensaje que ven después de pedir y redirigirlos a una URL de agradecimiento (en Configuración > Empresa). El link está en la barra superior del dashboard, se copia con un clic y puedes compartirlo por WhatsApp, redes o como código QR. Tus clientes no necesitan instalar nada.',
  },
  {
    q: '¿Qué plan tengo y cómo cambio?',
    a: 'Tu plan se muestra en la barra superior. Si estás en Pro Trial, cuando se cumplan los 30 días pasas automáticamente a Básico (gratis, 50 envíos/mes, 2 métodos). Al actualizar a Pro (S/29.90/mes) se desbloquea: métodos ilimitados, tarifas por distrito, cambio masivo, tu marca en el formulario, redes sociales, control de logística y más. El pago es vía MercadoPago y se activa al instante.',
  },
  {
    q: '¿Mis clientes necesitan una cuenta?',
    a: 'Para nada. Tus clientes solo abren el link de tu formulario, llenan sus datos, eligen el método de envío y listo. El pedido llega automáticamente a tu dashboard. Sin registros, sin contraseñas, sin complicaciones.',
  },
  {
    q: '¿Cómo cambio el estado de un pedido?',
    a: 'Cada pedido tiene un menú desplegable en su tarjeta con tres opciones: No Empacado (borde rojo), Empacado (borde ámbar) y Enviado (borde verde). Solo selecciona el estado y se actualiza al instante. También puedes seleccionar varios y usar el Cambio Masivo (solo Pro).',
  },
  {
    q: '¿Para qué sirve "Generar etiquetas"?',
    a: 'Imprime etiquetas con los datos de cada pedido —nombre del cliente, dirección, método de envío y fecha— para pegarlas en los paquetes. Puedes elegir entre 4 etiquetas por hoja A4 o una etiqueta individual por página.',
  },
  {
    q: '¿Cómo exporto pedidos a Shalom?',
    a: 'Selecciona los pedidos que quieras enviar por Shalom y haz clic en "Exportar Shalom". Tori genera automáticamente el formato exacto que Shalom necesita. Incluso puedes marcar la opción "Marcar como Enviado" para que se actualicen solos después de exportar.',
  },
  {
    q: '¿Qué es el Cambio Masivo y cómo se usa?',
    a: 'Es una herramienta del plan Pro que te permite cambiar el estado de varios pedidos a la vez. Por ejemplo: selecciona 20 pedidos que ya entregaste y pásalos todos de "Empacado" a "Enviado" en un solo clic. Ahorra tiempo cuando tienes muchos pedidos.',
  },
  {
    q: '¿Cómo uso los filtros y estadísticas?',
    a: 'En la parte superior del dashboard puedes buscar pedidos por nombre, DNI o teléfono. También puedes filtrar por estado (No Empacado, Empacado, Enviado) o por método de envío. Las estadísticas muestran gráficos de tus pedidos por día, por método y por estado —puedes ver los últimos 7, 15, 30 o 90 días, o elegir fechas personalizadas.',
  },
  {
    q: '¿Puedo agregar o quitar métodos de envío?',
    a: 'En Configuración > Métodos activas los que necesites. Los que están inactivos no aparecen en el formulario de tus clientes. Motorizado requiere que le configures tarifas por distrito y horarios para que funcione bien. Shalom necesita un origen registrado. "Otro método" es ideal para agencias locales específicas. Si estás en Básico, solo puedes tener 2 métodos activos a la vez.',
  },
  {
    q: '¿Cómo se calcula la fecha de entrega?',
    a: 'Tori revisa los días de atención que configuraste (ej: no atiendes domingos, un pedido del sábado se programa para el lunes). La hora de corte define el límite del día —si un cliente pide a las 6pm y tu corte es 5pm, pasa al siguiente día hábil. El cliente ve esa fecha estimada antes de confirmar su pedido. Si no configuras hora de corte, todos los pedidos se toman como "próximo día hábil".',
  },
  {
    q: '¿Puedo poner precio diferente por distrito?',
    a: 'Sí. En la configuración de tarifas (plan Pro) puedes definir un precio distinto para cada distrito de Lima. También puedes usar "Precio único para todos" si prefieres simplificar. El cliente verá el costo exacto antes de confirmar su pedido.',
  },
  {
    q: '¿Qué pasa si supero el límite del plan Básico?',
    a: 'El plan Pro no tiene límites de envíos. Si estás en Básico y necesitas más de 50 envíos al mes, puedes actualizar a Pro desde tu dashboard con un clic. Tus datos y configuración se mantienen intactos.',
  },
]

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const selected = selectedIdx !== null ? FAQS[selectedIdx] : null

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xl hover:shadow-sky-500/30 hover:scale-110 transition-all duration-200 flex items-center justify-center z-40"
        title="Ayuda"
      >
        <HelpCircle size={22} />
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 w-[90vw] sm:w-[380px] max-h-[600px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-5 pt-5 pb-4 shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <ToriMascot variant="guide" size={44} animate />
                  <div>
                    <h3 className="text-white font-bold text-base">Hola, soy Tori</h3>
                    <p className="text-white/80 text-xs">Tu ayudante fiel — respuestas rápidas</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsOpen(false); setSelectedIdx(null) }}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              {selectedIdx === null && (
                <p className="text-white/70 text-xs mt-4 leading-relaxed">
                  Elige una pregunta o{' '}
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setSelectedIdx(null)
                      const p = new URLSearchParams(window.location.search)
                      if (!p.get('tour')) {
                        window.location.search = '?tour=start'
                      }
                    }}
                    className="text-white font-semibold underline hover:no-underline"
                  >
                    haz clic aquí para un tour guiado
                  </button>
                </p>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
              {selectedIdx === null ? (
                /* Question list */
                FAQS.map((faq, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIdx(i)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <ChevronRight size={16} className="mt-0.5 text-slate-300 group-hover:text-sky-500 shrink-0 transition-colors" />
                      <span className="text-sm text-slate-700 group-hover:text-sky-900 leading-relaxed font-medium">
                        {faq.q}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                /* Answer view */
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => setSelectedIdx(null)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-600 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Otras preguntas
                  </button>
                  <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl p-5 border border-sky-100">
                    <p className="text-sm font-bold text-slate-900 mb-3">{selected!.q}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{selected!.a}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <ToriMascot variant="happy" size={28} animate />
                    <p className="text-xs text-slate-400">¿Te ayudó esta respuesta?</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setSelectedIdx(null)
                  window.location.search = '?tour=start'
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-sky-700 hover:border-sky-300 hover:shadow-sm transition-all duration-200"
              >
                <MessageCircle size={14} />
                Quiero un tour guiado por el dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
