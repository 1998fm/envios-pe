interface Props {
  total: number
  cobrar: number
  noCobrar: number
}

export default function ResumenCopiarDatos({ total, cobrar, noCobrar }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
          Pedidos
        </p>
        <h2 className="text-4xl font-extrabold mt-2 text-sky-600 dark:text-sky-400">
          {total}
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
          Cobrar envío
        </p>
        <h2 className="text-4xl font-extrabold mt-2 text-emerald-600 dark:text-emerald-400">
          {cobrar}
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
          No cobrar
        </p>
        <h2 className="text-4xl font-extrabold mt-2 text-red-600 dark:text-red-400">
          {noCobrar}
        </h2>
      </div>
    </div>
  )
}
