'use client'

import { LandingValue } from '@/components/landing/editor/LandingEditable'

import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { CheckCheck, Link2, Paperclip, RotateCcw, Smile } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import LogoTori from '@/components/LogoTori'
import { mano } from './ui'

// Cómo es hoy vender por chat y cómo cambia con Tori. Tori NO se conecta a
// WhatsApp: el cliente llena el formulario del negocio y sus datos aparecen
// ordenados en Tori. La escena "Antes" muestra el vaivén que eso evita.

type Mensaje = { de: 'cliente' | 'negocio'; texto: string; enlace?: boolean }

const ANTES: Mensaje[] = [
  { de: 'cliente', texto: 'Hola, quiero que me envíen mi pedido 🙏' },
  { de: 'negocio', texto: '¡Claro! Déjame tus datos' },
  { de: 'cliente', texto: 'María López, DNI 45678912, cel 987654321' },
  { de: 'negocio', texto: 'Gracias 😊 ¿A qué parte es el envío?' },
  { de: 'cliente', texto: 'A provincia, por Shalom' },
  { de: 'negocio', texto: 'Perfecto, ¿y a qué agencia?' },
  { de: 'cliente', texto: 'La de Arequipa' },
  { de: 'negocio', texto: 'Pero en Arequipa hay varias agencias… ¿cuál? 😅' },
  { de: 'cliente', texto: 'Mmm no sé, la que me quede cerca 🤷‍♀️' },
]

const CON_TORI: Mensaje[] = [
  { de: 'cliente', texto: 'Hola, quiero agendar mi envío 📦' },
  { de: 'negocio', texto: '¡Sí, claro! Para agendarlo llena este formulario 👇' },
  { de: 'negocio', texto: 'tori.pe/f/mi-tienda', enlace: true },
  { de: 'cliente', texto: 'Listo, ya lo llené, ¡muchas gracias! 🙌' },
]

const PROBLEMAS = ['Datos sueltos en el chat', 'Agencia sin definir', 'Tú copiando a mano']

const CAMPOS = [
  ['Nombre', 'María López'],
  ['DNI', '45678912'],
  ['Teléfono', '987 654 321'],
  ['Courier', 'Shalom'],
  ['Agencia', 'Arequipa · Cayma · Av. Charcani'],
] as const

type Escena = 'antes' | 'tori'

