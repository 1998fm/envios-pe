'use client'

import { LandingValue, LandingAnchor } from '@/components/landing/editor/LandingEditable'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { CountUp, Reveal, Resaltado, SectionHead } from './ui'

const ventana = 'w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-tori-900/10'

/* ---------------- Pedidos + envíos ---------------- */
function VisualPedidos() {
  const [courier, setCourier] = useState('Shalom')
  const [listo, setListo] = useState(false)
  return (
    <div className={ventana}>
      <div className="flex items-center justify-between">
        <p className="font-black text-tori-900"><LandingValue value={"Nuevo pedido"} /></p>
        <span className="text-xs font-bold text-emerald-600"><LandingValue value={"Datos completos"} /></span>
      </div>
      <div className="mt-5 space-y-2.5">
        {['Nombre: María López', 'Dirección: Av. Siempre Viva 123'].map((t) => (
          <div key={t} className="flex h-11 items-center rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-600">
            <LandingValue value={t} />
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-1.5">
          <span className="pl-2 text-sm text-slate-500"><LandingValue value={"Courier:"} /></span>
          {['Shalom', 'Olva', 'Moto'].map((c) => (
            <button
              key={c}
              onClick={() => {
                setCourier(c)
                setListo(false)
              }}
              className={`relative cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                courier === c ? 'text-white' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <LandingValue value={courier === c && (
                <motion.span
                  layoutId="courier-pill"
                  className="absolute inset-0 rounded-lg bg-tori-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )} />
              <span className="relative"><LandingValue value={c} /></span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setListo(true)}
          className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
            listo ? 'bg-emerald-500 text-white' : 'bg-tori-600 text-white hover:bg-tori-700'
          }`}
        >
          {listo ? (
            <>
              <Check size={15} /><LandingValue value={" Envío listo con "} /><LandingValue value={courier} />
            </>
          ) : (
            'Preparar envío'
          )}
        </button>
      </div>
    </div>
  )
}

/* ---------------- Ventas + dinero ---------------- */
function VisualDinero() {
  const [ventas, setVentas] = useState(1248)
  const [gastos, setGastos] = useState(284)
  const [cobros, setCobros] = useState(12)
  const disponible = 764 + (ventas - 1248) - (gastos - 284)
  const pct = Math.max(6, Math.min(100, (disponible / ventas) * 100 * 1.25))

  return (
    <div className={ventana}>
      <p className="text-sm font-bold text-slate-500"><LandingValue value={"Dinero disponible"} /></p>
      <CountUp value={disponible} prefix="S/ " decimals={2} className="mt-2 block text-4xl font-black text-tori-900" />
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-[10px] text-emerald-700"><LandingValue value={"Ventas"} /></p>
          <CountUp value={ventas} prefix="S/ " className="mt-1 block font-black text-tori-900" />
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-[10px] text-slate-500"><LandingValue value={"Gastos"} /></p>
          <CountUp value={gastos} prefix="S/ " className="mt-1 block font-black text-tori-900" />
        </div>
        <div className="rounded-xl bg-tori-50 p-3">
          <p className="text-[10px] text-tori-700"><LandingValue value={"Cobros"} /></p>
          <CountUp value={cobros} className="mt-1 block font-black text-tori-900" />
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-tori-500"
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 16 }}
        />
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => {
            setVentas((v) => v + 45)
            setCobros((c) => c + 1)
          }}
          className="flex-1 cursor-pointer rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 active:scale-95"
        ><LandingValue value={"+ Registrar venta S/ 45"} /></button>
        <button
          onClick={() => setGastos((g) => g + 20)}
          className="flex-1 cursor-pointer rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-200 active:scale-95"
        ><LandingValue value={"− Anotar gasto S/ 20"} /></button>
      </div>
    </div>
  )
}

/* ---------------- Inventario + productos ---------------- */
function VisualInventario() {
  const [items, setItems] = useState([
    { name: 'Vestido Luna', qty: 24 },
    { name: 'Polo Basic', qty: 7 },
    { name: 'Jean Wide', qty: 18 },
  ])
  const vendidas = 49 - items.reduce((s, i) => s + i.qty, 0)

  function vender(i: number) {
    setItems((p) => p.map((x, idx) => (idx === i && x.qty > 0 ? { ...x, qty: x.qty - 1 } : x)))
  }

  return (
    <div className={ventana}>
      <div className="flex items-center justify-between">
        <p className="font-black text-tori-900"><LandingValue value={"Inventario"} /></p>
        <span className="text-xs text-slate-500">
          <CountUp value={286 - vendidas} /><LandingValue value={" unidades"} /></span>
      </div>
      <div className="mt-5 space-y-4">
        {items.map((p, i) => {
          const bajo = p.qty <= 7
          const agotado = p.qty === 0
          return (
            <div key={p.name}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700"><LandingValue value={p.name} /></span>
                <div className="flex items-center gap-3">
                  {bajo && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      <LandingValue value={agotado ? 'Agotado' : 'Poco stock'} />
                    </span>
                  )}
                  <CountUp value={p.qty} className={`w-6 text-right text-sm font-black ${bajo ? 'text-amber-600' : 'text-emerald-600'}`} />
                  <button
                    onClick={() => vender(i)}
                    disabled={agotado}
                    aria-label={`Vender 1 ${p.name}`}
                    className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-tori-100 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Minus size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <motion.div
                  className={`h-full rounded-full ${bajo ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-400 to-tori-500'}`}
                  animate={{ width: `${(p.qty / 30) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-5 flex items-center gap-1.5 text-[11px] text-slate-400">
        <Plus size={12} className="rotate-45" /><LandingValue value={" Toca el − para registrar una venta y ver cómo baja el stock"} /></p>
    </div>
  )
}

const soluciones = [
  {
    tab: 'Pedidos + Envíos',
    badge: 'PEDIDOS + ENVÍOS',
    badgeClass: 'bg-tori-50 text-tori-700',
    title: 'Tus pedidos dejan de estar perdidos.',
    text: 'Tu cliente coloca sus datos una vez. Tori recibe la información organizada para que preparar y gestionar tus envíos sea mucho más sencillo.',
    chips: ['Formulario', 'Direcciones', 'Courier'],
    Visual: VisualPedidos,
  },
  {
    tab: 'Ventas + Dinero',
    badge: 'VENTAS + DINERO',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    title: 'Deja de hacer cuentas para saber cómo va el negocio.',
    text: 'Ten una visión más clara de tus ventas, cobros, gastos y dinero disponible para tomar decisiones sin depender de varias hojas.',
    chips: ['Ventas', 'Cobros', 'Dinero'],
    Visual: VisualDinero,
  },
  {
    tab: 'Inventario + Productos',
    badge: 'INVENTARIO + PRODUCTOS',
    badgeClass: 'bg-violet-50 text-violet-700',
    title: 'Sabes qué tienes antes de prometer lo que no tienes.',
    text: 'Relaciona tus ventas con tus productos para tener una visión más clara de lo que queda disponible.',
    chips: ['Stock', 'Productos', 'Ventas'],
    Visual: VisualInventario,
  },
]

export default function FeaturesSection() {
  const [idx, setIdx] = useState(0)
  const s = soluciones[idx]

  return (
    <section id="funciones" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Tres grandes soluciones"
          title={
            <><LandingValue value={"No te mostramos siete funciones. "} /><Resaltado><LandingValue value={"Te mostramos tres cambios en tu día."} /></Resaltado>
            </>
          }
          sub="Cada bloque responde a un problema real de un emprendedor."
        />

        <Reveal delay={0.1} className="mt-12">
          <div className="flex flex-wrap gap-2" role="tablist">
            {soluciones.map((x, i) => (
              <button
                key={x.tab}
                role="tab"
                aria-selected={i === idx}
                onClick={() => setIdx(i)}
                className={`relative cursor-pointer rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                  i === idx ? 'text-white' : 'text-slate-600 hover:text-tori-700'
                }`}
              >
                <LandingValue value={i === idx && (
                  <motion.span
                    layoutId="feature-tab"
                    className="absolute inset-0 rounded-full bg-tori-600 shadow-lg shadow-tori-600/25"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )} />
                <span className="relative"><LandingValue value={x.tab} /></span>
              </button>
            ))}
          </div>

          <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
            <AnimatePresence mode="wait">
              <motion.article
                key={s.badge}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="relative grid lg:grid-cols-2"
              >
                <div className="flex flex-col justify-center p-7 sm:p-12">
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${s.badgeClass}`}><LandingValue value={s.badge} /></span>
                  <h3 className="mt-4 text-3xl font-black leading-tight text-tori-900"><LandingValue value={s.title} /></h3>
                  <p className="mt-4 leading-relaxed text-slate-600"><LandingValue value={s.text} /></p>
                  <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                    {s.chips.map((c) => (
                      <span key={c} className="rounded-full border border-slate-200 bg-white px-3 py-2">
                        <LandingValue value={c} />
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center p-5 sm:p-10">
                  <s.Visual />
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </Reveal>

        <Reveal className="mt-12 text-center">
          <p className="text-lg text-slate-600"><LandingValue value={"¿Quieres ver todas las soluciones que Tori ya tiene?"} /></p>
          <LandingAnchor
            href="#precios"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-tori-600 px-6 py-3.5 font-extrabold text-white shadow-xl shadow-tori-600/25 transition hover:bg-tori-700"
          ><LandingValue value={"Probar Tori gratis"} /><ArrowRight size={16} />
          </LandingAnchor>
        </Reveal>
      </div>
    </section>
  )
}
