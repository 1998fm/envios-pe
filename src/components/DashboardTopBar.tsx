'use client'

import { LogOut, Share2 } from 'lucide-react'
import LogoTori from '@/components/LogoTori'

type Props = {
  logoUrl?: string | null
  plan?: string
  diasRestantes?: number | null
  onCompartir: () => void
  onUpgrade: () => void
  onLogout: () => void
}

export default function DashboardTopBar({ logoUrl, plan, diasRestantes, onCompartir, onUpgrade, onLogout }: Props) {
  const isTrial = diasRestantes != null && (plan === 'pro' || plan === 'business_plus')
  const chip = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap'

  return (
    <div data-tour="topbar">
      {/* En celular el logo y el plan se encogen y "Compartir" queda como ícono: antes la
          barra medía más que la pantalla y toda la página se desplazaba de lado. */}
      <div className="mb-4 flex items-center justify-between gap-2 px-1 sm:mb-6 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 sm:flex-none">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-9 max-w-[110px] shrink-0 object-contain sm:h-12 sm:max-w-[180px]"
            />
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <LogoTori size={32} />
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap sm:text-2xl">
                Tori
              </h1>
            </div>
          )}
          <div className="min-w-0">
            {isTrial ? (
              <span className={`${chip} bg-amber-100 text-amber-700`}>
                Plus · Trial {diasRestantes}d
              </span>
            ) : plan === 'business_plus' ? (
              <span className={`${chip} bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white`}>Plus</span>
            ) : (
              <span className={`${chip} bg-slate-200 text-slate-500`}>Básico</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <button
            data-tour="compartir"
            onClick={onCompartir}
            aria-label="Compartir formulario"
            title="Compartir formulario"
            className="flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-0 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-sky-500 hover:bg-slate-50 hover:text-sky-700 sm:h-auto sm:px-4 sm:py-2.5"
          >
            <Share2 size={17} className="sm:hidden" />
            <span className="hidden sm:inline">Compartir formulario</span>
          </button>

          <button onClick={onUpgrade} className="rounded-xl px-2 py-2 text-xs font-bold text-tori-700 hover:bg-tori-50 sm:px-3 sm:text-sm" aria-label="Ver planes">Planes</button>

          <button
            onClick={onLogout}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
