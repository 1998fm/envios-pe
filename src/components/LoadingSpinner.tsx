'use client'

import ToriMascot from '@/components/ToriMascot'

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
        <ToriMascot variant="loading" animate size={48} />
        <span className="text-sm font-medium">Cargando...</span>
      </div>
    </div>
  )
}
