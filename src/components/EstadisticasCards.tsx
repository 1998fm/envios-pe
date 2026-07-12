type Props = {
  hoy: number
  semana: number
  mes: number
  metodoPopular: { metodo: string; count: number } | null
  mostrarGraficos: boolean
  onToggleGraficos: () => void
}

export default function EstadisticasCards({ hoy, semana, mes, metodoPopular, mostrarGraficos, onToggleGraficos }: Props) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-2 sm:gap-x-4 text-xs text-slate-500 dark:text-slate-400">
      <span>Hoy: <strong className="text-slate-800 dark:text-slate-200">{hoy}</strong></span>
      <span>Semana: <strong className="text-slate-800 dark:text-slate-200">{semana}</strong></span>
      <span>Mes: <strong className="text-slate-800 dark:text-slate-200">{mes}</strong></span>
      {metodoPopular && (
        <span>Más usado: <strong className="text-slate-800 dark:text-slate-200">{metodoPopular.metodo}</strong> ({metodoPopular.count})</span>
      )}
      <button
        onClick={onToggleGraficos}
        className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        {mostrarGraficos ? '▲' : '▼'}
      </button>
    </div>
  )
}
