'use client'

import { useState } from 'react'
import { ArrowRight, Check, ClipboardList, RotateCcw } from 'lucide-react'

export default function PedidoDemo() {
  const [recibido, setRecibido] = useState(false)
  const [validado, setValidado] = useState(false)

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="absolute -inset-5 rounded-[3rem] bg-tori-100/70 blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-tori-200 bg-white shadow-2xl shadow-tori-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <span className="text-xs font-bold text-slate-500">DEMOSTRACIÓN INTERACTIVA</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-tori-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Tori</span>
        </div>
        <div className="p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-2 text-xs font-bold">
            <span className={recibido ? 'text-slate-400' : 'text-tori-700'}>Tu formulario</span>
            <ArrowRight size={14} className="text-slate-300" />
            <span className={recibido ? 'text-tori-700' : 'text-slate-400'}>Tu dashboard</span>
          </div>
          {!recibido ? (
            <div>
              <p className="text-xl font-extrabold text-tori-900">Los datos, completos desde el inicio.</p>
              <p className="mt-2 text-sm text-slate-500">Tu cliente completa el formulario que compartes por WhatsApp.</p>
              <div className="mt-5 grid gap-3">
                {[['Cliente', 'Ana Torres'], ['Teléfono', '987 654 321'], ['Entrega', 'Motorizado · Miraflores'], ['Dirección', 'Av. Larco 100']].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-200 px-4 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setRecibido(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-tori-600 px-4 py-3 text-sm font-bold text-white hover:bg-tori-700">Simular envío del formulario <ArrowRight size={16} /></button>
            </div>
          ) : (
            <div aria-live="polite">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><Check size={13} /> Pedido recibido</span>
              <p className="mt-4 text-xl font-extrabold text-tori-900">Todo listo para revisar.</p>
              <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-slate-800">Ana Torres</p><p className="mt-1 text-xs text-slate-400">Pedido de ejemplo · E-0001</p></div><ClipboardList size={20} className="text-tori-600" /></div>
                <dl className="mt-5 space-y-3 text-sm"><div><dt className="text-xs text-slate-400">Contacto</dt><dd className="font-medium text-slate-700">987 654 321</dd></div><div><dt className="text-xs text-slate-400">Entrega</dt><dd className="font-medium text-slate-700">Motorizado · Miraflores<br />Av. Larco 100</dd></div></dl>
                <p className={`mt-5 rounded-lg px-3 py-2 text-xs font-bold ${validado ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{validado ? 'Revisado y empacado' : 'Pendiente de revisión'}</p>
              </div>
              <button onClick={() => setValidado(true)} disabled={validado} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-tori-600 px-4 py-3 text-sm font-bold text-white hover:bg-tori-700 disabled:bg-emerald-600"><Check size={16} />{validado ? 'Pedido listo' : 'Revisar y marcar como empacado'}</button>
              <button onClick={() => { setRecibido(false); setValidado(false) }} className="mx-auto mt-3 flex items-center gap-1.5 py-1 text-xs font-semibold text-slate-500"><RotateCcw size={12} /> Ver de nuevo</button>
            </div>
          )}
          <p className="mt-4 text-center text-[11px] text-slate-400">Ejemplo ilustrativo. No se envían datos reales.</p>
        </div>
      </div>
    </div>
  )
}
