type Props = {
  mensaje: string
}

export default function Toast({ mensaje }: Props) {
  if (!mensaje) return null

  return (
    <div className="
      fixed top-5 left-1/2 -translate-x-1/2 z-50
      bg-white  text-slate-900 
      border border-slate-200 
      px-5 py-3 rounded-xl shadow-xl
      font-medium text-sm
      animate-fade-in-up
    ">
      {mensaje}
    </div>
  )
}