export default function HeroConversacion() {
  const reducido = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true, amount: 0.3 })

  const [escena, setEscena] = useState<Escena>('antes')
  const [ciclo, setCiclo] = useState(0)
  const [auto, setAuto] = useState(true) // pasa sola de "Antes" a "Con Tori"
  const [mostrados, setMostrados] = useState(0)
  const [escribiendo, setEscribiendo] = useState(false)
  const [problemas, setProblemas] = useState(0)
  const [panel, setPanel] = useState(0) // 0 oculto; 1..CAMPOS.length campos; +1 cierre

  const mensajes = escena === 'antes' ? ANTES : CON_TORI

  useEffect(() => {
    if (!visible) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const en = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

    setMostrados(0)
    setProblemas(0)
    setPanel(0)
    setEscribiendo(false)

    const lista = escena === 'antes' ? ANTES : CON_TORI
    const total = CAMPOS.length + 1

    if (reducido) {
      // Sin animaciones: se muestra directamente el estado final.
      setMostrados(lista.length)
      if (escena === 'antes') setProblemas(PROBLEMAS.length)
      else setPanel(total)
      return
    }

    let t = 700
    lista.forEach((m, i) => {
      if (m.de === 'cliente') {
        en(t, () => setEscribiendo(true))
        t += 1050
        en(t, () => {
          setEscribiendo(false)
          setMostrados(i + 1)
        })
        t += 650
      } else {
        t += 450
        en(t, () => setMostrados(i + 1))
        t += 950
      }
    })

    if (escena === 'antes') {
      PROBLEMAS.forEach((_, i) => en(t + 400 + i * 380, () => setProblemas(i + 1)))
      if (auto) {
        en(t + 400 + PROBLEMAS.length * 380 + 2600, () => {
          setEscena('tori')
          setCiclo((c) => c + 1)
        })
      }
    } else {
      for (let i = 1; i <= total; i++) en(t + 300 + i * 520, () => setPanel(i))
    }

    return () => timers.forEach(clearTimeout)
  }, [visible, escena, ciclo, auto, reducido])

  function elegir(e: Escena) {
    setAuto(false)
    setEscena(e)
    setCiclo((c) => c + 1)
  }
  function repetir() {
    setAuto(escena === 'antes')
    setCiclo((c) => c + 1)
  }

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[22rem] sm:max-w-md">
      {/* halo suave detrás del teléfono */}
      <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-tori-200/60 via-white to-tori-100/60 blur-3xl" />

      {/* selector Antes / Con Tori */}
      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div role="tablist" className="relative flex rounded-full border border-slate-200 bg-white p-1 text-sm font-bold shadow-sm">
          {(['antes', 'tori'] as Escena[]).map((e) => (
            <button
              key={e}
              role="tab"
              aria-selected={escena === e}
              onClick={() => elegir(e)}
              className={`relative cursor-pointer rounded-full px-4 py-1.5 transition-colors ${
                escena === e ? 'text-white' : 'text-slate-500 hover:text-tori-700'
              }`}
            >
              <LandingValue value={escena === e && (
                <motion.span
                  layoutId="hero-escena"
                  className={`absolute inset-0 rounded-full ${e === 'antes' ? 'bg-slate-500' : 'bg-tori-600'}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )} />
              <span className="relative"><LandingValue value={e === 'antes' ? 'Antes' : 'Con Tori'} /></span>
            </button>
          ))}
        </div>
        <button
          onClick={repetir}
          className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-tori-700"
        >
          <RotateCcw size={13} /><LandingValue value={" Repetir"} /></button>
      </div>

      {/* teléfono */}
      <div className="relative isolate transform-gpu overflow-hidden rounded-[2.2rem] border-[9px] border-slate-800 bg-[#efeae2] shadow-2xl shadow-tori-900/20">
        {/* cabecera del chat */}
        <div className="flex items-center gap-3 bg-[#008069] px-4 py-3 text-white">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white/25 text-sm font-black"><LandingValue value={"M"} /></div>
          <div className="leading-tight">
            <p className="text-sm font-bold"><LandingValue value={"María López"} /></p>
            <p className="text-[11px] text-white/80"><LandingValue value={escribiendo ? 'escribiendo…' : 'en línea'} /></p>
          </div>
          <span className="ml-auto rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
            <LandingValue value={escena === 'antes' ? 'Así es hoy' : 'Con Tori'} />
          </span>
        </div>

        {/* mensajes */}
        <div
          className="relative isolate flex h-[26rem] flex-col justify-end gap-1.5 overflow-hidden px-3 pb-3 pt-6"
          style={{
            backgroundImage: 'radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
            maskImage: 'linear-gradient(to bottom, transparent 0, black 3.5rem)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 3.5rem)',
          }}
        >
          <AnimatePresence initial={false}>
            {mensajes.slice(0, mostrados).map((m, i) => (
              <motion.div
                key={`${escena}-${i}`}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex ${m.de === 'negocio' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-lg px-3 py-1.5 text-[13px] leading-snug text-slate-800 shadow-sm ${
                    m.de === 'negocio' ? 'rounded-tr-none bg-[#d9fdd3]' : 'rounded-tl-none bg-white'
                  }`}
                >
                  {m.enlace ? (
                    <div className="-mx-1 -mt-0.5 w-52 overflow-hidden rounded-md bg-white/80 ring-1 ring-black/5">
                      <div className="flex items-center gap-2 bg-tori-50 px-2.5 py-2">
                        <LogoTori size={28} />
                        <div className="leading-tight">
                          <p className="text-[12px] font-bold text-tori-900"><LandingValue value={"Formulario de envíos"} /></p>
                          <p className="text-[10px] text-slate-500"><LandingValue value={"Mi Tienda"} /></p>
                        </div>
                      </div>
                      <p className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-tori-700 underline">
                        <Link2 size={11} /> <LandingValue value={m.texto} />
                      </p>
                    </div>
                  ) : (
                    m.texto
                  )}
                  <span className="mt-0.5 flex items-center justify-end gap-1 text-[9px] text-slate-400"><LandingValue value={"10:"} /><LandingValue value={String(20 + i).padStart(2, '0')} />
                    <LandingValue value={m.de === 'negocio' && <CheckCheck size={11} className="text-sky-500" />} />
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* barra de escribir (decorativa) */}
        <div className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-2">
          <Smile size={18} className="text-slate-400" />
          <div className="flex-1 rounded-full bg-white px-3 py-1.5 text-[12px] text-slate-400"><LandingValue value={"Mensaje"} /></div>
          <Paperclip size={17} className="text-slate-400" />
        </div>

        {/* lo que cuesta el vaivén (solo en "Antes") */}
        <AnimatePresence>
          {escena === 'antes' && problemas > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 bottom-14 flex flex-col items-center gap-1.5 px-4"
            >
              {PROBLEMAS.slice(0, problemas).map((p) => (
                <motion.span
                  key={p}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800 shadow-md"
                ><LandingValue value={"⚠ "} /><LandingValue value={p} />
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* lo que aparece en Tori cuando el cliente llena el formulario */}
      <AnimatePresence>
        {escena === 'tori' && panel > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative z-10 mt-4 w-full rounded-2xl border border-tori-200 bg-white p-4 shadow-xl shadow-tori-900/15 sm:absolute sm:-bottom-6 sm:-right-14 sm:mt-0 sm:w-[19rem]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogoTori size={24} />
                <p className="text-sm font-black text-tori-900"><LandingValue value={"Nuevo pedido"} /></p>
              </div>
              <span className="rounded-full bg-tori-50 px-2 py-0.5 text-[10px] font-bold text-tori-700"><LandingValue value={"Tori"} /></span>
            </div>
            <div className="mt-3 space-y-1.5">
              {CAMPOS.map(([etiqueta, valor], i) => {
                const lleno = panel > i
                return (
                  <div key={etiqueta} className="flex min-h-8 items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px]">
                    <span className="text-slate-400"><LandingValue value={etiqueta} /></span>
                    {lleno ? (
                      <motion.span
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-right font-bold text-tori-900"
                      >
                        <LandingValue value={valor} />
                      </motion.span>
                    ) : (
                      <span className="h-1.5 w-12 rounded-full bg-slate-200" />
                    )}
                  </div>
                )
              })}
            </div>
            <AnimatePresence>
              {panel > CAMPOS.length && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"><LandingValue value={"No empacado"} /></span>
                    <span className={`${mano.className} text-[17px] font-bold leading-none text-tori-600`}><LandingValue value={"¡sin copiar nada!"} /></span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
