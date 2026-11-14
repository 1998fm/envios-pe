"use client";

import type { Dispatch, SetStateAction } from "react";
import type { ConfigState } from "@/types/config";
import ConfiguracionMetodo from "@/components/ConfiguracionMetodo";
import TutorialConfiguracion from "./TutorialConfiguracion";

type Props = {
  basico?: boolean;
  config: ConfigState;
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
};

function setter<K extends keyof ConfigState>(
  upd: Props["upd"],
  key: K,
  config: ConfigState,
): Dispatch<SetStateAction<ConfigState[K]>> {
  return (value) =>
    upd(
      key,
      typeof value === "function"
        ? (value as (prev: ConfigState[K]) => ConfigState[K])(config[key])
        : value,
    );
}

export default function OnboardingStep3Logistica({
  config,
  upd,
  basico = false,
}: Props) {
  const hayAgencias =
    config.metodoShalom ||
    config.metodoOlva ||
    config.metodoMarvisur ||
    config.metodoFlores ||
    config.metodoOtro;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Horarios y disponibilidad
        </h3>
        <p className="text-sm text-slate-500">
          Elige los días que realmente atiendes y con cuánta anticipación deben
          pedir. En agencias, configura tus días de despacho; la llegada depende
          del courier.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <TutorialConfiguracion vista="LOGISTICA" region={config.motoRegion} />
          <span className="text-xs text-slate-400 font-medium">
            Ver explicación paso a paso (opcional)
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {config.metodoMotorizado && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-700">
                M
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Motorizado</h4>
                <p className="text-xs text-slate-500">Reparto local</p>
              </div>
            </div>
            <ConfiguracionMetodo
              compacto
              bloqueado={basico}
              onUpgrade={() =>
                window.open("/#precios", "_blank", "noopener,noreferrer")
              }
              dias={config.logisticaMotoDias}
              setDias={setter(upd, "logisticaMotoDias", config)}
              usaHora={config.logisticaMotoUsaHoraCorte}
              setUsaHora={setter(upd, "logisticaMotoUsaHoraCorte", config)}
              hora={config.logisticaMotoHoraCorte}
              setHora={setter(upd, "logisticaMotoHoraCorte", config)}
              anticipacion={config.logisticaMotoAnticipacion}
              setAnticipacion={setter(upd, "logisticaMotoAnticipacion", config)}
              soloHabiles={config.logisticaMotoAnticipacionSoloHabiles}
              setSoloHabiles={setter(
                upd,
                "logisticaMotoAnticipacionSoloHabiles",
                config,
              )}
              limitar={config.logisticaMotoLimitar}
              setLimitar={setter(upd, "logisticaMotoLimitar", config)}
              cupo={config.logisticaMotoCupo}
              setCupo={setter(upd, "logisticaMotoCupo", config)}
            />
          </div>
        )}

        {hayAgencias && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                A
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Agencias</h4>
                <p className="text-xs text-slate-500">Shalom, Olva y otras</p>
              </div>
            </div>
            <ConfiguracionMetodo
              compacto
              bloqueado={basico}
              onUpgrade={() =>
                window.open("/#precios", "_blank", "noopener,noreferrer")
              }
              dias={config.logisticaAgenciasDias}
              setDias={setter(upd, "logisticaAgenciasDias", config)}
              usaHora={config.logisticaAgenciasUsaHoraCorte}
              setUsaHora={setter(upd, "logisticaAgenciasUsaHoraCorte", config)}
              hora={config.logisticaAgenciasHoraCorte}
              setHora={setter(upd, "logisticaAgenciasHoraCorte", config)}
              anticipacion={config.logisticaAgenciasAnticipacion}
              setAnticipacion={setter(
                upd,
                "logisticaAgenciasAnticipacion",
                config,
              )}
              soloHabiles={config.logisticaAgenciasAnticipacionSoloHabiles}
              setSoloHabiles={setter(
                upd,
                "logisticaAgenciasAnticipacionSoloHabiles",
                config,
              )}
              limitar={config.logisticaAgenciasLimitar}
              setLimitar={setter(upd, "logisticaAgenciasLimitar", config)}
              cupo={config.logisticaAgenciasCupo}
              setCupo={setter(upd, "logisticaAgenciasCupo", config)}
              nombreMetodoOtro={config.nombreMetodoOtro}
              setNombreMetodoOtro={setter(upd, "nombreMetodoOtro", config)}
              mostrarNombreMetodo={config.metodoOtro}
            />
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">¿Cómo funciona?</p>
        <p className="text-xs mt-1">
          Primero elige tus días y la anticipación mínima. La hora de corte, los
          días hábiles y el cupo son opcionales. Si activas corte, los pedidos
          recibidos después suman un día a la anticipación y se busca la
          siguiente fecha habilitada. Revisa el ejemplo en la guía antes de
          compartir tu formulario.
        </p>
      </div>
    </div>
  );
}
