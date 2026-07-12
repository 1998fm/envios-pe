'use client'

import type { ConfigState } from '@/types/config'

type Props = {
  config: ConfigState
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void
}

const metodos = [
  { key: 'metodoMotorizado' as const, label: 'Motorizado' },
  { key: 'metodoShalom' as const, label: 'Shalom' },
  { key: 'metodoOlva' as const, label: 'Olva' },
  { key: 'metodoMarvisur' as const, label: 'Marvisur' },
  { key: 'metodoFlores' as const, label: 'Flores' },
  { key: 'metodoOtro' as const, label: 'Otro método' },
]

export default function OnboardingStep2Metodos({ config, upd }: Props) {
  return (
    <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
        Métodos de envío
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Activa todos los métodos de envío que ofrece tu negocio. Tus clientes elegirán el que prefieran al hacer su pedido.
      </p>

      <div className="space-y-4">
        {metodos.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-3 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={config[item.key]}
              onChange={(e) => upd(item.key, e.target.checked)}
              className="accent-sky-600 w-4 h-4"
            />
            <span className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
          </label>
        ))}

        {config.metodoOtro && (
          <div className="ml-7 mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 p-6">
            <label className="block font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Nombre del método
            </label>
            <input
              type="text"
              value={config.nombreMetodoOtro}
              onChange={(e) => upd('nombreMetodoOtro', e.target.value)}
              placeholder="Ej. Cruz del Sur"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        )}
      </div>
    </div>
  )
}
