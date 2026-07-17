'use client'

import type { ConfigState } from '@/types/config'
import { Upload, Store, Phone, MapPin } from 'lucide-react'

type Props = {
  config: ConfigState
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void
}

export default function OnboardingStep1Empresa({ config, upd }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Tu negocio</h3>
        <p className="text-sm text-slate-500">Así te verán tus clientes cuando llenen su pedido.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
            <Store size={16} className="text-sky-600" />
            Nombre del negocio
          </label>
          <input
            type="text"
            placeholder="Ej: Boutique María"
            value={config.empresa}
            onChange={(e) => upd('empresa', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
          <p className="text-xs text-slate-400 mt-1">Este nombre aparecerá en el formulario de pedidos de tus clientes.</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
            <Phone size={16} className="text-sky-600" />
            Teléfono
          </label>
          <input
            type="text"
            placeholder="Ej: 999 888 777"
            value={config.telefonoEmpresa}
            onChange={(e) => upd('telefonoEmpresa', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
          <p className="text-xs text-slate-400 mt-1">Para que tus clientes puedan contactarte.</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
            <MapPin size={16} className="text-sky-600" />
            Dirección
          </label>
          <input
            type="text"
            placeholder="Dirección de tu negocio (opcional)"
            value={config.direccionEmpresa}
            onChange={(e) => upd('direccionEmpresa', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
          <Upload size={16} className="text-sky-600" />
          Logo del negocio
        </label>
        {config.logoUrl && (
          <img
            src={config.logoUrl}
            alt="Logo"
            className="h-20 object-contain mb-3 border border-slate-200 rounded-xl p-2 bg-white"
          />
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => upd('logoFile', e.target.files?.[0] || null)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-sky-100 file:text-sky-700 file:font-semibold file:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
        <p className="text-xs text-slate-400 mt-1">Se mostrará en tu formulario público. Recomendado: 200×200px.</p>
      </div>
    </div>
  )
}
