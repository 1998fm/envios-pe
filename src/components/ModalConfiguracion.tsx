'use client'

import Modal from '@/components/ui/Modal'
import ConfiguracionMetodo from '@/components/ConfiguracionMetodo'
import agenciasShalom from '@/data/agencias-shalom.json'
import { ConfigModalProps } from '@/types/config'

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
            <>
              <div className="mb-8 p-5 border border-slate-200  rounded-2xl bg-slate-50 ">
                <h3 className="text-lg font-bold text-slate-900  mb-4">
                  Datos de empresa
                </h3>
                <input
                  type="text"
                  placeholder="Nombre empresa"
                  value={config.empresa}
                  onChange={(e) => upd('empresa', e.target.value)}
                  className="w-full border border-slate-200  rounded-xl px-4 py-3 mb-3 bg-white  text-slate-900  placeholder-slate-400"
                />
                <input
                  type="text"
                  placeholder="Teléfono empresa"
                  value={config.telefonoEmpresa}
                  onChange={(e) => upd('telefonoEmpresa', e.target.value)}
                  className="w-full border border-slate-200  rounded-xl px-4 py-3 mb-3 bg-white  text-slate-900  placeholder-slate-400"
                />
                <input
                  type="text"
                  placeholder="Dirección empresa"
                  value={config.direccionEmpresa}
                  onChange={(e) => upd('direccionEmpresa', e.target.value)}
                  className="w-full border border-slate-200  rounded-xl px-4 py-3 bg-white  text-slate-900  placeholder-slate-400"
                />
              </div>

              <div className="mt-6 p-5 border border-slate-200  rounded-2xl bg-slate-50 ">
                <label className="block font-semibold text-slate-900  mb-3">
                  Agencia de origen (Shalom)
                </label>
                <select
                  value={config.nuevoOrigen}
                  onChange={(e) => upd('nuevoOrigen', e.target.value)}
                  className="w-full border border-slate-200  rounded-xl px-4 py-3 bg-white  text-slate-900 "
                >
                  <option value="">Selecciona una agencia</option>
                  {agenciasShalom.map((agencia: string) => (
                    <option key={agencia} value={agencia}>{agencia}</option>
                  ))}
                </select>
              </div>

              {!isBasic && (
              <div className="mt-6">
                <label className="block mb-2 font-medium text-slate-900 ">
                  Logo del negocio
                </label>
                  {config.logoUrl && (
                    <img
                      src={config.logoUrl}
                      alt="Logo"
                      className="h-20 object-contain mb-3 border border-slate-200  rounded-xl p-2 bg-white "
                    />
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => upd('logoFile', e.target.files?.[0] || null)}
                    className="w-full border border-slate-200  rounded-xl px-4 py-3 bg-white  text-slate-900  file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-sky-100 :bg-sky-900 file:text-sky-700 :text-sky-300 file:font-semibold file:text-sm"
                  />
                </div>
              )}

              <label className="block mt-4 mb-2 font-medium text-slate-900 ">
                Mensaje de éxito
              </label>
              <textarea
                value={config.redirectMessage}
                onChange={(e) => upd('redirectMessage', e.target.value)}
                rows={4}
                className="w-full border border-slate-200  rounded-xl px-4 py-3 bg-white  text-slate-900  placeholder-slate-400"
                placeholder="Gracias por tu compra.\n\nEn unos segundos te llevaremos a nuestro canal oficial."
              />

              {!isBasic && (
                <div className="mt-6">
                  <label className="block mb-2 font-medium text-slate-900 ">
                    URL de redirección
                  </label>
                  <input
                    type="text"
                    value={config.redirectUrl}
                    onChange={(e) => upd('redirectUrl', e.target.value)}
                    placeholder="https://mipagina.com"
                    className="w-full border border-slate-200  rounded-xl px-4 py-3 bg-white  text-slate-900  placeholder-slate-400"
                  />
                </div>
              )}

              {!isBasic && (
                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900  mb-3">
                    Redes sociales
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Instagram', key: 'instagramUrl' as const, value: config.instagramUrl },
                      { label: 'Facebook', key: 'facebookUrl' as const, value: config.facebookUrl },
                      { label: 'TikTok', key: 'tiktokUrl' as const, value: config.tiktokUrl },
                      { label: 'Página web', key: 'webUrl' as const, value: config.webUrl },
                      { label: 'WhatsApp', key: 'whatsappUrl' as const, value: config.whatsappUrl },
                    ].map((field) => (
                      <input
                        key={field.key}
                        type="text"
                        placeholder={field.label}
                        value={field.value}
                        onChange={(e) => upd(field.key, e.target.value)}
                        className="w-full border border-slate-200  rounded-xl px-4 py-3 bg-white  text-slate-900  placeholder-slate-400"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {config.vistaConfig === 'METODOS' && (
            <div className="p-5 border border-slate-200  rounded-2xl bg-slate-50 ">
              <h3 className="text-lg font-bold text-slate-900  mb-2">
                Métodos de envío
              </h3>
              <p className="text-sm text-slate-500  mb-6">
                {isBasic
                  ? 'Selecciona hasta 2 métodos de envío para ofrecer a tus clientes.'
                  : 'Activa los métodos que ofrecerás a tus clientes.'}
              </p>

              <div className="space-y-4">
                {([
                  { key: 'metodoMotorizado' as const, label: 'Motorizado' },
                  { key: 'metodoShalom' as const, label: 'Shalom' },
                  { key: 'metodoOlva' as const, label: 'Olva' },
                  { key: 'metodoMarvisur' as const, label: 'Marvisur' },
                  { key: 'metodoFlores' as const, label: 'Flores' },
                  { key: 'metodoOtro' as const, label: 'Otro método' },
                ] as const).map((item) => {
                  const metodosActivos = [
                    config.metodoMotorizado,
                    config.metodoShalom,
                    config.metodoOlva,
                    config.metodoMarvisur,
                    config.metodoFlores,
                    config.metodoOtro,
                  ].filter(Boolean).length

                  const checked = config[item.key]
                  const disabled = isBasic && !checked && metodosActivos >= 2

                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={(e) => upd(item.key, e.target.checked)}
                        className="accent-sky-600 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-900 ">{item.label}</span>
                    </label>
                  )
                })}

                {config.metodoOtro && (
                  <div className="ml-7 mt-4 rounded-2xl border border-slate-200  bg-white  p-6">
                    <label className="block font-semibold text-slate-900  mb-3">
                      Nombre del método
                    </label>
                    <input
                      type="text"
                      value={config.nombreMetodoOtro}
                      onChange={(e) => upd('nombreMetodoOtro', e.target.value)}
                      placeholder="Ej. Cruz del Sur"
                      className="w-full border border-slate-200  rounded-xl px-4 py-3 bg-white  text-slate-900  placeholder-slate-400"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {config.vistaConfig === 'LOGISTICA' && !isBasic && (
            <div className="space-y-8">
              <div className="bg-white  border border-slate-200  rounded-3xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 ">
                  Control logístico
                </h2>
                <p className="text-sm text-slate-500  mt-2">
                  Configura días de atención, horarios de corte y cupo diario.
                </p>

                <div className="mt-8 space-y-6">
                  {config.metodoMotorizado && (
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900  mb-4">Motorizado</h3>
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
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900  mb-4">Agencias</h3>
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
            <div className="p-5 border border-slate-200  rounded-2xl bg-slate-50 ">
              <h3 className="text-lg font-bold text-slate-900  mb-2">
                Tarifas motorizado
              </h3>
              <p className="text-sm text-slate-500  mb-6">
                Define cuánto cobrar por cada distrito.
              </p>
              <div className="space-y-3">
                {distritosMoto.map((distrito: string) => (
                  <div
                    key={distrito}
                    className="flex items-center justify-between gap-4 bg-white  border border-slate-200  rounded-xl px-4 py-3"
                  >
                    <div className="font-medium text-slate-700 ">
                      {distrito}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500  text-sm">S/</span>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        value={config.tarifas[distrito] || ''}
                        onChange={(e) =>
                          upd('tarifas', { ...config.tarifas, [distrito]: e.target.value })
                        }
                        className="w-24 border border-slate-200  rounded-lg px-3 py-2 text-right bg-white  text-slate-900 "
                      />
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
