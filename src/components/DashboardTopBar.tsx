'use client'

import LogoTori from '@/components/LogoTori'

type Props = {
  logoUrl?: string | null
  plan?: string
  diasRestantes?: number | null
  onCompartir: () => void
  onConfig: () => void
  onUpgrade: () => void
}

export default function DashboardTopBar({ logoUrl, plan, diasRestantes, onCompartir, onConfig, onUpgrade }: Props) {
  const isTrial = diasRestantes != null && plan === 'pro'

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 px-4 sm:px-6">
        <div className="flex items-center gap-3 shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 sm:h-12 max-w-[180px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <LogoTori size={32} />
              <h1 className="text-2xl font-extrabold text-slate-900  tracking-tight whitespace-nowrap">
                Tori
              </h1>
            </div>
          )}
          {isTrial ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100  text-amber-700  whitespace-nowrap">
              Pro · Trial {diasRestantes}d
            </span>
          ) : plan === 'pro' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-sky-600 to-indigo-600 text-white whitespace-nowrap">
              Pro
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200  text-slate-500  whitespace-nowrap">
              Básico
            </span>
          )}
        </div>

        <div id="stats-portal" className="flex-1 text-center" />

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            data-tour="compartir"
            onClick={onCompartir}
            className="
              px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold
              bg-white 
              border border-slate-200 
              text-slate-700 
              hover:bg-slate-50 :bg-slate-700
              hover:border-sky-500 :border-sky-500
              hover:text-sky-700 :text-sky-300
              transition-all duration-200
              shrink-0
            "
          >
            <span className="hidden sm:inline">Compartir formulario</span>
            <span className="sm:hidden">Compartir</span>
          </button>

          <button
            onClick={onConfig}
            className="
              px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold
              bg-gradient-to-r from-sky-600 to-indigo-600
              text-white
              hover:shadow-lg hover:shadow-sky-500/20
              hover:scale-[1.02]
              transition-all duration-200
              shrink-0
            "
          >
            <span className="hidden sm:inline">Configuración</span>
            <span className="sm:hidden">Config</span>
          </button>

        </div>
      </div>
      {isTrial && diasRestantes !== null && diasRestantes <= 5 && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="rounded-xl bg-amber-50  border border-amber-200  px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-amber-800 ">
              {diasRestantes === 0
                ? 'Tu prueba gratuita termina hoy. Actualiza a Pro para no perder tus funciones.'
                : `Tu prueba gratuita termina en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}.`}
            </p>
            <button
              onClick={onUpgrade}
              className="shrink-0 text-xs font-semibold text-amber-800  underline hover:no-underline"
            >
              Ver planes
            </button>
          </div>
        </div>
      )}
      {!isTrial && plan === 'basic' && !diasRestantes && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="rounded-xl bg-slate-100  border border-slate-200  px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-600 ">
              Estás en el plan Básico. Actualiza a Pro para envíos ilimitados y más funciones.
            </p>
          <button
            onClick={onUpgrade}
            className="shrink-0 text-xs font-semibold text-sky-600  underline hover:no-underline"
          >
            Ver planes
          </button>
          </div>
        </div>
      )}
    </div>
  )
}
