'use client'

import ToriMascot from '@/components/ToriMascot'
import { Reveal } from './ui'

export default function TestimonialsSection() {
  return (
    <section id="historias" className="relative bg-slate-50/70 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="flex flex-col items-center gap-5 rounded-3xl border border-tori-100 bg-white p-7 text-center sm:flex-row sm:gap-8 sm:p-10 sm:text-left">
          <div className="shrink-0"><ToriMascot variant="happy" size={80} /></div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[.16em] text-tori-600">Así lo describe un emprendedor que ya usa Tori</h2>
            <blockquote className="mt-3 text-3xl font-black leading-tight text-tori-900 sm:text-4xl">&ldquo;Es como mi Excel, pero en orden.&rdquo;</blockquote>
            <p className="mt-3 text-sm text-slate-500">Tu compañero de negocio para trabajar con más claridad y menos tareas repetitivas.</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
