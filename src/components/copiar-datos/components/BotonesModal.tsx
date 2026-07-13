import { Check, ClipboardCopy, FileSpreadsheet } from 'lucide-react'

interface Props {
  onCopiar: () => void
  onExportar: () => void
  onCerrar: () => void
  copiado: boolean
}

export default function BotonesModal({ onCopiar, onExportar, onCerrar, copiado }: Props) {
  const btnClass = `
    inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
    bg-white 
    border border-slate-200 
    text-slate-700 
    hover:bg-gradient-to-r hover:from-sky-600 hover:to-indigo-600
    hover:text-white hover:border-transparent
    hover:shadow-lg hover:shadow-sky-500/20
    transition-all duration-200
  `

  return (
    <div className="shrink-0 border-t border-slate-200  px-6 sm:px-8 py-5 flex justify-end gap-3 flex-wrap bg-white ">
      <button onClick={onCerrar} className={btnClass}>
        Cancelar
      </button>

      <button onClick={onExportar} className={btnClass}>
        <FileSpreadsheet size={16} />
        Exportar Excel
      </button>

      <button onClick={onCopiar} disabled={copiado} className={`${btnClass} disabled:opacity-60 disabled:hover:bg-none disabled:hover:text-slate-700 :hover:text-slate-300`}>
        {copiado ? <Check size={16} /> : <ClipboardCopy size={16} />}
        {copiado ? 'Copiado' : 'Copiar datos'}
      </button>
    </div>
  )
}
