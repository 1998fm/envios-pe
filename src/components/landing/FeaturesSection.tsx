'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  Package,
  Palette,
  ShoppingCart,
  Store,
  Truck,
  Warehouse,
} from 'lucide-react'
import LogoTori from '@/components/LogoTori'

const features = [
  {
    icon: MessageCircle,
    eyebrow: 'Pedidos',
    title: 'Deja de buscar pedidos en WhatsApp.',
    text: 'El cliente coloca sus datos y cada pedido llega ordenado a Tori.',
    resultado: 'Recibes la información ordenada',
  },
  {
    icon: Warehouse,
    eyebrow: 'Inventario',
    title: '¿Vendiste algo y ya no recuerdas si quedaba?',
    text: 'Tu inventario queda conectado a tus ventas y te avisa cuando algo se acaba.',
    resultado: 'Sabes qué tienes disponible',
  },
  {
    icon: Banknote,
    eyebrow: 'Dinero',
    title: '¿Cuánto dinero tienes disponible?',
    text: 'Tori calcula tu saldo con tus ventas, compras y gastos.',
    resultado: 'Siempre sabes cuánto tienes',
  },
  {
    icon: ShoppingCart,
    eyebrow: 'Ventas',
    title: '¿Sabes qué vendiste y qué te deben?',
    text: 'Todas tus ventas y cobros en un mismo lugar, con sus montos.',
    resultado: 'Sabes qué vendiste y qué te deben',
  },
  {
    icon: ClipboardList,
    eyebrow: 'Compras y gastos',
    title: '¿Llevas las cuentas a mano?',
    text: 'Registra compras y gastos sin cuentas aparte ni cuadernos.',
    resultado: 'Dejas las cuentas a mano',
  },
  {
    icon: Truck,
    eyebrow: 'Envíos',
    title: '¿Copias datos a mano para cada envío?',
    text: 'Tori prepara la información de tus envíos con tarifas por distrito.',
    resultado: 'Preparas envíos sin copiar a mano',
  },
]

const metodosForm = [
  { icon: Truck, label: 'Motorizado', active: true },
  { icon: Package, label: 'Shalom', active: false },
  { icon: Store, label: 'Recojo', active: false },
]

export default function FeaturesSection() {
  return (
    <section id="funciones" className="py-14 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">Todo en un solo lugar</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Menos trabajo repetitivo.{' '}
            <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              Más control.
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Cada función resuelve algo que hoy te quita tiempo.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.eyebrow}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 hover:border-sky-300 hover:shadow-lg hover:bg-white transition-all duration-200 flex flex-col"
            >
              <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-[11px] font-bold uppercase tracking-wider">
                <f.icon size={13} />
                {f.eyebrow}
              </div>
              <h3 className="mt-4 font-bold text-slate-900 leading-snug">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed flex-1">{f.text}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-700">
                <Check size={12} />
                {f.resultado}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Spotlight: tu formulario, a tu manera */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 rounded-3xl p-6 sm:p-10"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-4 shadow-sm">
              <Palette size={20} className="text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              Tu formulario, a tu manera.
            </h3>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              Personaliza lo que piden tus clientes para recibir la información que necesitas, ordenada desde el
              inicio.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
              <Check size={13} />
              Recibe la info que necesitas
            </span>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="ml-3 hidden sm:block flex-1 max-w-xs text-center text-[10px] font-medium text-slate-400 bg-slate-50 rounded-lg px-3 py-1 truncate">
                  dulcesdemaria.pe/pedido
                </span>
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <LogoTori size={40} />
                  <div>
                    <p className="text-base font-extrabold text-slate-900">Dulces de María</p>
                    <p className="text-[11px] text-slate-400">Haz tu pedido en 1 minuto</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 p-3.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tus datos</p>
                  <div className="mt-2.5 space-y-2">
                    <div className="h-2.5 w-full rounded-full bg-slate-200 animate-pulse" />
                    <div className="h-2.5 w-2/3 rounded-full bg-slate-200 animate-pulse" />
                    <div className="h-2.5 w-1/2 rounded-full bg-slate-200 animate-pulse" />
                  </div>
                </div>

                <div className="mt-3.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    ¿Cómo lo recibes?
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {metodosForm.map((m, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-2.5 text-center ${
                          m.active ? 'border-2 border-sky-500 bg-sky-50' : 'border border-slate-100 bg-white'
                        }`}
                      >
                        <m.icon size={15} className={`mx-auto ${m.active ? 'text-sky-600' : 'text-slate-400'}`} />
                        <p className={`text-[9px] font-bold mt-1 ${m.active ? 'text-sky-700' : 'text-slate-500'}`}>
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between rounded-xl border border-slate-100 p-3.5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Distrito: Miraflores
                    </p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">Envío S/ 8.00</p>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-center py-3 text-sm font-bold shadow-lg shadow-sky-500/20">
                  Confirmar pedido
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ y: [16, 0, 0, -16], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 4, times: [0, 0.15, 0.8, 1], repeat: Infinity, repeatDelay: 1.2, delay: 1.5 }}
              className="hidden md:flex absolute -bottom-6 -left-10 items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 px-4 py-3"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Check size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Nuevo pedido</p>
                <p className="text-[10px] text-slate-400">María García · Motorizado · hace 1 min</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-10 text-center"
        >
          <a
            href="#precios"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200"
          >
            Probar Tori gratis
            <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
