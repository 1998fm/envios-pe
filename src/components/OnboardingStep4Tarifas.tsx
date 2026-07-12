'use client'

import type { ConfigState } from '@/types/config'
import distritosMoto from '@/data/distritos-moto.json'

type Props = {
  config: ConfigState
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void
}

export default function OnboardingStep4Tarifas({ config, upd }: Props) {
  return (
    <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
        Tarifas motorizado
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Define cuánto cobrar por cada distrito. Tus clientes verán el costo exacto al llenar el formulario.
      </p>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {distritosMoto.map((distrito: string) => (
          <div
            key={distrito}
            className="flex items-center justify-between gap-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3"
          >
            <div className="font-medium text-slate-700 dark:text-slate-300 text-sm">
              {distrito}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 text-sm">S/</span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={config.tarifas[distrito] || ''}
                onChange={(e) =>
                  upd('tarifas', { ...config.tarifas, [distrito]: e.target.value })
                }
                className="w-24 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-right bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
