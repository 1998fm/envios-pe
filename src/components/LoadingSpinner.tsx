'use client'

import ToriMascot from '@/components/ToriMascot'

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-slate-50  flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400 ">
        <ToriMascot variant="loading" animate size={48} />
        <span className="text-sm font-medium">Cargando...</span>
      </div>
    </div>
  )
}
