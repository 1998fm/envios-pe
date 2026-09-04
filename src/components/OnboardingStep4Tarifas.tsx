'use client'

import type { ConfigState } from '@/types/config'
import TarifasEditor from '@/components/TarifasEditor'
import distritosMoto from '@/data/distritos-moto.json'

type Props = {
  config: ConfigState
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void
}

export default function OnboardingStep4Tarifas({ config, upd }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Precios de envío</h3>
        <p className="text-sm text-slate-500">Define cuánto cobrarás por distrito para reparto motorizado.</p>
      </div>

      {config.metodoMotorizado ? (
        <TarifasEditor
          config={config}
          upd={upd}
          distritosMoto={distritosMoto}
        />
      ) : (
        <p className="text-sm text-slate-400">
          Activa Motorizado en el paso anterior para configurar precios.
        </p>
      )}
    </div>
  )
}