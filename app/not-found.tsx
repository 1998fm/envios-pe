import Link from 'next/link'
import ToriMascot from '@/components/ToriMascot'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <ToriMascot variant="notfound" size={120} animate />
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">404</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Tori no encuentra esta página. Parece que se perdió como el mapa que tiene.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
