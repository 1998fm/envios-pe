'use client'

import ToriMascot from '@/components/ToriMascot'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: Props) {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <ToriMascot variant="error" size={100} animate />
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Algo salió mal
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tori se disculpa. Ocurrió un error inesperado.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
        >
          Intentar de nuevo
        </button>
        {error.digest && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Código: {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
