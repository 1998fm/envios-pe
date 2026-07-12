'use client'

import type { ConfigState } from '@/types/config'
import agenciasShalom from '@/data/agencias-shalom.json'

type Props = {
  config: ConfigState
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void
}

export default function OnboardingStep1Empresa({ config, upd }: Props) {
  return (
    <div className="space-y-6">
      <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
          Datos del negocio
        </h3>
        <input
          type="text"
          placeholder="Nombre del negocio *"
          value={config.empresa}
          onChange={(e) => upd('empresa', e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 mb-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
        />
        <input
          type="text"
          placeholder="Teléfono *"
          value={config.telefonoEmpresa}
          onChange={(e) => upd('telefonoEmpresa', e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 mb-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
        />
        <input
          type="text"
          placeholder="Dirección (opcional)"
          value={config.direccionEmpresa}
          onChange={(e) => upd('direccionEmpresa', e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
        />
      </div>

      <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
        <label className="block font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Agencia de origen (Shalom)
        </label>
        <select
          value={config.nuevoOrigen}
          onChange={(e) => upd('nuevoOrigen', e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        >
          <option value="">Selecciona una agencia</option>
          {agenciasShalom.map((agencia: string) => (
            <option key={agencia} value={agencia}>{agencia}</option>
          ))}
        </select>
      </div>

      <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
        <label className="block font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Logo del negocio
        </label>
        {config.logoUrl && (
          <img
            src={config.logoUrl}
            alt="Logo"
            className="h-20 object-contain mb-3 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-700"
          />
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => upd('logoFile', e.target.files?.[0] || null)}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-sky-100 dark:file:bg-sky-900 file:text-sky-700 dark:file:text-sky-300 file:font-semibold file:text-sm"
        />
      </div>
    </div>
  )
}
