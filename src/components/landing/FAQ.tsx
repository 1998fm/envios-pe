'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Reveal, SectionHead } from './ui'

const faqs = [
  {
    q: '¿Tori se conecta a mi WhatsApp?',
    a: 'No. Tú compartes el enlace de tu formulario por WhatsApp o en tus redes. Tu cliente lo completa y el pedido llega organizado a tu dashboard.',
  },
  {
    q: '¿Qué puedo hacer con el plan Básico?',
    a: 'Recibir solicitudes sin límite mensual, buscar y revisar tus pedidos y gestionarlos individualmente. Copiar datos, etiquetas, Shalom Pro, acciones masivas, inventario, ventas, compras, gastos y reportes están incluidos en Plus.',
  },
  {
    q: '¿Qué pasa después de los 14 días de prueba?',
    a: 'Puedes contratar Plus o continuar en Básico gratis. La prueba no te cobra automáticamente y no necesitas registrar una tarjeta para empezar.',
  },
  {
    q: '¿Tengo que cargar productos para recibir pedidos?',
    a: 'No. Puedes empezar configurando tu negocio y compartiendo tu formulario. El inventario y las herramientas de ventas están disponibles con Plus cuando quieras usarlos.',
  },
  {
    q: '¿Necesito dejar WhatsApp o Excel?',
    a: 'Puedes seguir vendiendo por tus canales habituales y empezar con Tori a tu ritmo. Primero organiza tus pedidos; luego incorpora las herramientas que necesites.',
  },
]

export default function FAQ() {
  const [abierta, setAbierta] = useState<number | null>(0)

  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHead
          center
          eyebrow="Preguntas frecuentes"
          title="Lo que necesitas saber antes de empezar."
        />
        <Reveal delay={0.1} className="mt-7 space-y-3">
          {faqs.map((f, i) => {
            const open = abierta === i
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                  open ? 'border-tori-300 shadow-md shadow-tori-600/10' : 'border-slate-200 hover:border-tori-200'
                }`}
              >
                <button
                  onClick={() => setAbierta(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-black text-tori-900">{f.q}</span>
                  <motion.span
                    animate={{ rotate: open ? 135 : 0 }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tori-50 text-tori-600"
                  >
                    <Plus size={16} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <p className="px-5 pb-5 leading-relaxed text-slate-600">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}
