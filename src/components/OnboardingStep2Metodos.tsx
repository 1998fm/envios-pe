'use client'

import type { ConfigState } from '@/types/config'
import agenciasShalom from '@/data/agencias-shalom.json'
import { Bike, Truck, Package, Ship, Flower2, Plus } from 'lucide-react'

type Props = {
  config: ConfigState
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void
}

const metodos = [
  { key: 'metodoMotorizado' as const, label: 'Motorizado', icon: Bike, desc: 'Reparto local en moto' },
  { key: 'metodoShalom' as const, label: 'Shalom', icon: Truck, desc: 'Envíos nacionales vía Shalom' },
  { key: 'metodoOlva' as const, label: 'Olva', icon: Package, desc: 'Envíos nacionales vía Olva' },
  { key: 'metodoMarvisur' as const, label: 'Marvisur', icon: Ship, desc: 'Envíos nacionales vía Marvisur' },
  { key: 'metodoFlores' as const, label: 'Flores', icon: Flower2, desc: 'Envíos nacionales vía Flores' },
  { key: 'metodoOtro' as const, label: 'Otro método', icon: Plus, desc: 'Cualquier otra agencia que uses' },
]

export default function OnboardingStep2Metodos({ config, upd }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Métodos de envío</h3>
        <p className="text-sm text-slate-500">Activa los métodos que ofreces. Tus clientes elegirán el que prefieran.</p>
      </div>

      <div className="space-y-3">
        {metodos.map((item) => {
          const Icon = item.icon
          return (
            <label
              key={item.key}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                config[item.key]
                  ? 'border-sky-500 bg-sky-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={config[item.key]}
                onChange={(e) => upd(item.key, e.target.checked)}
                className="accent-sky-600 w-4 h-4 shrink-0"
              />
              <Icon size={22} className={`shrink-0 ${config[item.key] ? 'text-sky-600' : 'text-slate-400'}`} />
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
            className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
      )}

      {config.metodoShalom && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <label className="block font-semibold text-slate-900 mb-2 text-sm">
            Agencia Shalom de origen
          </label>
          <p className="text-xs text-slate-500 mb-3">¿Desde qué agencia Shalom envías tus pedidos?</p>
          <select
            value={config.nuevoOrigen}
            onChange={(e) => upd('nuevoOrigen', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          >
            <option value="">Selecciona una agencia</option>
            {agenciasShalom.map((agencia: string) => (
              <option key={agencia} value={agencia}>{agencia}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
