'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  ClipboardList,
  MapPin,
  MessageCircle,
  Package,
  Palette,
  Receipt,
  ShoppingCart,
  Store,
  Truck,
  Warehouse,
} from 'lucide-react'
import LogoTori from '@/components/LogoTori'

/* ============ VISUALES DE CADA FUNCIÓN ============ */

function VisualWhatsApp() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden max-w-sm w-full">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100">
        <span className="w-2 h-2 rounded-full bg-slate-200" />
        <span className="w-2 h-2 rounded-full bg-slate-200" />
        <span className="w-2 h-2 rounded-full bg-slate-200" />
        <span className="ml-2 text-[10px] font-medium text-slate-400">WhatsApp · tu negocio</span>
      </div>
      <div className="p-3.5 space-y-2">
        <div className="max-w-[90%] ml-auto bg-emerald-100 text-emerald-900 text-[11px] rounded-2xl rounded-br-sm px-3 py-2">
          me haces 1 box de brownies para el jueves?
        </div>
        <div className="max-w-[90%] bg-slate-100 text-slate-800 text-[11px] rounded-2xl rounded-bl-sm px-3 py-2">
          Claro! me pasas tu dirección?
        </div>
        <div className="max-w-[90%] ml-auto bg-emerald-100 text-emerald-900 text-[11px] rounded-2xl rounded-br-sm px-3 py-2 border border-emerald-400">
          Av. Lima 123, San Borja
        </div>
      </div>
      <div className="mx-3.5 border-t border-dashed border-slate-200" />
      <div className="p-3.5">
        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[9px] font-bold whitespace-nowrap">
              Nuevo pedido
            </span>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold whitespace-nowrap">
              Enviado
            </span>
          </div>
          <p className="mt-2 text-xs font-bold text-slate-900">Lucía F. · Box de brownies</p>
          <p className="text-[10px] text-slate-500">Miraflores · Envío S/ 8.00</p>
        </div>
      </div>
    </div>
  )
}

