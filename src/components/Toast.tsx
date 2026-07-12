type Props = {
  mensaje: string
}

export default function Toast({ mensaje }: Props) {
  if (!mensaje) return null

  return (
    <div className="
      fixed top-5 left-1/2 -translate-x-1/2 z-50
      bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
      border border-slate-200 dark:border-slate-700
      px-5 py-3 rounded-xl shadow-xl
      font-medium text-sm
      animate-fade-in-up
    ">
      {mensaje}
    </div>
  )
}
