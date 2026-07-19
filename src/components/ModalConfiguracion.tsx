'use client'

import Modal from '@/components/ui/Modal'
import ConfiguracionMetodo from '@/components/ConfiguracionMetodo'
import agenciasShalom from '@/data/agencias-shalom.json'
import { ConfigModalProps } from '@/types/config'
import { Bike, Building2, Truck, Ship, Flower2, Package, Plus, Store, Building, Phone, MapPin, Image, MessageCircle, Link2, Globe, Clock, DollarSign, Camera, Music, ExternalLink } from 'lucide-react'

export default function ModalConfiguracion({
  abierto, onCerrar,
  config, setConfig,
  distritosMoto, guardarConfiguracion, plan = 'basic', onUpgrade,
}: ConfigModalProps & { onUpgrade?: () => void }) {
  if (!abierto) return null

  const isBasic = plan === 'basic'

  const tabs = [
    { key: 'EMPRESA', label: 'Empresa' },
    { key: 'METODOS', label: 'Métodos' },
    ...(!isBasic ? [{ key: 'LOGISTICA' as const, label: 'Logística' }] : []),
    ...(!isBasic ? [{ key: 'TARIFAS' as const, label: 'Tarifas' }] : []),
  ]

  function upd<K extends keyof typeof config>(key: K, value: (typeof config)[K]) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  function setter<K extends keyof typeof config>(key: K): React.Dispatch<React.SetStateAction<(typeof config)[K]>> {
    return (value) => setConfig(prev => ({
      ...prev,
      [key]: typeof value === 'function' ? (value as (prev: (typeof config)[K]) => (typeof config)[K])(prev[key]) : value,
    }))
  }

  return (
    <Modal open={abierto} maxWidth="max-w-4xl">
      <div className="flex flex-col h-[90vh]">
        <div className="p-6 border-b border-slate-100  shrink-0 bg-white ">
          <h2 className="text-2xl font-bold text-slate-900 ">
            Configuración
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white ">
          <div className="flex gap-2 mb-6 bg-slate-100  p-2 rounded-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => upd('vistaConfig', tab.key)}
                className={`flex-1 py-2 rounded-xl font-medium transition text-sm ${
                  config.vistaConfig === tab.key
                    ? 'bg-white  shadow text-slate-900 '
                    : 'text-slate-500 '
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {config.vistaConfig === 'EMPRESA' && (
            <div className="space-y-6">
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
                    <Building size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Datos del negocio</h3>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Nombre del negocio" value={config.empresa}
                      onChange={(e) => upd('empresa', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400" />
                  </div>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Teléfono" value={config.telefonoEmpresa}
                      onChange={(e) => upd('telefonoEmpresa', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400" />
                  </div>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Dirección (opcional)" value={config.direccionEmpresa}
                      onChange={(e) => upd('direccionEmpresa', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400" />
                  </div>
                </div>
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Building2 size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Agencia de origen (Shalom)</h3>
                </div>
                <select value={config.nuevoOrigen}
                  onChange={(e) => upd('nuevoOrigen', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900">
                  <option value="">Selecciona una agencia</option>
                  {agenciasShalom.map((agencia: string) => (
                    <option key={agencia} value={agencia}>{agencia}</option>
                  ))}
                </select>
              </div>

              {!isBasic && (
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <Image size={18} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Logo del negocio</h3>
                  </div>
                  {config.logoUrl && (
                    <img src={config.logoUrl} alt="Logo"
                      className="h-20 object-contain mb-3 border border-slate-200 rounded-xl p-2 bg-white" />
                  )}
                  <input type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => upd('logoFile', e.target.files?.[0] || null)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-sky-100 file:text-sky-700 file:font-semibold file:text-sm" />
                </div>
              )}

              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <MessageCircle size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Mensaje de éxito</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">Este mensaje verán tus clientes después de hacer un pedido.</p>
                <textarea value={config.redirectMessage}
                  onChange={(e) => upd('redirectMessage', e.target.value)} rows={4}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400"
                  placeholder="Gracias por tu compra. En unos segundos te redirigiremos." />
              </div>

              {!isBasic && (
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                      <Link2 size={18} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">URL de redirección</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">Después del pedido, redirige a tus clientes a esta página.</p>
                  <input type="text" value={config.redirectUrl}
                    onChange={(e) => upd('redirectUrl', e.target.value)}
                    placeholder="https://mipagina.com"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400" />
                </div>
              )}

              {!isBasic && (
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <Globe size={18} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Redes sociales</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">Aparecerán en el formulario de tus clientes.</p>
                  <div className="space-y-3">
                    {[
                      { icon: Camera, label: 'Instagram', key: 'instagramUrl' as const, value: config.instagramUrl },
                      { icon: Globe, label: 'Facebook', key: 'facebookUrl' as const, value: config.facebookUrl },
                      { icon: Music, label: 'TikTok', key: 'tiktokUrl' as const, value: config.tiktokUrl },
                      { icon: ExternalLink, label: 'Página web', key: 'webUrl' as const, value: config.webUrl },
                      { icon: MessageCircle, label: 'WhatsApp', key: 'whatsappUrl' as const, value: config.whatsappUrl },
                    ].map((field) => {
                      const Icon = field.icon
                      return (
                        <div key={field.key} className="relative">
                          <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder={field.label} value={field.value}
                            onChange={(e) => upd(field.key, e.target.value)}
                            className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {config.vistaConfig === 'METODOS' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Métodos de envío</h3>
                <p className="text-sm text-slate-500">
                  {isBasic
                    ? 'Selecciona hasta 2 métodos de envío para ofrecer a tus clientes.'
                    : 'Activa los métodos que ofrecerás a tus clientes.'}
                </p>
              </div>

              <div className="space-y-3">
                {([
                  { key: 'metodoMotorizado' as const, label: 'Motorizado', icon: Bike, desc: 'Reparto local en moto' },
                  { key: 'metodoShalom' as const, label: 'Shalom', icon: Building2, desc: 'Envíos nacionales vía Shalom' },
                  { key: 'metodoOlva' as const, label: 'Olva', icon: Package, desc: 'Envíos nacionales vía Olva' },
                  { key: 'metodoMarvisur' as const, label: 'Marvisur', icon: Ship, desc: 'Envíos nacionales vía Marvisur' },
                  { key: 'metodoFlores' as const, label: 'Flores', icon: Flower2, desc: 'Envíos nacionales vía Flores' },
                  { key: 'metodoOtro' as const, label: 'Otro método', icon: Plus, desc: 'Cualquier otra agencia que uses' },
                  { key: 'metodoRecojo' as const, label: 'Recojo en tienda', icon: Store, desc: 'Tus clientes recogen en tu local' },
                ] as const).map((item) => {
                  const metodosActivos = [
                    config.metodoMotorizado,
                    config.metodoShalom,
                    config.metodoOlva,
                    config.metodoMarvisur,
                    config.metodoFlores,
                    config.metodoOtro,
                    config.metodoRecojo,
                  ].filter(Boolean).length

                  const checked = config[item.key]
                  const disabled = isBasic && !checked && metodosActivos >= 2
                  const Icon = item.icon

                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        disabled
                          ? 'opacity-40 cursor-not-allowed border-slate-200 bg-white'
                          : checked
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={(e) => upd(item.key, e.target.checked)}
                        className="accent-sky-600 w-4 h-4 shrink-0"
                      />
                      <Icon size={22} className={`shrink-0 ${checked ? 'text-sky-600' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </label>
                  )
                })}
              </div>

              {config.metodoOtro && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <label className="block font-semibold text-slate-900 mb-2 text-sm">
                    Nombre del otro método
                  </label>
                  <input
                    type="text"
                    value={config.nombreMetodoOtro}
                    onChange={(e) => upd('nombreMetodoOtro', e.target.value)}
                    placeholder="Ej: Cruz del Sur"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400"
                  />
                </div>
              )}

              {config.metodoRecojo && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <label className="block font-semibold text-slate-900 mb-2 text-sm">
                    Mensaje para tus clientes al elegir Recojo en tienda
                  </label>
                  <textarea
                    value={config.mensajeRecojo}
                    onChange={(e) => upd('mensajeRecojo', e.target.value)}
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400"
                    placeholder="Recoge tu pedido en nuestra tienda. Te esperamos!"
                  />
                </div>
              )}
            </div>
          )}

          {config.vistaConfig === 'LOGISTICA' && !isBasic && (
            <div className="space-y-6">
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Clock size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Control logístico</h3>
                    <p className="text-xs text-slate-500">Configura días de atención, horarios de corte y cupo diario.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {config.metodoMotorizado && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Bike size={18} className="text-sky-600" />
                        <h4 className="font-semibold text-slate-900">Motorizado</h4>
                      </div>
                      <ConfiguracionMetodo
                        dias={config.logisticaMotoDias}
                        setDias={setter('logisticaMotoDias')}
                        usaHora={config.logisticaMotoUsaHoraCorte}
                        setUsaHora={setter('logisticaMotoUsaHoraCorte')}
                        hora={config.logisticaMotoHoraCorte}
                        setHora={setter('logisticaMotoHoraCorte')}
                        limitar={config.logisticaMotoLimitar}
                        setLimitar={setter('logisticaMotoLimitar')}
                        cupo={config.logisticaMotoCupo}
                        setCupo={setter('logisticaMotoCupo')}
                      />
                    </div>
                  )}

                  {(() => {
                    const hayAgencias =
                      config.metodoShalom || config.metodoOlva || config.metodoMarvisur || config.metodoFlores || config.metodoOtro
                    return hayAgencias && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Truck size={18} className="text-indigo-600" />
                          <h4 className="font-semibold text-slate-900">Agencias</h4>
                        </div>
                        <ConfiguracionMetodo
                          dias={config.logisticaAgenciasDias}
                          setDias={setter('logisticaAgenciasDias')}
                          usaHora={config.logisticaAgenciasUsaHoraCorte}
                          setUsaHora={setter('logisticaAgenciasUsaHoraCorte')}
                          hora={config.logisticaAgenciasHoraCorte}
                          setHora={setter('logisticaAgenciasHoraCorte')}
                          limitar={config.logisticaAgenciasLimitar}
                          setLimitar={setter('logisticaAgenciasLimitar')}
                          cupo={config.logisticaAgenciasCupo}
                          setCupo={setter('logisticaAgenciasCupo')}
                          nombreMetodoOtro={config.nombreMetodoOtro}
                          setNombreMetodoOtro={setter('nombreMetodoOtro')}
                          mostrarNombreMetodo={config.metodoOtro}
                        />
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

          {isBasic && (
            <div className="mt-6 rounded-2xl border border-amber-200  bg-amber-50  p-5 text-center">
              <p className="text-sm font-semibold text-amber-800 ">
                ¿Necesitas más funciones?
              </p>
              <p className="text-xs text-amber-700  mt-1">
                Actualiza a Pro y obtén logo personalizado, redes sociales, tarifas, control logístico y más.
              </p>
              <button
                onClick={onUpgrade}
                className="inline-block mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg transition-all duration-200"
              >
                Ver planes
              </button>
            </div>
          )}

          {config.vistaConfig === 'TARIFAS' && (
            <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <DollarSign size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Tarifas motorizado</h3>
                  <p className="text-xs text-slate-500">Define cuánto cobrar por cada distrito.</p>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {distritosMoto.map((distrito: string) => (
                  <div key={distrito}
                    className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-sky-200 transition-colors">
                    <div className="font-medium text-slate-700 text-sm">{distrito}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">S/</span>
                      <input type="number" min="0" step="0.50"
                        value={config.tarifas[distrito] || ''}
                        onChange={(e) => upd('tarifas', { ...config.tarifas, [distrito]: e.target.value })}
                        className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-right bg-white text-slate-900" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100  bg-white  p-6 shrink-0 flex justify-end gap-3">
          <button
            onClick={onCerrar}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white  border border-slate-200  text-slate-700  hover:bg-slate-50 :bg-slate-600 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={guardarConfiguracion}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  )
}