function VisualInventario() {
  const productos = [
    { name: 'Box de brownies', qty: '24 / 30', pct: 80, color: 'bg-sky-500', badge: null as string | null },
    { name: 'Caja kraft M', qty: '18 / 40', pct: 45, color: 'bg-amber-500', badge: null as string | null },
    { name: 'Cinta adhesiva', qty: '6 / 40', pct: 15, color: 'bg-red-500', badge: 'Stock bajo' },
  ]
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden max-w-sm w-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <p className="text-[11px] font-bold text-slate-900">Inventario</p>
        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[9px] font-bold whitespace-nowrap">
          1 bajo stock
        </span>
      </div>
      <div className="p-3.5 space-y-3">
        {productos.map((p) => (
          <div key={p.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-700 truncate">{p.name}</span>
              <span className="text-[10px] font-semibold text-slate-400">{p.qty}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
              </div>
              {p.badge && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[8px] font-bold whitespace-nowrap">
                  {p.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
        <Check size={12} />
        Al vender, el stock se descuenta solo
      </div>
    </div>
  )
}

function VisualDinero() {
  return (
    <div className="max-w-sm w-full space-y-2.5">
      <div className="bg-gradient-to-r from-sky-600 via-sky-600 to-indigo-700 rounded-2xl p-4 text-white shadow-xl shadow-sky-500/20">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Saldo disponible</p>
        <p className="text-2xl font-extrabold mt-0.5 leading-none">S/ 4,860.50</p>
        <p className="text-[10px] text-white/70 mt-1">Ventas − Compras − Gastos</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xl shadow-slate-900/5 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-2.5">
          <p className="text-[10px] font-semibold text-slate-500">Efectivo</p>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">S/ 2,100</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <p className="text-[10px] font-semibold text-slate-500">Yape / Plin</p>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">S/ 1,860</p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-2.5 col-span-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-amber-600">Por cobrar</p>
          <p className="text-sm font-extrabold text-amber-700">S/ 320</p>
        </div>
      </div>
    </div>
  )
}

function VisualVentas() {
  const ventas = [
    { name: 'Rosa Q.', total: 'S/ 45.00', badge: 'Cobrado', badgeClass: 'bg-emerald-100 text-emerald-700' },
    { name: 'Pedro S.', total: 'S/ 72.50', badge: 'Por cobrar', badgeClass: 'bg-amber-100 text-amber-700' },
    { name: 'Karla M.', total: 'S/ 120.00', badge: 'Cobrado', badgeClass: 'bg-emerald-100 text-emerald-700' },
  ]
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden max-w-sm w-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <p className="text-[11px] font-bold text-slate-900">Ventas · Hoy</p>
        <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[9px] font-bold whitespace-nowrap">
          Total S/ 485
        </span>
      </div>
      <div className="p-3.5 space-y-2">
        {ventas.map((v) => (
          <div key={v.name} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <Banknote size={14} className="text-sky-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-900 truncate">{v.name}</p>
              <p className="text-[10px] text-slate-400">Yape / Plin</p>
            </div>
            <span className="text-xs font-bold text-slate-900 whitespace-nowrap">{v.total}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${v.badgeClass}`}>
              {v.badge}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VisualCompras() {
  const gastos = [
    { concepto: 'Harina 5kg', cat: 'Materiales', monto: 'S/ 45.00', catClass: 'bg-sky-50 text-sky-700' },
    { concepto: 'Delivery cliente', cat: 'Envíos', monto: 'S/ 12.00', catClass: 'bg-purple-50 text-purple-700' },
    { concepto: 'Publicación de story', cat: 'Marketing', monto: 'S/ 30.00', catClass: 'bg-rose-50 text-rose-700' },
  ]
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden max-w-sm w-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <p className="text-[11px] font-bold text-slate-900">Compras y gastos</p>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold whitespace-nowrap">
          Total S/ 87
        </span>
      </div>
      <div className="p-3.5 space-y-2">
        {gastos.map((g) => (
          <div key={g.concepto} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
              <Receipt size={14} className="text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-900 truncate">{g.concepto}</p>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold whitespace-nowrap ${g.catClass}`}>
                {g.cat}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 whitespace-nowrap">{g.monto}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VisualEnvios() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden max-w-sm w-full">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100">
        <span className="w-2 h-2 rounded-full bg-slate-200" />
        <span className="w-2 h-2 rounded-full bg-slate-200" />
        <span className="w-2 h-2 rounded-full bg-slate-200" />
        <span className="ml-2 text-[10px] font-medium text-slate-400">Envío · Motorizado</span>
      </div>
      <div className="p-3.5">
        <div className="rounded-xl border border-slate-100 p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              L
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Lucía Fernández</p>
              <p className="text-[10px] text-slate-400">Box de brownies</p>
            </div>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-bold whitespace-nowrap">
              Listo para despachar
            </span>
          </div>
          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
            <div className="flex justify-between text-[11px]">
              <span className="flex items-center gap-1 text-slate-500">
                <MapPin size={11} />
                Distrito
              </span>
              <span className="font-semibold text-slate-800">Miraflores</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="flex items-center gap-1 text-slate-500">
                <Truck size={11} />
                Envío
              </span>
              <span className="font-semibold text-slate-800">S/ 8.00</span>
            </div>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
          <Check size={12} />
          Tarifa calculada por distrito
        </div>
      </div>
    </div>
  )
}

/* ============ DATOS ============ */

const features = [
  {
    icon: MessageCircle,
    eyebrow: 'Pedidos',
    problema: '¿Sigues buscando direcciones en WhatsApp?',
    text: 'El cliente coloca sus datos y cada pedido llega ordenado a Tori.',
    resultado: 'Recibes la información ordenada',
    Visual: VisualWhatsApp,
  },
  {
    icon: Warehouse,
    eyebrow: 'Inventario',
    problema: '¿Vendiste algo y ya no recuerdas si quedaba?',
    text: 'Tu inventario queda conectado a tus ventas y te avisa cuando algo se acaba.',
    resultado: 'Sabes qué tienes disponible',
    Visual: VisualInventario,
  },
  {
    icon: Banknote,
    eyebrow: 'Dinero',
    problema: '¿Cuánto dinero tienes disponible?',
    text: 'Tori calcula tu saldo con tus ventas, compras y gastos.',
    resultado: 'Siempre sabes cuánto tienes',
    Visual: VisualDinero,
  },
  {
    icon: ShoppingCart,
    eyebrow: 'Ventas',
    problema: '¿Sabes qué vendiste y qué te deben?',
    text: 'Todas tus ventas y cobros en un mismo lugar, con sus montos.',
    resultado: 'Sabes qué vendiste y qué te deben',
    Visual: VisualVentas,
  },
  {
    icon: ClipboardList,
    eyebrow: 'Compras y gastos',
    problema: '¿Llevas las cuentas a mano?',
    text: 'Registra compras y gastos sin cuentas aparte ni cuadernos.',
    resultado: 'Dejas las cuentas a mano',
    Visual: VisualCompras,
  },
  {
    icon: Truck,
    eyebrow: 'Envíos',
    problema: '¿Copias datos a mano para cada envío?',
    text: 'Tori prepara la información de tus envíos con tarifas por distrito.',
    resultado: 'Preparas envíos sin copiar a mano',
    Visual: VisualEnvios,
  },
]

const metodosForm = [
  { icon: Truck, label: 'Motorizado', active: true },
  { icon: Package, label: 'Shalom', active: false },
  { icon: Store, label: 'Recojo', active: false },
]

/* ============ SECCIÓN ============ */

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

        <div className="space-y-6 sm:space-y-8">
          {features.map((f, i) => {
            const invertido = i % 2 === 1
            return (
              <motion.div
                key={f.eyebrow}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="rounded-3xl border border-slate-200 bg-slate-50/50 p-5 sm:p-8"
              >
                <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${invertido ? '' : ''}`}>
                  <div className={`${invertido ? 'lg:order-2' : ''}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-[11px] font-bold uppercase tracking-wider">
                      <f.icon size={13} />
                      {f.eyebrow}
                    </div>
                    <h3 className="mt-4 text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                      {f.problema}
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">{f.text}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
                      <Check size={13} />
                      {f.resultado}
                    </span>
                  </div>

                  <div className={`flex justify-center ${invertido ? 'lg:order-1' : ''}`}>
                    <f.Visual />
                  </div>
                </div>
              </motion.div>
            )
          })}
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
