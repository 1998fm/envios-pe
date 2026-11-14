"use client";

import type { ConfigState } from "@/types/config";
import TutorialConfiguracion from "./TutorialConfiguracion";
import TarifasEditor from "@/components/TarifasEditor";
import distritosMoto from "@/data/distritos-moto.json";

type Props = {
  config: ConfigState;
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
};

export default function OnboardingStep4Tarifas({ config, upd }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Cobertura y tarifas de Motorizado
          </h3>
          <TutorialConfiguracion vista="TARIFAS" region={config.motoRegion} />
        </div>
        <p className="text-sm text-slate-500">
          Elige Lima o Provincia, revisa los distritos que atiendes y sus
          tarifas. Retira los que no cubres. Estos importes son del reparto, no
          del precio de tus productos.
        </p>
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
  );
}
