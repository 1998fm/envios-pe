'use client'

import { useRef, useState } from 'react'
import {
  ClipboardList,
  Link2,
  MessageCircle,
  Package,
  Palette,
  Power,
  Truck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import SelectorDias from '@/components/SelectorDias'
import AyudaLogisticaOpciones from '@/components/AyudaLogisticaOpciones'
import AyudaCerrarFormulario from '@/components/AyudaCerrarFormulario'
import VistaPreviaFormulario from '@/components/VistaPreviaFormulario'
import { comprimirImagenWebP } from '@/lib/comprimirImagen'
import { normalizarHex } from '@/lib/formColor'
import type { ConfigState } from '@/types/config'

type Props = {
  userId: string
  config: ConfigState
  setConfig: React.Dispatch<React.SetStateAction<ConfigState>>
  guardarConfiguracion: (overrides?: Partial<ConfigState>) => Promise<void>
  plan?: string
  onUpgrade?: () => void
  distritosMotorizado: string[]
}

function Switch({ checked, onChange, danger = false }: { checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ${checked ? (danger ? 'bg-rose-500' : 'bg-sky-600') : 'bg-slate-200'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  )
}

function SelectorColor({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onCommit: (v: string) => void
}) {
  const valido = normalizarHex(value)

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <div className="flex items-center gap-2.5">
        <label
          className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-sm"
          style={{ background: valido ?? '#e2e8f0' }}
        >
          <input
            type="color"
            value={valido ?? '#0284c7'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
        <input
          type="text"
          key={value}
          defaultValue={value}
          onBlur={(e) => {
            const n = normalizarHex(e.target.value)
            e.target.value = n ?? value
            if (n) onCommit(n)
          }}
          placeholder="#0284c7"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
        />
      </div>
    </div>
  )
}

type FilaProps = {
  tour?: string
  icon: React.ReactNode
  iconBg: string
  titulo: string
  desc: string
  derecha?: React.ReactNode
  cuerpo?: React.ReactNode
}

function Fila({ tour, icon, iconBg, titulo, desc, derecha, cuerpo }: FilaProps) {
  return (
    <div data-tour={tour}>
      <div className="flex items-center gap-3 px-5 py-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{titulo}</p>
          <p className="text-xs text-slate-500 leading-snug mt-0.5">{desc}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">{derecha}</div>
      </div>
      {cuerpo && <div className="px-5 pb-4 pt-1 border-t border-slate-100">{cuerpo}</div>}
    </div>
  )
}

function Grupo({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  )
}

export default function SeccionFormulario({ userId, config, setConfig, guardarConfiguracion, plan = 'basic', onUpgrade, distritosMotorizado }: Props) {
  const isBasic = plan === 'basic'
  const [avanzado, setAvanzado] = useState<Record<string, boolean>>({})

  function guardarForm<K extends keyof ConfigState>(key: K, value: ConfigState[K]) {
    setConfig(prev => ({ ...prev, [key]: value }))
    guardarConfiguracion({ [key]: value } as Partial<ConfigState>)
  }

  function toggle(key: string) {
    setAvanzado(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const pendientesColor = useRef<Partial<ConfigState>>({})
  const timerColor = useRef<ReturnType<typeof setTimeout> | null>(null)

  function guardarColor<T extends 'colorPrimario' | 'colorSecundario'>(key: T, value: ConfigState[T]) {
    setConfig(prev => ({ ...prev, [key]: value }))
    pendientesColor.current[key] = value
    if (timerColor.current) clearTimeout(timerColor.current)
    timerColor.current = setTimeout(() => {
      const aGuardar = pendientesColor.current
      pendientesColor.current = {}
      guardarConfiguracion({ ...(aGuardar as Partial<ConfigState>) })
    }, 500)
  }

  function botonDesplegar(key: string, label: string) {
    const abierto = !!avanzado[key]
    return (
      <button
        type="button"
        onClick={() => toggle(key)}
        aria-label={abierto ? `Cerrar ${label}` : `Abrir ${label}`}
        className="grid w-7 h-7 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    )
  }

  const inputClase =
    'w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 text-sm'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Formulario</h2>
              <p className="text-xs text-slate-500">
                Todo lo que tus clientes ven y llenan al solicitar un envío.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            <Grupo>Lo que pide al cliente</Grupo>

            <Fila
              tour="formulario-cantidad"
              icon={<Package size={18} className="text-white" />}
              iconBg="bg-gradient-to-br from-teal-500 to-emerald-500"
              titulo="Solicitar cantidad de productos"
              desc="Pregunta cuántas prendas o paquetes incluye el pedido."
              derecha={
                <>
                  <AyudaLogisticaOpciones className="w-7 h-7" />
                  <Switch
                    checked={config.solicitarCantidadProductos}
                    onChange={(v) => guardarForm('solicitarCantidadProductos', v)}
                  />
                </>
              }
            />

            <Grupo>Lo que muestra</Grupo>

            <Fila
              tour="formulario-tracking"
              icon={<Truck size={18} className="text-white" />}
              iconBg="bg-gradient-to-br from-sky-500 to-blue-600"
              titulo="Mostrar tracking de pedidos"
              desc='El botón "¿Ya hiciste un pedido?" para consultar su estado.'
              derecha={
                <Switch
                  checked={config.mostrarTracking}
                  onChange={(v) => guardarForm('mostrarTracking', v)}
                />
              }
            />

            <Fila
              tour="formulario-mensaje"
              icon={<MessageCircle size={18} className="text-white" />}
              iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
              titulo="Mensaje de éxito"
              desc="Texto e imagen que ven después de hacer un pedido."
              derecha={botonDesplegar('mensaje', 'mensaje de éxito')}
              cuerpo={
                avanzado.mensaje && (
                  <div className="space-y-3">
                    <textarea
                      value={config.redirectMessage}
                      onChange={(e) => setConfig(prev => ({ ...prev, redirectMessage: e.target.value }))}
                      onBlur={() => guardarConfiguracion({ redirectMessage: config.redirectMessage })}
                      rows={3}
                      className={inputClase}
                      placeholder="Gracias por tu compra. En unos segundos te redirigiremos."
                    />
                    {config.redirectMessageImage ? (
                      <div>
                        <img
                          src={config.redirectMessageImage}
                          alt="Imagen del mensaje de éxito"
                          className="max-h-32 object-contain border border-slate-200 rounded-xl p-2 bg-white"
                        />
                        <button
                          onClick={() => {
                            setConfig(prev => ({ ...prev, redirectMessageImage: '', redirectMessageImageFile: null }))
                            guardarConfiguracion({ redirectMessageImage: '', redirectMessageImageFile: null })
                          }}
                          className="mt-2 text-xs font-semibold text-rose-600 underline hover:no-underline"
                        >
                          Quitar imagen
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0] || null
                          const cv = file ? await comprimirImagenWebP(file) : null
                          setConfig(prev => ({ ...prev, redirectMessageImageFile: cv }))
                          guardarConfiguracion({ redirectMessageImageFile: cv })
                        }}
                        className={`${inputClase} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-700 file:font-semibold file:text-sm`}
                      />
                    )}
                  </div>
                )
              }
            />

            <Fila
              tour="formulario-url"
              icon={<Link2 size={18} className="text-white" />}
              iconBg="bg-gradient-to-br from-rose-500 to-pink-500"
              titulo="URL de redirección"
              desc={
                isBasic ? 'Disponible en Pro y Business Plus.' : 'A dónde van tus clientes tras enviar el pedido.'
              }
              derecha={
                isBasic ? (
                  <button
                    onClick={onUpgrade}
                    className="shrink-0 text-xs font-semibold text-sky-600 underline hover:no-underline"
                  >
                    Ver planes
                  </button>
                ) : (
                  botonDesplegar('url', 'URL de redirección')
                )
              }
              cuerpo={
                !isBasic &&
                avanzado.url && (
                  <input
                    type="text"
                    value={config.redirectUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, redirectUrl: e.target.value }))}
                    onBlur={() => guardarConfiguracion({ redirectUrl: config.redirectUrl })}
                    placeholder="https://mipagina.com"
                    className={inputClase}
                  />
                )
              }
            />

            <Fila
              tour="formulario-colores"
              icon={<Palette size={18} className="text-white" />}
              iconBg="bg-gradient-to-br from-fuchsia-500 to-purple-500"
              titulo="Colores del formulario"
              desc="Personaliza el color principal y secundario de tu formulario."
              derecha={botonDesplegar('colores', 'colores')}
              cuerpo={
                avanzado.colores && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <SelectorColor
                      label="Color principal"
                      value={config.colorPrimario}
                      onChange={(v) => guardarColor('colorPrimario', v)}
                      onCommit={(v) => guardarColor('colorPrimario', v)}
                    />
                    <SelectorColor
                      label="Color secundario"
                      value={config.colorSecundario}
                      onChange={(v) => guardarColor('colorSecundario', v)}
                      onCommit={(v) => guardarColor('colorSecundario', v)}
                    />
                  </div>
                )
              }
            />

            <Grupo>Disponibilidad</Grupo>

            <Fila
              tour="formulario-cerrar"
              icon={<Power size={18} className="text-white" />}
              iconBg="bg-gradient-to-br from-rose-500 to-red-500"
              titulo="Deshabilitar el formulario"
              desc="Oculta el formulario y muestra solo un mensaje a tus clientes."
              derecha={
                <>
                  <AyudaCerrarFormulario className="w-7 h-7" />
                  <Switch
                    danger
                    checked={config.cerrarFormulario}
                    onChange={(v) => guardarForm('cerrarFormulario', v)}
                  />
                </>
              }
              cuerpo={
                config.cerrarFormulario && (
                  <div className="space-y-3 pt-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Mensaje para tus clientes
                      </label>
                      <textarea
                        value={config.cerradoFormularioMensaje}
                        onChange={(e) => setConfig(prev => ({ ...prev, cerradoFormularioMensaje: e.target.value }))}
                        onBlur={() => guardarConfiguracion({ cerradoFormularioMensaje: config.cerradoFormularioMensaje })}
                        rows={2}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 text-sm"
                        placeholder="Ej: Estamos en mantenimiento, volvemos pronto. ¡Gracias!"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">
                        Cerrar también estos días de la semana
                      </label>
                      <SelectorDias
                        value={config.cerrarFormularioDias}
                        onChange={(dias) => guardarForm('cerrarFormularioDias', dias)}
                      />
                      <p className="mt-2 text-xs text-slate-400">
                        Alcanza con que se cumpla una condición (hora de corte o día marcado) para que el formulario esté cerrado.
                      </p>
                    </div>
                  </div>
                )
              }
            />
          </div>
        </div>

        <VistaPreviaFormulario
          userId={userId}
          config={config}
          plan={plan}
          distritosMotorizado={distritosMotorizado}
        />
      </div>
    </div>
  )
}