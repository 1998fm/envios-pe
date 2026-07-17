'use client'

import { useState } from 'react'
import type { ConfigState } from '@/types/config'
import distritosMoto from '@/data/distritos-moto.json'
import { Search, DollarSign } from 'lucide-react'

type Props = {
  config: ConfigState
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void
}

export default function OnboardingStep4Tarifas({ config, upd }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [precioUnico, setPrecioUnico] = useState('')
  const [usarPrecioUnico, setUsarPrecioUnico] = useState(false)

  const filtrados = distritosMoto.filter((d: string) =>
    d.toLowerCase().includes(busqueda.toLowerCase())
  )

  function aplicarPrecioUnico() {
    const val = parseFloat(precioUnico)
    if (isNaN(val) || val <= 0) return
    const nuevas: Record<string, string> = {}
    distritosMoto.forEach((d: string) => { nuevas[d] = String(val) })
    upd('tarifas', nuevas)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Precios de envío</h3>
        <p className="text-sm text-slate-500">Define cuánto cobrarás por distrito para reparto motorizado.</p>
      </div>

      {config.metodoMotorizado && (
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-sky-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Precio único para todos los distritos</p>
              <p className="text-xs text-slate-500">Si cobras lo mismo en todos lados, usa esta opción.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              type="number"
              min="0"
              step="0.50"
              value={precioUnico}
              onChange={(e) => setPrecioUnico(e.target.value)}
              placeholder="S/ 10.00"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <button
              onClick={aplicarPrecioUnico}
              disabled={!precioUnico}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white disabled:opacity-50 hover:shadow-lg transition-all duration-200"
            >
              Aplicar a todos
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar distrito..."
            className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
        <div className="mt-3 space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {filtrados.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin resultados</p>
          ) : (
            filtrados.map((distrito: string) => (
              <div
                key={distrito}
                className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-slate-300 transition-colors"
              >
                <span className="font-medium text-slate-700 text-sm">{distrito}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-sm">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={config.tarifas[distrito] || ''}
                    onChange={(e) =>
                      upd('tarifas', { ...config.tarifas, [distrito]: e.target.value })
                    }
                    className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-right bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {config.metodoMotorizado ? `${filtrados.length} de ${distritosMoto.length} distritos` : 'Activa Motorizado en el paso anterior para configurar precios.'}
        </p>
      </div>
    </div>
  )
}
