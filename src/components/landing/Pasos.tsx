'use client'

import { ClipboardCheck, Link2, Store } from 'lucide-react'
import { Reveal, SectionHead } from './ui'

const pasos = [
  { icon: Store, title: 'Crea tu cuenta', desc: 'Pon el nombre de tu negocio y elige cómo realizas tus entregas.' },
  { icon: Link2, title: 'Comparte tu formulario', desc: 'Envía el enlace por WhatsApp o colócalo en tus redes. Tu cliente completa sus datos.' },
  { icon: ClipboardCheck, title: 'Recibe y valida tu pedido', desc: 'Revisa la información en el dashboard y actualiza cada pedido mientras lo preparas.' },
]

export default function Pasos() {
  return (
    <section id="solucion" className="relative bg-slate-50/70 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead center eyebrow="Cómo funciona" title="Del formulario a tu dashboard. Así de simple." sub="No necesitas cargar todo tu inventario para empezar a recibir pedidos." />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pasos.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-tori-50 text-tori-600"><p.icon size={21} /></span><span className="text-xs font-black tracking-wider text-slate-300">0{i + 1}</span></div>
              <h3 className="mt-4 text-lg font-extrabold text-tori-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
